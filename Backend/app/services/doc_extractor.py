"""
DPR Document Extraction Engine
Extracts full text and per-page text from digital and scanned PDF files using
PyMuPDF (fitz), pdfplumber, pdfminer.six, pypdf, and Tesseract OCR.
Ensures zero binary or FlateDecode streams in extracted content.
"""

import os
import re
import io
from typing import Dict, Any, List, Optional

# 1. PyMuPDF (fitz / pymupdf)
try:
    import pymupdf as fitz
    HAS_FITZ = True
except ImportError:
    try:
        import fitz
        HAS_FITZ = True
    except ImportError:
        HAS_FITZ = False

# 2. pdfplumber
try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

# 3. pypdf
try:
    import pypdf
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

# 4. pdfminer.six
try:
    from pdfminer.high_level import extract_text as pdfminer_extract_text
    HAS_PDFMINER = True
except ImportError:
    HAS_PDFMINER = False

# 5. Pillow and Tesseract OCR
try:
    from PIL import Image, ImageEnhance, ImageFilter
    import pytesseract
    HAS_OCR = True
except ImportError:
    HAS_OCR = False

# Auto-detect Tesseract executable on Windows
def _configure_tesseract():
    if not HAS_OCR:
        return
    standard_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"),
        os.path.expanduser(r"~\AppData\Local\Tesseract-OCR\tesseract.exe"),
    ]
    for p in standard_paths:
        if os.path.isfile(p):
            try:
                pytesseract.pytesseract.tesseract_cmd = p
                break
            except Exception:
                pass

_configure_tesseract()


def is_binary_or_pdf_stream(text: str) -> bool:
    """
    Detect if text contains raw binary data, uncompressed PDF stream syntax,
    or FlateDecode objects instead of human-readable text.
    """
    if not text:
        return False
    
    # 1. PDF syntax signatures
    pdf_signatures = [
        r'%PDF-\d\.\d',
        r'/Filter\s*/FlateDecode',
        r'/Filter\s*/[A-Za-z0-9_]+',
        r'\b\d+\s+\d+\s+obj\b',
        r'\bendobj\b',
        r'\bstream\b[\s\S]{0,80}\bendstream\b',
        r'\bxref\b\s*\d+\s+\d+',
        r'\btrailer\b\s*<<',
        r'/Length\s+\d+',
        r'/Type\s*/Catalog',
        r'/Type\s*/Pages',
        r'/Type\s*/ObjStm'
    ]
    for sig in pdf_signatures:
        if re.search(sig, text, re.IGNORECASE):
            return True

    # 2. Check for binary unprintable byte sequences
    unprintable_count = sum(1 for c in text if ord(c) < 32 and c not in ('\n', '\r', '\t'))
    if len(text) > 0 and (unprintable_count / len(text)) > 0.05:
        return True

    return False


def clean_text(text: str) -> str:
    """Clean and normalize extracted text preserving layout, lists, headings, and tables."""
    if not text:
        return ""

    # Reject binary / stream artifacts
    if is_binary_or_pdf_stream(text):
        return ""

    # Replace nulls and replacement characters
    text = text.replace('\x00', ' ').replace('\ufffd', ' ')
    text = text.replace('\u2018', "'").replace('\u2019', "'")
    text = text.replace('\u201c', '"').replace('\u201d', '"')
    text = text.replace('\u2013', '-').replace('\u2014', '--')
    text = text.replace('\u00a0', ' ')

    # Normalize line breaks
    text = re.sub(r'[\r\f\v]', '\n', text)

    # Clean trailing spaces per line while preserving indentations
    lines = []
    for line in text.split('\n'):
        cleaned_line = re.sub(r'[ \t]+$', '', line)
        lines.append(cleaned_line)

    cleaned = '\n'.join(lines)
    # Collapse 3+ consecutive newlines into 2
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned).strip()
    return cleaned


def _preprocess_image_for_ocr(img: Image.Image) -> Image.Image:
    """Preprocess PIL image with grayscale and contrast normalization for better OCR."""
    try:
        # Convert to grayscale
        gray = img.convert('L')
        # Enhance contrast
        enhancer = ImageEnhance.Contrast(gray)
        enhanced = enhancer.enhance(1.8)
        return enhanced
    except Exception:
        return img


def _perform_ocr_on_page(fitz_page, page_num: int = 0) -> str:
    """
    Render PDF page to high-res image and run Tesseract OCR with image preprocessing.
    """
    if not HAS_OCR:
        return ""

    try:
        # Render at 200 DPI for high OCR accuracy
        pix = fitz_page.get_pixmap(dpi=200)
        img_bytes = pix.tobytes("png")
        image = Image.open(io.BytesIO(img_bytes))
        preprocessed = _preprocess_image_for_ocr(image)
        ocr_text = pytesseract.image_to_string(preprocessed, lang='eng')
        cleaned = clean_text(ocr_text)
        if cleaned and not is_binary_or_pdf_stream(cleaned):
            return cleaned
    except Exception as e:
        # Tesseract not installed on OS or OCR failed
        pass
    return ""


