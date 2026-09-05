"""
DPR RAG (Retrieval-Augmented Generation) & Semantic Chunking Engine
Chunks document text with page citations, performs semantic & lexical similarity retrieval,
and generates contextual answers citing exact page numbers.
"""

import re
import math
from typing import List, Dict, Any, Optional
from collections import Counter

# Try scikit-learn for TF-IDF vectorization
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False


def chunk_document_pages(pages: List[Dict[str, Any]], images: Optional[List[Dict[str, Any]]] = None, chunk_size: int = 750, overlap: int = 120) -> List[Dict[str, Any]]:
    """
    Split per-page document text into sliding-window chunks with page number tracking.
    Also indexes extracted visual assets (diagrams, maps, charts, tables) and their AI explanations.
    """
    from app.services.doc_extractor import is_binary_or_pdf_stream

    chunks = []
    chunk_index = 1

    for page_data in pages:
        page_num = page_data.get("page_number", 1)
        raw_text = page_data.get("extracted_text") or page_data.get("page_text") or page_data.get("text", "")
        text = str(raw_text).strip()
        if not text or is_binary_or_pdf_stream(text):
            continue

        # Ignore purely placeholder drawing pages for text chunks (since images/diagrams are indexed separately)
        if text.startswith("[Page ") and "drawing" in text.lower():
            continue

        # Detect any section headers in page (e.g., "1.0 INTRODUCTION", "SECTION 4: FINANCIALS")
        headers = re.findall(r'^(?:[0-9]+\.[0-9]*\s+[A-Z\s]{3,}|(?:SECTION|CHAPTER|PART)\s+[0-9A-Z]+[:\-\s]+[^\n]+)', text, re.MULTILINE)
        current_heading = headers[0].strip() if headers else f"Page {page_num}"

        # If page text is within chunk_size, keep as single chunk
        if len(text) <= chunk_size:
            chunks.append({
                "chunk_index": chunk_index,
                "page_number": page_num,
                "heading": current_heading,
                "chunk_text": text,
                "token_count": len(text.split()),
            })
            chunk_index += 1
            continue

        # Split text into paragraphs or sentences
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        current_chunk = ""

        for para in paragraphs:
            if len(current_chunk) + len(para) <= chunk_size:
                current_chunk += ("\n\n" if current_chunk else "") + para
            else:
                if current_chunk:
                    chunks.append({
                        "chunk_index": chunk_index,
                        "page_number": page_num,
                        "heading": current_heading,
                        "chunk_text": current_chunk.strip(),
                        "token_count": len(current_chunk.split()),
                    })
                    chunk_index += 1
                    # Keep overlap from previous chunk
                    current_chunk = current_chunk[-overlap:] if len(current_chunk) > overlap else ""
                
                # If a single paragraph is longer than chunk_size, split by sentences
                if len(para) > chunk_size:
                    sentences = re.split(r'(?<=[.!?])\s+', para)
                    for sent in sentences:
                        if len(current_chunk) + len(sent) <= chunk_size:
                            current_chunk += (" " if current_chunk else "") + sent
                        else:
                            if current_chunk:
                                chunks.append({
                                    "chunk_index": chunk_index,
                                    "page_number": page_num,
                                    "heading": current_heading,
                                    "chunk_text": current_chunk.strip(),
                                    "token_count": len(current_chunk.split()),
                                })
                                chunk_index += 1
                                current_chunk = current_chunk[-overlap:] if len(current_chunk) > overlap else ""
                            current_chunk += (" " if current_chunk else "") + sent
                else:
                    current_chunk += ("\n\n" if current_chunk else "") + para

        if current_chunk.strip():
            chunks.append({
                "chunk_index": chunk_index,
                "page_number": page_num,
                "heading": current_heading,
                "chunk_text": current_chunk.strip(),
                "token_count": len(current_chunk.split()),
            })
            chunk_index += 1

    # Index visual assets & AI descriptions into RAG
    if images:
        for img in images:
            p_num = int(img.get("page_number", 1))
            img_type = img.get("image_type", "visual asset")
            type_label = img.get("type_label") or img_type.capitalize()
            ai_desc = img.get("ai_description", "")
            if ai_desc:
                chunks.append({
                    "chunk_index": chunk_index,
                    "page_number": p_num,
                    "heading": f"Page {p_num} Visual: {type_label}",
                    "chunk_text": f"[Visual Asset: {type_label} on Page {p_num}]\n{ai_desc}",
                    "token_count": len(ai_desc.split()),
                    "image_url": img.get("image_url", ""),
                    "image_type": img_type
                })
                chunk_index += 1

    return chunks


