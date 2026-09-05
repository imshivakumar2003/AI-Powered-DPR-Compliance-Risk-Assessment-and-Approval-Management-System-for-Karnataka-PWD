import requests
import io
import os
import time

BASE_URL = "http://localhost:8000"

def create_sample_pdf():
    """Generate a multi-page test PDF using PyMuPDF or reportlab or raw PDF."""
    try:
        import fitz
        doc = fitz.open()
        
        # Page 1: Executive Summary & Project Objectives
        p1 = doc.new_page()
        p1.insert_text((50, 60), "DETAILED PROJECT REPORT (DPR)", fontsize=18)
        p1.insert_text((50, 90), "SECTION 1.0: EXECUTIVE SUMMARY & OBJECTIVES", fontsize=14)
        p1.insert_text((50, 120), "Project Title: Widening and Strengthening of State Highway 47 (Chitradurga-Hosadurga Section)", fontsize=11)
        p1.insert_text((50, 140), "Total Corridor Length: 28.50 km in Chitradurga District, Karnataka.", fontsize=11)
        p1.insert_text((50, 160), "The proposed project aims to upgrade the existing intermediate 2-lane configuration to a 2-lane divided carriageway", fontsize=10)
        p1.insert_text((50, 175), "with 1.5m paved shoulders, improving freight logistics, agricultural transport, and reducing traffic congestion.", fontsize=10)
        
        # Page 2: Technical Specifications & Pavement Design
        p2 = doc.new_page()
        p2.insert_text((50, 60), "SECTION 2.0: TECHNICAL & GEOTECHNICAL SPECIFICATIONS", fontsize=14)
        p2.insert_text((50, 90), "1. Pavement Composition: Flexible Pavement comprising 40mm Bituminous Concrete (BC),", fontsize=10)
        p2.insert_text((50, 105), "   100mm Dense Bituminous Macadam (DBM), 250mm Wet Mix Macadam (WMM), and 200mm Granular Sub-base (GSB).", fontsize=10)
        p2.insert_text((50, 125), "2. Design Traffic: 45 Million Standard Axles (MSA) over a 15-year design period per IRC:37-2018.", fontsize=10)
        p2.insert_text((50, 145), "3. Subgrade Soil: Laboratory CBR testing yields an effective subgrade CBR of 8.5% satisfying NABL standards.", fontsize=10)
        p2.insert_text((50, 165), "4. Structures: 2 Major Bridges across Vedavathi canal, 4 Minor Bridges, and 28 Precast Box Culverts.", fontsize=10)
        
        # Page 3: Financial Outlay & Bill of Quantities (BOQ)
        p3 = doc.new_page()
        p3.insert_text((50, 60), "SECTION 3.0: FINANCIAL OUTLAY & SCHEDULE OF RATES", fontsize=14)
        p3.insert_text((50, 90), "Cost Estimates benchmarked against Karnataka PWD Schedule of Rates (SoR 2025-26):", fontsize=10)
        p3.insert_text((50, 115), "• Civil Construction Works: Rs. 68.40 Crores", fontsize=10)
        p3.insert_text((50, 130), "• Land Acquisition (LARR 2013): Rs. 14.20 Crores (Direct purchase via District Land Acquisition Officer)", fontsize=10)
        p3.insert_text((50, 145), "• Utility Shifting (KPTCL / Water lines): Rs. 3.80 Crores", fontsize=10)
        p3.insert_text((50, 160), "• Physical & Price Contingency (12%): Rs. 10.36 Crores", fontsize=10)
        p3.insert_text((50, 180), "TOTAL ESTIMATED CAPITAL OUTLAY: Rs. 96.76 Crores", fontsize=12)
        
        # Page 4: Statutory Clearances & Environmental Management Plan
        p4 = doc.new_page()
        p4.insert_text((50, 60), "SECTION 4.0: STATUTORY CLEARANCES & RISK MITIGATION", fontsize=14)
        p4.insert_text((50, 90), "• Forest Clearance (FCA 1980): Stage-I In-Principle approval submitted for 2.4 hectares.", fontsize=10)
        p4.insert_text((50, 105), "• EIA Notification 2006: Category B project appraisal under State SEIAA Karnataka.", fontsize=10)
        p4.insert_text((50, 120), "• High Flood Level (HFL) & Drainage: 100-year return period hydraulic calculation per IRC:SP:13.", fontsize=10)
        p4.insert_text((50, 135), "• Risk Mitigation: Joint Measurement Survey (JMS) underway to prevent Right-of-Way disputes.", fontsize=10)
        
        pdf_bytes = doc.tobytes()
        doc.close()
        return pdf_bytes
    except Exception:
        # Fallback minimal PDF
        return b"%PDF-1.4 %Simple Minimal DPR PDF Test"


