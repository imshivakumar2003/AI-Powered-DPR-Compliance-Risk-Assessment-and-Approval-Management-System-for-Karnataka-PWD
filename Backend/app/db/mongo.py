# app/db/mongo.py
"""
MongoDB Storage Layer for DPR Document Intelligence
Stores page-by-page extracted text, OCR layers, and document metadata.
Schema:
  - dpr_pages: {
      dpr_id: str,
      page_number: int,
      extracted_text: str,
      upload_timestamp: str,
      word_count: int,
      character_count: int,
      is_ocr: bool,
      created_at: datetime
    }
  - dpr_documents: {
      dpr_id: str,
      full_text: str,
      total_pages: int,
      word_count: int,
      character_count: int,
      extraction_method: str,
      has_ocr: bool,
      upload_timestamp: str,
      metadata: dict,
      created_at: datetime
    }
"""

import os
from datetime import datetime
from typing import List, Optional, Dict, Any

try:
    from pymongo import MongoClient, ASCENDING
    from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError, PyMongoError
    HAS_PYMONGO = True
except ImportError:
    HAS_PYMONGO = False
    MongoClient = None

MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.environ.get("MONGODB_DB_NAME", "karnataka_pwd_dpr")

_mongo_client: Optional[Any] = None
_db = None
_last_check_time: float = 0.0
_is_connected: bool = False


def get_mongo_client() -> Optional[Any]:
    """Get or initialize singleton MongoClient with short timeout for responsiveness."""
    global _mongo_client, _db
    if not HAS_PYMONGO:
        return None
    if _mongo_client is None:
        try:
            _mongo_client = MongoClient(
                MONGODB_URI,
                serverSelectionTimeoutMS=800,
                connectTimeoutMS=800,
                socketTimeoutMS=2000
            )
            _db = _mongo_client[MONGODB_DB_NAME]
            try:
                _db.dpr_pages.create_index([("dpr_id", ASCENDING), ("page_number", ASCENDING)])
                _db.dpr_documents.create_index([("dpr_id", ASCENDING)], unique=True)
                _db.dpr_images.create_index([("dpr_id", ASCENDING), ("page_number", ASCENDING)])
            except Exception:
                pass
        except Exception as e:
            _mongo_client = None
            _db = None
    return _mongo_client


def is_mongo_available() -> bool:
    """Check if MongoDB server is actively reachable with cached 10s TTL."""
    global _last_check_time, _is_connected
    import time
    now = time.time()
    if now - _last_check_time < 10.0:
        return _is_connected
    _last_check_time = now
    if not HAS_PYMONGO:
        _is_connected = False
        return False
    try:
        client = get_mongo_client()
        if client is None:
            _is_connected = False
            return False
        client.admin.command('ping')
        _is_connected = True
        return True
    except Exception:
        _is_connected = False
        return False


def get_mongo_db() -> Optional[Any]:
    """Return active MongoDB database instance if available."""
    if not is_mongo_available():
        return None
    if _db is not None:
        return _db
    client = get_mongo_client()
    return _db if client is not None else None


def save_pages_to_mongo(dpr_id: str, pages: List[Dict[str, Any]], upload_timestamp: Optional[str] = None) -> bool:
    """
    Store extracted text page by page into MongoDB dpr_pages collection.
    Required fields: DPR ID, Page Number, Extracted Text, Upload Timestamp.
    """
    if not is_mongo_available():
        return False

    db = get_mongo_db()
    if db is None:
        return False

    ts = upload_timestamp or (datetime.utcnow().isoformat() + "Z")
    now_dt = datetime.utcnow()

    docs = []
    for p in pages:
        page_num = int(p.get("page_number", 1))
        txt = str(p.get("extracted_text") or p.get("page_text") or p.get("text") or "")
        w_cnt = int(p.get("word_count", len(txt.split()) if txt else 0))
        c_cnt = int(p.get("character_count", len(txt)))
        is_ocr = bool(p.get("is_ocr", False))

        docs.append({
            "dpr_id": dpr_id,
            "page_number": page_num,
            "extracted_text": txt,
            "upload_timestamp": ts,
            "word_count": w_cnt,
            "character_count": c_cnt,
            "is_ocr": is_ocr,
            "created_at": now_dt
        })

    try:
        # Delete existing pages for this DPR ID to prevent duplicates
        db.dpr_pages.delete_many({"dpr_id": dpr_id})
        if docs:
            db.dpr_pages.insert_many(docs)
        return True
    except Exception as e:
        print(f"[MongoDB] Failed saving pages for DPR {dpr_id}: {e}")
        return False


def get_pages_from_mongo(dpr_id: str) -> Optional[List[Dict[str, Any]]]:
    """Retrieve all pages for a DPR from MongoDB, sorted by page number ascending."""
    db = get_mongo_db()
    if db is None:
        return None

    try:
        cursor = db.dpr_pages.find({"dpr_id": dpr_id}, {"_id": 0}).sort("page_number", ASCENDING)
        pages = list(cursor)
        if not pages:
            return None
        # Format uniformly
        for p in pages:
            txt = p.get("extracted_text") or p.get("page_text") or p.get("text") or ""
            p["extracted_text"] = txt
            p["page_text"] = txt
            p["text"] = txt
        return pages
    except Exception as e:
        print(f"[MongoDB] Failed retrieving pages for DPR {dpr_id}: {e}")
        return None