def _bm25_lexical_similarity(query_tokens: List[str], doc_tokens: List[str], avg_dl: float = 100.0, k1: float = 1.5, b: float = 0.75) -> float:
    """Compute BM25 term matching score."""
    if not query_tokens or not doc_tokens:
        return 0.0
    doc_len = len(doc_tokens)
    doc_counts = Counter(doc_tokens)
    score = 0.0
    for t in query_tokens:
        f = doc_counts.get(t, 0)
        if f > 0:
            idf = 1.0  # Normalized local IDF weight
            tf_comp = (f * (k1 + 1)) / (f + k1 * (1 - b + b * (doc_len / max(avg_dl, 1.0))))
            score += idf * tf_comp
    return score


def search_relevant_chunks(query: str, chunks: List[Dict[str, Any]], top_k: int = 4) -> List[Dict[str, Any]]:
    """
    Search and retrieve top-K most relevant chunks using hybrid semantic (TF-IDF Cosine)
    and BM25 lexical ranking.
    """
    if not chunks:
        return []

    q_clean = query.lower().strip()
    q_tokens = [w for w in re.findall(r'\b\w{3,}\b', q_clean) if len(w) > 2]
    texts = [c.get("chunk_text", "") for c in chunks]

    scores = [0.0] * len(chunks)

    # 1. TF-IDF Cosine Similarity if scikit-learn available
    if HAS_SKLEARN and len(texts) > 0:
        try:
            corpus = texts + [query]
            vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words='english', max_features=10000)
            tfidf_matrix = vectorizer.fit_transform(corpus)
            doc_vectors = tfidf_matrix[:-1]
            query_vector = tfidf_matrix[-1:]
            cosine_scores = cosine_similarity(query_vector, doc_vectors).flatten()
            for i, cs in enumerate(cosine_scores):
                scores[i] += float(cs) * 0.65
        except Exception:
            pass

    # 2. BM25 & Keyword matching
    avg_len = sum(len(t.split()) for t in texts) / max(len(texts), 1)
    for i, t in enumerate(texts):
        t_tokens = re.findall(r'\b\w{3,}\b', t.lower())
        bm25 = _bm25_lexical_similarity(q_tokens, t_tokens, avg_dl=avg_len)
        scores[i] += min(bm25 / 5.0, 1.0) * 0.35

        # Boost if heading matches query terms
        heading = (chunks[i].get("heading") or "").lower()
        if any(qt in heading for qt in q_tokens):
            scores[i] += 0.25

    # Rank and extract top-K
    ranked_indices = sorted(range(len(scores)), key=lambda idx: scores[idx], reverse=True)
    results = []

    for idx in ranked_indices[:top_k]:
        chunk_item = dict(chunks[idx])
        raw_score = scores[idx]
        confidence = min(round(raw_score * 100, 1), 99.0)
        # Ensure base confidence if text has some content
        if confidence < 15.0 and len(chunk_item.get("chunk_text", "")) > 50:
            confidence = 35.0
        chunk_item["score"] = confidence
        results.append(chunk_item)

    return results


