"""
DPR Image Extraction & AI Explainer Engine
Extracts embedded images and drawings from DPR PDFs, classifies image types
(diagrams, maps, charts, tables, site photos), and generates deep technical AI explanations.
"""

import os
import re
import io
import json
import base64
from typing import List, Dict, Any, Optional
from datetime import datetime

try:
    import pymupdf as fitz
    HAS_FITZ = True
except ImportError:
    try:
        import fitz
        HAS_FITZ = True
    except ImportError:
        HAS_FITZ = False

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

IMAGES_BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads", "dpr_images")


def _classify_image(width: int, height: int, page_text: str, page_num: int, filename: str) -> tuple[str, str]:
    """
    Classify image into engineering category and determine domain context.
    Categories: 'map', 'diagram', 'chart', 'table_image', 'site_photo', 'drawing', 'general'
    """
    text_lower = page_text.lower() if page_text else ""
    aspect_ratio = width / max(height, 1)

    # 1. Map detection
    if any(k in text_lower for k in ["alignment", "satellite", "key plan", "corridor", "route map", "bypass", "index map", "location plan", "gis", "nh-", "sh-", "chainage"]):
        return "map", "Alignment & Location Map"

    # 2. Engineering diagram detection
    if any(k in text_lower for k in ["cross section", "typical cross", "tcs", "pavement composition", "bridge elevation", "culvert", "structural drawing", "longitudinal section", "drain", "retaining wall", "embankment", "schematic"]):
        return "diagram", "Engineering Design Schematic"

    # 3. Chart / Graph detection
    if any(k in text_lower for k in ["traffic growth", "traffic volume", "cvpd", "cbr curve", "compaction", "cost breakdown", "pie chart", "bar chart", "flowchart", "schedule", "trend"]):
        return "chart", "Statistical / Engineering Chart"

    # 4. Table converted as image
    if any(k in text_lower for k in ["bill of quantities", "boq", "schedule of rates", "abstract of cost", "rate analysis", "check list", "face sheet", "clearance status", "matrix"]):
        return "table_image", "Tabular Cost / Specification Sheet"

    # 5. Site photo detection (standard camera aspect ratios 4:3, 16:9 or keywords)
    if any(k in text_lower for k in ["site photograph", "existing condition", "inspection photo", "pavement distress", "site view", "inspection of site"]):
        return "site_photo", "Site Inspection Photograph"

    # Shape heuristics
    if aspect_ratio > 1.6 and width > 800:
        return "diagram", "Wide Strip Drawing / Alignment"
    if height > width * 1.3:
        return "table_image", "Vertical Specification Sheet"
    if width >= 600 and height >= 400:
        return "diagram", "Technical Illustration"

    return "general", "Project Visual Asset"


def _generate_technical_domain_caption(img_type: str, page_text: str, page_num: int, project_title: str, width: int, height: int) -> tuple[str, List[str]]:
    """
    Generate deep, domain-specific technical explanation for Karnataka PWD DPR images.
    """
    p_clean = page_text.strip() if page_text else ""
    first_lines = [l.strip() for l in p_clean.split('\n') if l.strip() and not l.strip().startswith('%')][:4]
    context_hint = " — ".join(first_lines) if first_lines else f"Section on Page {page_num}"
    tags = []

    if img_type == "map":
        tags = ["Corridor Alignment", "Route Map", "GIS Survey", "Karnataka PWD"]
        desc = (
            f"**Project Alignment & Route Map (Page {page_num})**: Illustrates the proposed corridor alignment and right-of-way for **{project_title}**. "
            f"Shows highway alignment chainages, intersection geometries, bypass bypasses, and adjoining administrative boundaries. "
            f"Context: *{context_hint[:140]}*. Key engineering considerations include Right-of-Way (RoW) demarcation and eco-sensitive zone clearances."
        )
    elif img_type == "diagram":
        tags = ["Engineering Diagram", "Cross-Section", "Structural Detail", "IRC Standards"]
        desc = (
            f"**Engineering Design Schematic (Page {page_num})**: Technical cross-section and structural detailing for **{project_title}**. "
            f"Depicts carriageway layout, pavement structural layer thicknesses (BC, DBM, WMM, GSB), side slope geometry, and roadside drainage conduits conforming to IRC design guidelines. "
            f"Context: *{context_hint[:140]}*."
        )
    elif img_type == "chart":
        tags = ["Data Analysis", "Traffic Projection", "Performance Curves", "Cost Trend"]
        desc = (
            f"**Statistical Analysis & Projection Chart (Page {page_num})**: Visual representation of project analytics for **{project_title}**. "
            f"Graphically depicts projected traffic growth (CVPD / MSA), geotechnical CBR soil compaction test curves, or cumulative project expenditure timelines over the concession/design period. "
            f"Context: *{context_hint[:140]}*."
        )
    elif img_type == "table_image":
        tags = ["BOQ Table", "Cost Abstract", "Schedule of Rates", "Financials"]
        desc = (
            f"**Tabular Specification & BOQ Summary (Page {page_num})**: Formatted parameter table extracted from the Detailed Project Report for **{project_title}**. "
            f"Contains itemized quantities, unit rates benchmarked to Karnataka PWD Schedule of Rates (KPWD SR 2025-26), civil works estimates, and statutory fee allocations. "
            f"Context: *{context_hint[:140]}*."
        )
    elif img_type == "site_photo":
        tags = ["Site Photo", "Field Inspection", "Pavement Condition", "Survey"]
        desc = (
            f"**Site Inspection Photographic Record (Page {page_num})**: Field ground photograph documenting existing alignment conditions for **{project_title}**. "
            f"Captures current carriageway condition, utility encroachments, terrain features, and existing cross-drainage structures requiring rehabilitation."
        )
    else:
        tags = ["Visual Asset", "DPR Figure", "Page Illustration"]
        desc = (
            f"**DPR Visual Asset & Drawing (Page {page_num})**: Technical illustration from the Detailed Project Report for **{project_title}** ({width}×{height} px). "
            f"Contextualized with *{context_hint[:140]}*."
        )

    return desc, tags