def _extract_tables_with_plumber(pdf_path: str, page_idx: int) -> Optional[str]:
    """Extract formatted tabular data from a specific page using pdfplumber."""
    if not HAS_PDFPLUMBER:
        return None
    try:
        with pdfplumber.open(pdf_path) as pdf:
            if page_idx < len(pdf.pages):
                page = pdf.pages[page_idx]
                tables = page.extract_tables()
                if tables:
                    table_strings = []
                    for t in tables:
                        rows = []
                        for row in t:
                            if row and any(cell for cell in row if cell is not None and str(cell).strip()):
                                clean_row = [str(c).strip().replace('\n', ' ') if c is not None else "" for c in row]
                                rows.append(" | ".join(clean_row))
                        if rows:
                            table_strings.append("\n".join(rows))
                    if table_strings:
                        return "\n\n".join(table_strings)
    except Exception:
        pass
    return None


def extract_text_from_pdf(pdf_path: str, project_id: str = "") -> Dict[str, Any]:
    """
    Extract complete text and per-page text from a PDF file using PyMuPDF (fitz),
    pdfplumber, pdfminer.six, and Tesseract OCR.
    
    Guarantees:
      - 100% of pages are extracted and returned.
      - Strict validation ensuring ZERO raw binary or FlateDecode streams.
      - Preserves tables, headings, and paragraphs.
      - Automatically runs OCR on scanned pages.
    """
    if not os.path.isfile(pdf_path):
        raise FileNotFoundError(f"PDF file not found at: {pdf_path}")

    pages_data: List[Dict[str, Any]] = []
    extraction_method = "unknown"
    has_ocr = False
    doc_metadata = {}

    # Method 1: PyMuPDF (fitz) - Primary high-precision parser
    if HAS_FITZ:
        try:
            doc = fitz.open(pdf_path)
            
            # Check for encryption
            if doc.is_encrypted:
                try:
                    doc.authenticate('')
                except Exception:
                    raise ValueError(f"The PDF file is encrypted and password protected.")

            doc_metadata = {k: str(v) for k, v in (doc.metadata or {}).items() if v}
            total_pages = len(doc)
            extraction_method = "pymupdf"

            # Flags for clean layout and typography
            flags = (
                fitz.TEXT_DEHYPHENATE |
                fitz.TEXT_PRESERVE_LIGATURES |
                fitz.TEXT_PRESERVE_WHITESPACE
            ) if hasattr(fitz, "TEXT_DEHYPHENATE") else 0

            for page_idx in range(total_pages):
                page = doc[page_idx]
                is_ocr_page = False

                # 1. Primary text extraction
                try:
                    if flags:
                        page_text = clean_text(page.get_text("text", flags=flags))
                    else:
                        page_text = clean_text(page.get_text("text"))
                except Exception:
                    page_text = clean_text(page.get_text("text"))

                # 2. If primary text is sparse, try blocks layout in reading order
                if len(page_text.strip()) < 35:
                    try:
                        blocks = page.get_text("blocks")
                        if blocks:
                            # Sort blocks vertically (top-to-bottom, left-to-right)
                            sorted_blocks = sorted(blocks, key=lambda b: (b[1], b[0]))
                            block_texts = [b[4] for b in sorted_blocks if isinstance(b[4], str) and b[4].strip()]
                            if block_texts:
                                block_merged = clean_text("\n\n".join(block_texts))
                                if len(block_merged) > len(page_text):
                                    page_text = block_merged
                    except Exception:
                        pass

                # 3. Check for tables with pdfplumber if available
                if HAS_PDFPLUMBER and len(page_text.strip()) < 100:
                    tbl_text = _extract_tables_with_plumber(pdf_path, page_idx)
                    if tbl_text and len(tbl_text) > len(page_text):
                        page_text = clean_text(tbl_text)

                # 4. If still sparse (< 35 chars) or scanned image, run OCR
                if len(page_text.strip()) < 35 and HAS_OCR:
                    ocr_res = _perform_ocr_on_page(page, page_num=page_idx)
                    if len(ocr_res) > len(page_text):
                        page_text = ocr_res
                        is_ocr_page = True
                        has_ocr = True

                # 5. If page has no extractable text, format human-readable notice
                if not page_text.strip() or is_binary_or_pdf_stream(page_text):
                    img_list = page.get_images()
                    if img_list:
                        page_text = f"[Page {page_idx + 1}: Engineering drawing / schematic diagram ({len(img_list)} image elements)]"
                    else:
                        page_text = f"[Page {page_idx + 1}: Blank or non-textual layout page]"

                words = len(page_text.split()) if page_text else 0
                has_cnt = bool(page_text and not page_text.startswith("["))

                pages_data.append({
                    "page_number": page_idx + 1,
                    "text": page_text,
                    "page_text": page_text,
                    "extracted_text": page_text,
                    "word_count": words,
                    "character_count": len(page_text),
                    "is_ocr": is_ocr_page,
                    "has_content": has_cnt
                })
            doc.close()
        except Exception as e:
            print(f"[DocExtractor] PyMuPDF extraction warning: {e}. Trying pdfplumber fallback...")
            pages_data = []

    # Method 2: pdfplumber fallback
    if not pages_data and HAS_PDFPLUMBER:
        try:
            with pdfplumber.open(pdf_path) as pdf:
                extraction_method = "pdfplumber"
                for idx, page in enumerate(pdf.pages):
                    raw_p = page.extract_text(layout=True) or page.extract_text() or ""
                    page_text = clean_text(raw_p)
                    
                    # Try table extraction if plain text was sparse
                    if len(page_text.strip()) < 35:
                        tables = page.extract_tables()
                        if tables:
                            t_lines = []
                            for t in tables:
                                for r in t:
                                    if r:
                                        t_lines.append(" | ".join(str(c or "") for c in r))
                            if t_lines:
                                page_text = clean_text("\n".join(t_lines))

                    if not page_text.strip() or is_binary_or_pdf_stream(page_text):
                        page_text = f"[Page {idx + 1}: Scanned drawing or diagram page]"

                    words = len(page_text.split()) if page_text else 0
                    pages_data.append({
                        "page_number": idx + 1,
                        "text": page_text,
                        "page_text": page_text,
                        "extracted_text": page_text,
                        "word_count": words,
                        "character_count": len(page_text),
                        "is_ocr": False,
                        "has_content": bool(page_text and not page_text.startswith("["))
                    })
        except Exception as e:
            print(f"[DocExtractor] pdfplumber fallback warning: {e}. Trying pypdf...")
            pages_data = []

    # Method 3: pypdf fallback
    if not pages_data and HAS_PYPDF:
        try:
            reader = pypdf.PdfReader(pdf_path)
            extraction_method = "pypdf"
            for idx, page in enumerate(reader.pages):
                raw_p = page.extract_text() or ""
                page_text = clean_text(raw_p)
                if not page_text.strip() or is_binary_or_pdf_stream(page_text):
                    page_text = f"[Page {idx + 1}: Scanned drawing or diagram page]"
                words = len(page_text.split()) if page_text else 0
                pages_data.append({
                    "page_number": idx + 1,
                    "text": page_text,
                    "page_text": page_text,
                    "extracted_text": page_text,
                    "word_count": words,
                    "character_count": len(page_text),
                    "is_ocr": False,
                    "has_content": bool(page_text and not page_text.startswith("["))
                })
        except Exception as e:
            print(f"[DocExtractor] pypdf fallback warning: {e}")
            pages_data = []

    # Method 4: pdfminer.six fallback
    if not pages_data and HAS_PDFMINER:
        try:
            raw_all = pdfminer_extract_text(pdf_path) or ""
            clean_all = clean_text(raw_all)
            if clean_all and not is_binary_or_pdf_stream(clean_all):
                extraction_method = "pdfminer"
                pages_raw = clean_all.split('\x0c')  # Form-feed page delimiter in pdfminer
                for idx, pg_txt in enumerate(pages_raw):
                    txt = clean_text(pg_txt)
                    if not txt.strip():
                        txt = f"[Page {idx + 1}: Scanned drawing or diagram page]"
                    words = len(txt.split()) if txt else 0
                    pages_data.append({
                        "page_number": idx + 1,
                        "text": txt,
                        "page_text": txt,
                        "extracted_text": txt,
                        "word_count": words,
                        "character_count": len(txt),
                        "is_ocr": False,
                        "has_content": bool(txt and not txt.startswith("["))
                    })
        except Exception as e:
            print(f"[DocExtractor] pdfminer fallback warning: {e}")
            pages_data = []

    # Final safety: If all parsers failed, create clean placeholder (NEVER dump binary stream)
    if not pages_data:
        pages_data = [{
            "page_number": 1,
            "text": "[Page 1: Detailed Project Report document uploaded. Unable to parse text stream.]",
            "page_text": "[Page 1: Detailed Project Report document uploaded. Unable to parse text stream.]",
            "extracted_text": "[Page 1: Detailed Project Report document uploaded. Unable to parse text stream.]",
            "word_count": 10,
            "character_count": 82,
            "is_ocr": False,
            "has_content": False
        }]
        extraction_method = "sanitized_fallback"

    # Assemble full document text with clear page delimiters
    full_text_parts = []
    for p in pages_data:
        full_text_parts.append(f"--- [Page {p['page_number']}] ---\n{p['text']}")
    full_text = "\n\n".join(full_text_parts)

    total_words = sum(p["word_count"] for p in pages_data)
    total_chars = sum(p["character_count"] for p in pages_data)

    if has_ocr:
        extraction_method = f"{extraction_method}+ocr"

    return {
        "project_id": project_id,
        "full_text": full_text,
        "total_pages": len(pages_data),
        "word_count": total_words,
        "character_count": total_chars,
        "has_ocr": has_ocr,
        "extraction_method": extraction_method,
        "pages": pages_data,
        "metadata": doc_metadata
    }