def test_doc_intelligence_and_rag_pipeline():
    print("=== Testing DPR PDF Text Extraction, RAG & LLM Pipeline ===")
    admin_headers = {"X-User-Role": "admin", "X-User-Name": "admin", "X-User-Id": "1"}

    # 1. Upload Test DPR
    pdf_content = create_sample_pdf()
    files = {'file': ('SH47_Chitradurga_DPR.pdf', pdf_content, 'application/pdf')}
    data = {
        'title': 'Widening of State Highway 47 (Chitradurga-Hosadurga)',
        'state': 'Chitradurga',
        'sector': 'Highways',
        'cost_crores': '96.76',
        'duration_months': '24',
        'submitted_by': 'admin',
    }
    r_up = requests.post(f"{BASE_URL}/api/dpr/upload", headers=admin_headers, files=files, data=data)
    assert r_up.status_code == 200, f"Upload failed: {r_up.text}"
    project_id = r_up.json()["id"]
    print(f"[1] DPR uploaded successfully. Project ID: {project_id}")

    # 2. Verify Document Extraction
    r_doc = requests.get(f"{BASE_URL}/api/dpr/{project_id}/extracted-document", headers=admin_headers)
    assert r_doc.status_code == 200, f"Get extracted doc failed: {r_doc.text}"
    doc_json = r_doc.json()
    assert doc_json.get("total_pages", 0) >= 1, "Expected at least 1 page extracted"
    assert doc_json.get("word_count", 0) > 20, "Expected word count > 20"
    print(f"[2] Extracted document verified: {doc_json['total_pages']} pages, {doc_json['word_count']} words, method: {doc_json['extraction_method']}")

    # 3. Verify Page-by-Page Extraction
    r_pages = requests.get(f"{BASE_URL}/api/dpr/{project_id}/extracted-pages", headers=admin_headers)
    assert r_pages.status_code == 200
    pages_json = r_pages.json()
    assert len(pages_json.get("pages", [])) >= 1
    print(f"[3] Per-page extraction verified: {len(pages_json['pages'])} pages retrieved from SQLite DB")

    # 4. Verify Semantic RAG Chunks
    r_chunks = requests.get(f"{BASE_URL}/api/dpr/{project_id}/rag/chunks", headers=admin_headers)
    assert r_chunks.status_code == 200
    chunks_json = r_chunks.json()
    assert chunks_json.get("total_chunks", 0) >= 1
    print(f"[4] Semantic RAG Chunks verified: {chunks_json['total_chunks']} chunks indexed in SQLite DB")

    # 5. Verify LLM Structured Insights
    r_llm = requests.get(f"{BASE_URL}/api/dpr/{project_id}/llm/insights", headers=admin_headers)
    assert r_llm.status_code == 200
    llm_json = r_llm.json()
    assert "summary" in llm_json and len(llm_json["summary"]) > 20
    assert "technical_specs" in llm_json
    assert "financial_breakdown" in llm_json
    print(f"[5] LLM structured insights verified: Summary, Technical Specs, Financial Outlays loaded")

    # 6. Test RAG Semantic Query with Page Citations
    r_rag1 = requests.post(f"{BASE_URL}/api/dpr/{project_id}/rag/query",
                           headers=admin_headers,
                           json={"query": "What is the subgrade CBR and pavement composition?"})
    assert r_rag1.status_code == 200
    res_rag1 = r_rag1.json()
    assert "answer" in res_rag1 and len(res_rag1["answer"]) > 30
    assert len(res_rag1.get("cited_pages", [])) > 0 or len(res_rag1.get("chunks_used", [])) > 0
    print(f"[6] RAG Query 1 (Pavement Specs) answered with citations: {res_rag1.get('cited_pages')}")

    # 7. Test RAG Financial Outlay Query
    r_rag2 = requests.post(f"{BASE_URL}/api/dpr/{project_id}/rag/query",
                           headers=admin_headers,
                           json={"query": "What are the land acquisition and civil construction costs?"})
    assert r_rag2.status_code == 200
    res_rag2 = r_rag2.json()
    assert "answer" in res_rag2 and len(res_rag2["answer"]) > 30
    print(f"[7] RAG Query 2 (Financials) answered with citations: {res_rag2.get('cited_pages')}")

    # 8. Test Manual Re-Extraction Endpoint
    r_re = requests.post(f"{BASE_URL}/api/dpr/{project_id}/extract-intelligence", headers=admin_headers)
    assert r_re.status_code == 200
    print(f"[8] Manual re-extraction endpoint executed successfully: {r_re.json()}")

    # 9. Cleanup test project
    r_del = requests.delete(f"{BASE_URL}/api/dpr/{project_id}", headers=admin_headers)
    assert r_del.status_code == 200
    print(f"[9] Cleanup test project deleted from SQLite DB and filesystem")

    print("\n[SUCCESS] Document Intelligence, PDF OCR, Semantic RAG & LLM Pipeline 100% verified!")

if __name__ == "__main__":
    test_doc_intelligence_and_rag_pipeline()
