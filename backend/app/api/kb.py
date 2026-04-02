import io
import csv
import re
import uuid
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from app.core.database import get_db
from app.services.embeddings import get_embeddings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/kb", tags=["knowledge-base"])

SUPPORTED_EXTENSIONS = (".csv", ".xlsx", ".xls", ".pdf", ".txt", ".md", ".docx", ".doc")


# ── Upload ───────────────────────────────────────────────────

def _extract_text_from_pdf(content: bytes) -> str:
    from PyPDF2 import PdfReader
    reader = PdfReader(io.BytesIO(content))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def _extract_text_from_docx(content: bytes) -> str:
    from docx import Document
    doc = Document(io.BytesIO(content))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def _extract_rows_from_csv(content: bytes) -> list[dict]:
    text = content.decode("utf-8-sig")
    return list(csv.DictReader(io.StringIO(text)))


def _extract_rows_from_excel(content: bytes) -> list[dict]:
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True)
    ws = wb.active
    headers = [cell.value for cell in next(ws.iter_rows(min_row=1, max_row=1))]
    rows = []
    for excel_row in ws.iter_rows(min_row=2, values_only=True):
        rows.append(dict(zip(headers, excel_row)))
    return rows


def _chunk_text(text: str, chunk_size: int = 500) -> list[str]:
    """Split text into chunks by paragraphs/sections, max chunk_size chars."""
    sections = re.split(r'\n{2,}|(?=^#{1,3}\s)', text, flags=re.MULTILINE)
    chunks = []
    current = ""

    for section in sections:
        section = section.strip()
        if not section:
            continue
        if len(current) + len(section) > chunk_size and current:
            chunks.append(current.strip())
            current = section
        else:
            current = f"{current}\n\n{section}" if current else section

    if current.strip():
        chunks.append(current.strip())

    return [c for c in chunks if len(c) > 20]


def _get_or_create_category(cur, doc_name: str, channel: str) -> str:
    """Auto-create a category from document name if it doesn't exist."""
    name = re.sub(r'\.[^.]+$', '', doc_name)
    name = re.sub(r'[_\-]+', ' ', name).strip().title()
    if not name:
        name = "General"

    cur.execute(
        "SELECT id FROM kb_categories WHERE lower(name_en) = lower(%s) AND channel = %s",
        (name, channel),
    )
    row = cur.fetchone()
    if row:
        return row[0]

    cat_id = uuid.uuid4()
    cur.execute(
        """INSERT INTO kb_categories (id, name_en, name_ar, channel, is_active)
           VALUES (%s, %s, %s, %s, TRUE)""",
        (cat_id, name, name, channel),
    )
    return cat_id


@router.post("/upload")
async def upload_kb_file(
    file: UploadFile = File(...),
    channel: str = Query("whatsapp_registration"),
):
    """Upload a file — system handles chunking, categorization, and embedding.

    Supported: .csv, .xlsx, .xls, .pdf, .txt, .md, .docx, .doc
    """
    filename = file.filename.lower()
    if not filename.endswith(SUPPORTED_EXTENSIONS):
        raise HTTPException(400, f"Unsupported file type. Supported: {', '.join(SUPPORTED_EXTENSIONS)}")

    content = await file.read()
    if not content:
        raise HTTPException(400, "File is empty")

    if filename.endswith((".csv", ".xlsx", ".xls")):
        return await _process_structured_file(filename, content, channel, file.filename)

    return await _process_document_file(filename, content, channel, file.filename)


async def _process_structured_file(filename: str, content: bytes, channel: str, original_name: str):
    """Process CSV/Excel with Q&A columns."""
    if filename.endswith(".csv"):
        rows = _extract_rows_from_csv(content)
    else:
        rows = _extract_rows_from_excel(content)

    if not rows:
        raise HTTPException(400, "File has no data rows")

    required = {"question_en", "question_ar", "answer_en", "answer_ar"}
    missing = required - set(rows[0].keys())
    if missing:
        raise HTTPException(400, f"Missing required columns: {missing}")

    texts = [f"{r['question_en']} {r['question_ar']} {str(r['answer_en'])[:200]}" for r in rows]

    try:
        embeddings = await get_embeddings(texts)
    except Exception as e:
        logger.warning(f"Batch embedding failed: {e}")
        embeddings = [None] * len(rows)

    created = 0
    with get_db() as conn:
        cur = conn.cursor()
        category_id = _get_or_create_category(cur, original_name, channel)

        for row, emb in zip(rows, embeddings):
            entry_id = uuid.uuid4()
            kw_en = [k.strip() for k in str(row.get("keywords_en", "")).split(",") if k.strip()]
            kw_ar = [k.strip() for k in str(row.get("keywords_ar", "")).split(",") if k.strip()]

            cur.execute(
                """INSERT INTO kb_entries
                   (id, category_id, question_en, question_ar, answer_en, answer_ar,
                    keywords_en, keywords_ar, channel, source, source_url, embedding)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'file_upload', %s, %s)""",
                (entry_id, category_id,
                 row["question_en"], row["question_ar"],
                 row["answer_en"], row["answer_ar"],
                 kw_en, kw_ar, channel, original_name,
                 str(emb) if emb else None),
            )
            created += 1

    return {
        "status": "uploaded",
        "file": original_name,
        "type": "structured",
        "entries_created": created,
        "embeddings_generated": sum(1 for e in embeddings if e is not None),
    }