def save_document_to_mongo(dpr_id: str, doc_data: Dict[str, Any], upload_timestamp: Optional[str] = None) -> bool:
    """Store full extracted document and metadata in MongoDB dpr_documents collection."""
    db = get_mongo_db()
    if db is None:
        return False

    ts = upload_timestamp or (datetime.utcnow().isoformat() + "Z")
    now_dt = datetime.utcnow()

    record = {
        "dpr_id": dpr_id,
        "full_text": str(doc_data.get("full_text", "")),
        "total_pages": int(doc_data.get("total_pages", 0)),
        "word_count": int(doc_data.get("word_count", 0)),
        "character_count": int(doc_data.get("character_count", 0)),
        "extraction_method": str(doc_data.get("extraction_method", "unknown")),
        "has_ocr": bool(doc_data.get("has_ocr", False)),
        "upload_timestamp": ts,
        "metadata": doc_data.get("metadata", {}),
        "created_at": now_dt
    }

    try:
        db.dpr_documents.replace_one({"dpr_id": dpr_id}, record, upsert=True)
        return True
    except Exception as e:
        print(f"[MongoDB] Failed saving document for DPR {dpr_id}: {e}")
        return False


def get_document_from_mongo(dpr_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve full extracted document from MongoDB."""
    db = get_mongo_db()
    if db is None:
        return None

    try:
        doc = db.dpr_documents.find_one({"dpr_id": dpr_id}, {"_id": 0})
        if doc and "created_at" in doc and isinstance(doc["created_at"], datetime):
            doc["created_at"] = doc["created_at"].isoformat() + "Z"
        return doc
    except Exception as e:
        print(f"[MongoDB] Failed retrieving document for DPR {dpr_id}: {e}")
        return None


def save_images_to_mongo(dpr_id: str, images: List[Dict[str, Any]], upload_timestamp: Optional[str] = None) -> bool:
    """
    Store extracted images and AI-generated explanations in MongoDB dpr_images collection.
    Schema: DPR ID, Page Number, Image Path/URL, AI Description, Upload Timestamp, etc.
    """
    if not is_mongo_available():
        return False

    db = get_mongo_db()
    if db is None:
        return False

    ts = upload_timestamp or (datetime.utcnow().isoformat() + "Z")
    now_dt = datetime.utcnow()

    docs = []
    for img in images:
        docs.append({
            "dpr_id": dpr_id,
            "page_number": int(img.get("page_number", 1)),
            "image_index": int(img.get("image_index", 1)),
            "filename": str(img.get("filename", "")),
            "image_url": str(img.get("image_url", f"/api/dpr/{dpr_id}/images/{img.get('filename', '')}")),
            "image_path": str(img.get("image_path", "")),
            "width": int(img.get("width", 0)),
            "height": int(img.get("height", 0)),
            "position_y": float(img.get("position_y", 0.0)),
            "image_type": str(img.get("image_type", "general")),
            "type_label": str(img.get("type_label", "Visual Asset")),
            "ai_description": str(img.get("ai_description", "")),
            "ai_tags": img.get("ai_tags", []),
            "upload_timestamp": ts,
            "created_at": now_dt
        })

    try:
        db.dpr_images.delete_many({"dpr_id": dpr_id})
        if docs:
            db.dpr_images.insert_many(docs)
        return True
    except Exception as e:
        print(f"[MongoDB] Failed saving images for DPR {dpr_id}: {e}")
        return False


def get_images_from_mongo(dpr_id: str, page_number: Optional[int] = None) -> Optional[List[Dict[str, Any]]]:
    """Retrieve extracted images for a DPR (or specific page) from MongoDB."""
    if not is_mongo_available():
        return None

    db = get_mongo_db()
    if db is None:
        return None

    try:
        query = {"dpr_id": dpr_id}
        if page_number is not None:
            query["page_number"] = int(page_number)

        cursor = db.dpr_images.find(query, {"_id": 0}).sort([("page_number", ASCENDING), ("position_y", ASCENDING)])
        images = list(cursor)
        if not images and page_number is None:
            return None
        return images
    except Exception as e:
        print(f"[MongoDB] Failed retrieving images for DPR {dpr_id}: {e}")
        return None


def delete_dpr_from_mongo(dpr_id: str) -> bool:
    """Delete all pages, documents, and images associated with a DPR ID from MongoDB."""
    if not is_mongo_available():
        return False

    db = get_mongo_db()
    if db is None:
        return False

    try:
        db.dpr_pages.delete_many({"dpr_id": dpr_id})
        db.dpr_documents.delete_many({"dpr_id": dpr_id})
        db.dpr_images.delete_many({"dpr_id": dpr_id})
        return True
    except Exception as e:
        print(f"[MongoDB] Failed deleting DPR {dpr_id}: {e}")
        return False


def get_mongo_stats() -> Dict[str, Any]:
    """Return connectivity and collection counts for MongoDB."""
    connected = is_mongo_available()
    if not connected:
        return {
            "connected": False,
            "database": MONGODB_DB_NAME,
            "uri": MONGODB_URI,
            "total_documents": 0,
            "total_pages": 0,
            "total_images": 0
        }
    db = get_mongo_db()
    try:
        doc_count = db.dpr_documents.count_documents({})
        page_count = db.dpr_pages.count_documents({})
        img_count = db.dpr_images.count_documents({})
        return {
            "connected": True,
            "database": MONGODB_DB_NAME,
            "uri": MONGODB_URI,
            "total_documents": doc_count,
            "total_pages": page_count,
            "total_images": img_count
        }
    except Exception as e:
        return {
            "connected": False,
            "error": str(e),
            "database": MONGODB_DB_NAME,
            "uri": MONGODB_URI,
            "total_documents": 0,
            "total_pages": 0,
            "total_images": 0
        }