def generate_image_explanation(image_info: Dict[str, Any], page_text: str = "", project_meta: Dict[str, Any] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Generate AI-based technical explanation for an image using Groq/OpenAI/Gemini LLM
    or intelligent deterministic Karnataka PWD domain explainer.
    """
    meta = project_meta or {}
    project_title = meta.get("title") or "Karnataka PWD Infrastructure Project"
    page_num = image_info.get("page_number", 1)
    width = image_info.get("width", 800)
    height = image_info.get("height", 600)
    filename = image_info.get("filename", "")

    img_type, type_label = _classify_image(width, height, page_text, page_num, filename)

    # 1. Attempt LLM captioning if Groq API key is available
    if api_key and len(api_key.strip()) > 10 and len(page_text.strip()) > 20:
        try:
            import urllib.request

            prompt = (
                f"You are an expert civil engineer and DPR reviewer for Karnataka Public Works Department (PWD).\n"
                f"Generate a concise, professional, 2-to-3 sentence technical explanation for an image extracted from a DPR.\n"
                f"Project: {project_title}\n"
                f"Page Number: {page_num}\n"
                f"Image Classification: {type_label} ({img_type})\n"
                f"Surrounding Page Text:\n{page_text[:600]}\n\n"
                f"Provide: (1) An informative description explaining what this diagram/chart/map/photo shows and its engineering significance, and (2) 3-4 comma-separated tags."
            )

            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2,
                "max_tokens": 200,
            }

            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/chat/completions",
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {api_key.strip()}",
                    "Content-Type": "application/json",
                    "User-Agent": "KarnatakaPWD-DPR-AI/1.0"
                },
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=12) as response:
                res_json = json.loads(response.read().decode("utf-8"))
                if "choices" in res_json and len(res_json["choices"]) > 0:
                    reply = res_json["choices"][0]["message"]["content"].strip()
                    return {
                        "image_type": img_type,
                        "type_label": type_label,
                        "ai_description": reply,
                        "ai_tags": [img_type.capitalize(), "Karnataka PWD", f"Page {page_num}"]
                    }
        except Exception:
            pass

    # 2. Local deterministic Karnataka PWD domain captioning
    desc, tags = _generate_technical_domain_caption(img_type, page_text, page_num, project_title, width, height)
    return {
        "image_type": img_type,
        "type_label": type_label,
        "ai_description": desc,
        "ai_tags": tags
    }


def extract_images_from_pdf(pdf_path: str, project_id: str, pages_data: Optional[List[Dict[str, Any]]] = None,
                            project_meta: Optional[Dict[str, Any]] = None, api_key: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Extract all embedded images and drawing diagrams from the PDF.
    Saves image files to uploads/dpr_images/<project_id>/ and generates AI descriptions.
    
    Returns list of image dicts:
      - dpr_id: str
      - page_number: int
      - image_index: int
      - filename: str
      - image_url: str
      - width: int
      - height: int
      - position_y: float
      - image_type: str
      - type_label: str
      - ai_description: str
      - ai_tags: List[str]
      - upload_timestamp: str
    """
    if not HAS_FITZ or not os.path.isfile(pdf_path):
        return []

    project_img_dir = os.path.join(IMAGES_BASE_DIR, project_id)
    os.makedirs(project_img_dir, exist_ok=True)

    extracted_images: List[Dict[str, Any]] = []
    upload_timestamp = datetime.utcnow().isoformat() + "Z"

    # Map page number to extracted page text for contextual caption generation
    page_text_map = {}
    if pages_data:
        for p in pages_data:
            page_text_map[p.get("page_number", 1)] = p.get("extracted_text") or p.get("page_text") or p.get("text") or ""

    try:
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        seen_xrefs = set()

        for page_idx in range(total_pages):
            page = doc[page_idx]
            page_num = page_idx + 1
            page_text = page_text_map.get(page_num, "")
            
            # 1. Extract embedded raster images
            image_list = page.get_images(full=True)
            img_index_on_page = 1

            for img_info in image_list:
                xref = img_info[0]
                if xref in seen_xrefs:
                    continue

                try:
                    base_image = doc.extract_image(xref)
                    if not base_image:
                        continue

                    img_bytes = base_image.get("image")
                    ext = base_image.get("ext", "png")
                    width = base_image.get("width", 0)
                    height = base_image.get("height", 0)

                    # Filter out tiny icon artifacts / 1x1 pixels
                    if width < 50 or height < 50 or len(img_bytes) < 800:
                        continue

                    # Get vertical position on the page
                    rects = page.get_image_rects(xref)
                    pos_y = float(rects[0].y0) if rects else float(img_index_on_page * 100)

                    filename = f"page_{page_num}_img_{img_index_on_page}.{ext}"
                    filepath = os.path.join(project_img_dir, filename)

                    with open(filepath, "wb") as f:
                        f.write(img_bytes)

                    seen_xrefs.add(xref)

                    # Generate AI explanation & classification
                    img_data_stub = {
                        "dpr_id": project_id,
                        "page_number": page_num,
                        "image_index": img_index_on_page,
                        "filename": filename,
                        "width": width,
                        "height": height,
                    }
                    ai_meta = generate_image_explanation(img_data_stub, page_text, project_meta, api_key=api_key)

                    image_url = f"/api/dpr/{project_id}/images/{filename}"

                    extracted_images.append({
                        "dpr_id": project_id,
                        "page_number": page_num,
                        "image_index": img_index_on_page,
                        "filename": filename,
                        "image_url": image_url,
                        "image_path": filepath,
                        "width": width,
                        "height": height,
                        "position_y": pos_y,
                        "image_type": ai_meta["image_type"],
                        "type_label": ai_meta["type_label"],
                        "ai_description": ai_meta["ai_description"],
                        "ai_tags": ai_meta["ai_tags"],
                        "upload_timestamp": upload_timestamp
                    })
                    img_index_on_page += 1
                except Exception as ie:
                    print(f"[ImageExplainer] Note on page {page_num} xref {xref}: {ie}")

            # 2. If page has no raster images but contains drawings/blueprints, render drawing crop
            if img_index_on_page == 1 and (len(page_text.strip()) < 40 or "drawing" in page_text.lower() or "schematic" in page_text.lower()):
                try:
                    drawings = page.get_drawings()
                    if drawings and len(drawings) > 10:
                        pix = page.get_pixmap(dpi=150)
                        filename = f"page_{page_num}_drawing.png"
                        filepath = os.path.join(project_img_dir, filename)
                        pix.save(filepath)

                        img_data_stub = {
                            "dpr_id": project_id,
                            "page_number": page_num,
                            "image_index": 1,
                            "filename": filename,
                            "width": pix.width,
                            "height": pix.height,
                        }
                        ai_meta = generate_image_explanation(img_data_stub, page_text, project_meta, api_key=api_key)
                        image_url = f"/api/dpr/{project_id}/images/{filename}"

                        extracted_images.append({
                            "dpr_id": project_id,
                            "page_number": page_num,
                            "image_index": 1,
                            "filename": filename,
                            "image_url": image_url,
                            "image_path": filepath,
                            "width": pix.width,
                            "height": pix.height,
                            "position_y": 50.0,
                            "image_type": "diagram",
                            "type_label": "Vector Engineering Drawing",
                            "ai_description": ai_meta["ai_description"],
                            "ai_tags": ["Vector Drawing", "Blueprint", "Karnataka PWD"],
                            "upload_timestamp": upload_timestamp
                        })
                except Exception:
                    pass

        doc.close()
    except Exception as e:
        print(f"[ImageExplainer] Error processing PDF images for project {project_id}: {e}")

    return extracted_images