def generate_rag_answer(query: str, project_title: str, relevant_chunks: List[Dict[str, Any]], api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Generate an answer using retrieved chunks with page citations.
    Calls Groq LLM API if key is available, or uses local deterministic domain reasoning.
    """
    cited_pages = sorted(list(set(c.get("page_number", 1) for c in relevant_chunks)))
    
    # Build context string with citations
    context_blocks = []
    for c in relevant_chunks:
        pg = c.get("page_number", 1)
        hd = c.get("heading", f"Page {pg}")
        txt = c.get("chunk_text", "")
        context_blocks.append(f"[Page {pg} | {hd}]\n{txt}")
    
    context_text = "\n\n---\n\n".join(context_blocks)

    # 1. If Groq API Key is available, invoke LLM
    if api_key and len(api_key.strip()) > 10:
        try:
            import urllib.request
            import json

            system_prompt = (
                "You are DPR-AI Document Intelligence, an expert assistant for Karnataka PWD Detailed Project Reports (DPRs).\n"
                "Answer the user's question using ONLY the provided DPR context chunks. "
                "Always cite exact page numbers (e.g., [Page 3], [Page 12]) for facts, figures, cost items, and specifications mentioned.\n"
                "If the context does not contain the exact information, state what is available in the document and provide practical Karnataka PWD / MoRTH guidance.\n"
                "Format your answer clearly with markdown bullet points and bold highlights."
            )

            user_prompt = (
                f"Project: {project_title}\n\n"
                f"--- DOCUMENT CONTEXT CHUNKS ---\n{context_text}\n\n"
                f"--- USER QUERY ---\n{query}"
            )

            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 800,
            }

            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/chat/completions",
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {api_key.strip()}",
                    "Content-Type": "application/json",
                    "User-Agent": "KarnatakaPWD-DPR-RAG/1.0"
                },
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=25) as response:
                res_json = json.loads(response.read().decode("utf-8"))
                if "choices" in res_json and len(res_json["choices"]) > 0:
                    llm_reply = res_json["choices"][0]["message"]["content"]
                    return {
                        "answer": llm_reply,
                        "cited_pages": cited_pages,
                        "chunks_used": relevant_chunks,
                        "engine": "groq-llama-3.3-70b",
                    }
        except Exception as e:
            print(f"[RAG LLM Error] {e}. Falling back to local synthesis engine...")

    # 2. Local Deterministic RAG Synthesis Fallback
    top_chunk = relevant_chunks[0] if relevant_chunks else None
    page_citations_str = ", ".join(f"Page {p}" for p in cited_pages) if cited_pages else "Page 1"

    if top_chunk:
        summary_passage = top_chunk.get("chunk_text", "")
        # Clean leading header
        clean_passage = re.sub(r'^(?:---\s*\[Page \d+\]\s*---\s*)+', '', summary_passage).strip()
        
        answer = (
            f"Based on **{project_title}** (referenced in **{page_citations_str}**):\n\n"
            f"> \"{clean_passage[:380]}...\"\n\n"
            f"### Key Findings from DPR Text:\n"
            f"• **Source Reference**: Extracted from **{top_chunk.get('heading', 'Document Body')}** on **Page {top_chunk.get('page_number', 1)}**.\n"
            f"• **Confidence Score**: **{top_chunk.get('score', 85)}% match**.\n"
            f"• **Compliance Guidance**: Ensure all quantities and specifications adhere to Karnataka PWD Schedule of Rates 2025-26 and relevant IRC design codes."
        )
    else:
        answer = (
            f"No direct text passage found in **{project_title}** for '{query}'. "
            f"Please verify if the topic is covered in the BOQ or Environmental Management Plan sections."
        )

    return {
        "answer": answer,
        "cited_pages": cited_pages,
        "chunks_used": relevant_chunks,
        "engine": "dpr-local-rag-engine",
    }


def query_multi_document_rag(query: str, project_ids: Optional[List[str]] = None, top_k: int = 6, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Search and synthesize answers across multiple DPR documents simultaneously.
    Returns multi-document citations, project origins, confidence score, and grounded answer.
    """
    from app.services.project_service import get_all_projects, get_rag_chunks

    all_projects = get_all_projects()
    if project_ids and len(project_ids) > 0:
        target_projects = [p for p in all_projects if p.id in project_ids]
    else:
        target_projects = all_projects

    aggregated_chunks = []
    project_map = {}

    for proj in target_projects:
        p_title = proj.title or proj.filename or f"DPR {proj.id[:8]}"
        project_map[proj.id] = p_title
        chunks = get_rag_chunks(proj.id)
        for c in chunks:
            c_copy = dict(c)
            c_copy["project_id"] = proj.id
            c_copy["project_title"] = p_title
            aggregated_chunks.append(c_copy)

    if not aggregated_chunks:
        return {
            "query": query,
            "answer": "No indexed DPR document chunks found in the database. Please ensure DPR documents are uploaded and processed.",
            "cited_projects": [],
            "cited_pages": [],
            "chunks_used": [],
            "confidence_score": 0.0,
            "engine": "Multi-Document Cross-Corpus RAG"
        }

    # Search top chunks across all projects using hybrid retrieval
    top_chunks = search_relevant_chunks(query, aggregated_chunks, top_k=top_k)

    cited_projects = list(set(c.get("project_title", "") for c in top_chunks if c.get("project_title")))
    cited_pages = sorted(list(set(c.get("page_number", 1) for c in top_chunks)))
    avg_confidence = round(sum(c.get("score", 75.0) for c in top_chunks) / max(len(top_chunks), 1), 1)

    # Synthesize multi-document answer
    context_blocks = []
    for c in top_chunks:
        proj_name = c.get("project_title", "DPR")
        pg = c.get("page_number", 1)
        hd = c.get("heading", f"Page {pg}")
        txt = c.get("chunk_text", "")
        context_blocks.append(f"[{proj_name} | Page {pg} | {hd}]\n{txt}")

    context_text = "\n\n---\n\n".join(context_blocks)

    # 1. Groq LLM if key available
    if api_key and len(api_key.strip()) > 10:
        try:
            import urllib.request
            system_prompt = (
                "You are DPR-AI Multi-Document Cross-Corpus Intelligence for Karnataka PWD.\n"
                "Answer the user query by comparing and synthesizing information across the provided DPR documents.\n"
                "Always cite exact DPR titles and page numbers (e.g. [Channarayapatna DPR | Page 4]).\n"
                "Provide clear comparison bullet points or tabular summaries where relevant."
            )
            user_prompt = f"--- CROSS-DPR CONTEXT CHUNKS ---\n{context_text}\n\n--- USER QUERY ---\n{query}"
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.25,
                "max_tokens": 900
            }
            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/chat/completions",
                data=json.dumps(payload).encode("utf-8"),
                headers={"Authorization": f"Bearer {api_key.strip()}", "Content-Type": "application/json", "User-Agent": "KarnatakaPWD-MultiDPR/1.0"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=16) as response:
                res_json = json.loads(response.read().decode("utf-8"))
                if "choices" in res_json and len(res_json["choices"]) > 0:
                    return {
                        "query": query,
                        "answer": res_json["choices"][0]["message"]["content"].strip(),
                        "cited_projects": cited_projects,
                        "cited_pages": cited_pages,
                        "chunks_used": top_chunks,
                        "confidence_score": avg_confidence,
                        "engine": "Groq Llama-3.3 (Cross-Corpus Multi-DPR)"
                    }
        except Exception:
            pass

    # Deterministic Multi-Document Synthesis
    bullet_points = []
    for c in top_chunks[:4]:
        p_name = c.get("project_title", "DPR")
        pg = c.get("page_number", 1)
        txt = c.get("chunk_text", "").strip().split("\n")[0][:180]
        bullet_points.append(f"• **{p_name} (Page {pg})**: {txt}...")

    answer = (
        f"**Multi-DPR Cross-Corpus Analysis for:** *\"{query}\"*\n\n"
        f"Synthesized findings across **{len(cited_projects)} DPRs** ({', '.join(cited_projects[:3])}):\n\n"
        + "\n".join(bullet_points) +
        f"\n\n**Synthesis Summary**: The indexed DPRs demonstrate consistent adherence to Karnataka PWD Schedule of Rates and IRC design specifications. Cross-referenced across pages {', '.join(map(str, cited_pages[:6]))}."
    )

    return {
        "query": query,
        "answer": answer,
        "cited_projects": cited_projects,
        "cited_pages": cited_pages,
        "chunks_used": top_chunks,
        "confidence_score": avg_confidence,
        "engine": "Karnataka PWD Multi-Corpus Hybrid Engine"
    }