async def _process_document_file(filename: str, content: bytes, channel: str, original_name: str):
    """Process PDF/TXT/MD/DOCX by chunking and auto-embedding."""
    if filename.endswith(".pdf"):
        text = _extract_text_from_pdf(content)
    elif filename.endswith((".docx", ".doc")):
        text = _extract_text_from_docx(content)
    else:
        text = content.decode("utf-8-sig")

    if not text.strip():
        raise HTTPException(400, "Could not extract text from file")

    chunks = _chunk_text(text)
    if not chunks:
        raise HTTPException(400, "No meaningful content found after parsing")

    try:
        embeddings = await get_embeddings(chunks)
    except Exception as e:
        logger.warning(f"Batch embedding failed: {e}")
        embeddings = [None] * len(chunks)

    created = 0
    with get_db() as conn:
        cur = conn.cursor()
        category_id = _get_or_create_category(cur, original_name, channel)

        for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            entry_id = uuid.uuid4()
            lines = chunk.split("\n", 1)
            title = lines[0].strip().lstrip("#").strip()[:200]
            body = lines[1].strip() if len(lines) > 1 else chunk

            keywords = [w.lower() for w in re.findall(r'\b[a-zA-Z]{3,}\b', title)][:8]

            cur.execute(
                """INSERT INTO kb_entries
                   (id, category_id, question_en, question_ar, answer_en, answer_ar,
                    keywords_en, keywords_ar, channel, source, source_url, embedding)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'file_upload', %s, %s)""",
                (entry_id, category_id,
                 title, title,
                 body, body,
                 keywords, [],
                 channel, original_name,
                 str(emb) if emb else None),
            )
            created += 1

    return {
        "status": "uploaded",
        "file": original_name,
        "type": "document",
        "chunks": len(chunks),
        "entries_created": created,
        "embeddings_generated": sum(1 for e in embeddings if e is not None),
    }


# ── Documents ────────────────────────────────────────────────

@router.get("/documents")
def list_documents(channel: str = Query("whatsapp_registration")):
    """List all uploaded documents with entry counts."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT source_url AS document, count(*) AS entries,
                   count(*) FILTER (WHERE embedding IS NOT NULL) AS embedded,
                   min(created_at) AS uploaded_at
            FROM kb_entries
            WHERE channel = %s AND source_url IS NOT NULL
            GROUP BY source_url
            ORDER BY min(created_at) DESC
        """, (channel,))
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, row)) for row in cur.fetchall()]


@router.delete("/documents/{doc_name}")
def delete_document(doc_name: str, channel: str = Query("whatsapp_registration")):
    """Delete all KB entries from a specific uploaded file."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM kb_entries WHERE source_url = %s AND channel = %s RETURNING id",
            (doc_name, channel),
        )
        deleted = len(cur.fetchall())
        if deleted == 0:
            raise HTTPException(404, "No entries found for this document")
    return {"status": "deleted", "document": doc_name, "entries_deleted": deleted}


# ── Categories & Stats ───────────────────────────────────────

@router.get("/categories")
def list_categories(channel: str = Query("whatsapp_registration")):
    """List all KB categories."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """SELECT id, name_en, name_ar, is_active
               FROM kb_categories WHERE channel = %s ORDER BY sort_order""",
            (channel,),
        )
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, row)) for row in cur.fetchall()]


@router.get("/stats")
def kb_stats(channel: str = Query("whatsapp_registration")):
    """KB dashboard stats."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT
                count(*) AS total_entries,
                count(*) FILTER (WHERE embedding IS NOT NULL) AS with_embeddings,
                count(*) FILTER (WHERE embedding IS NULL) AS without_embeddings,
                coalesce(sum(hit_count), 0) AS total_hits,
                count(DISTINCT source_url) AS total_documents
            FROM kb_entries WHERE channel = %s
        """, (channel,))
        row = cur.fetchone()
        cols = [d[0] for d in cur.description]
        stats = dict(zip(cols, row))

        cur.execute("SELECT count(*) FROM kb_categories WHERE channel = %s", (channel,))
        stats["total_categories"] = cur.fetchone()[0]

        return stats
