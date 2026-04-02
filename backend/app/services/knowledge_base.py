import logging
from app.core.config import settings
from app.core.database import get_db
from app.services.embeddings import get_embedding

logger = logging.getLogger(__name__)


async def search_kb(
    query: str,
    channel: str = None,
    limit: int = None,
) -> list[dict]:
    """Search KB using vector similarity, keyword fallback."""
    channel = channel or settings.DEFAULT_CHANNEL
    limit = limit or settings.SEARCH_RESULT_LIMIT
    query = query.strip()
    if not query:
        return []

    try:
        query_embedding = await get_embedding(query)
        results = _vector_search(query_embedding, channel, limit)
        if results:
            return results
    except Exception as e:
        logger.warning(f"Vector search failed, falling back to keyword: {e}")

    return _keyword_search(query, channel, limit)


def _vector_search(query_embedding: list[float], channel: str, limit: int) -> list[dict]:
    """Cosine similarity search via pgvector."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT
                e.id,
                e.question_en,
                e.question_ar,
                e.answer_en,
                e.answer_ar,
                c.name_en AS category_en,
                c.name_ar AS category_ar,
                1 - (e.embedding <=> %s::vector) AS similarity
            FROM kb_entries e
            JOIN kb_categories c ON e.category_id = c.id
            WHERE e.is_active = TRUE
              AND e.channel = %s
              AND e.embedding IS NOT NULL
            ORDER BY e.embedding <=> %s::vector
            LIMIT %s
        """, (str(query_embedding), channel, str(query_embedding), limit))

        results = []
        for row in cur.fetchall():
            similarity = row[7]
            if similarity < settings.SIMILARITY_THRESHOLD:
                continue
            results.append({
                "id": row[0],
                "question_en": row[1],
                "question_ar": row[2],
                "answer_en": row[3],
                "answer_ar": row[4],
                "category_en": row[5],
                "category_ar": row[6],
                "score": round(similarity * 10, 1),
            })
            cur.execute(
                "UPDATE kb_entries SET hit_count = hit_count + 1, last_hit_at = NOW() WHERE id = %s",
                (row[0],),
            )

        return results


def _keyword_search(query: str, channel: str, limit: int) -> list[dict]:
    """Fallback: keyword array overlap + LIKE matching."""
    query_lower = query.lower()
    words = [w for w in query_lower.split() if len(w) > 2]
    if not words:
        return []

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT
                e.id, e.question_en, e.question_ar,
                e.answer_en, e.answer_ar,
                c.name_en, c.name_ar,
                (
                    COALESCE(array_length(
                        ARRAY(SELECT unnest(e.keywords_en) INTERSECT SELECT unnest(%s::text[])), 1
                    ), 0) * 3
                    + CASE WHEN lower(e.question_en) LIKE %s THEN 5 ELSE 0 END
                    + CASE WHEN lower(e.answer_en) LIKE %s THEN 2 ELSE 0 END
                    + CASE WHEN e.question_ar LIKE %s THEN 5 ELSE 0 END
                ) AS score
            FROM kb_entries e
            JOIN kb_categories c ON e.category_id = c.id
            WHERE e.is_active = TRUE AND e.channel = %s
              AND (e.keywords_en && %s::text[] OR lower(e.question_en) LIKE %s
                   OR lower(e.answer_en) LIKE %s OR e.question_ar LIKE %s)
            ORDER BY score DESC
            LIMIT %s
        """, (
            words, f"%{query_lower}%", f"%{query_lower}%", f"%{query}%",
            channel, words, f"%{query_lower}%", f"%{query_lower}%", f"%{query}%",
            limit,
        ))

        results = []
        for row in cur.fetchall():
            if row[7] > 0:
                results.append({
                    "id": row[0], "question_en": row[1], "question_ar": row[2],
                    "answer_en": row[3], "answer_ar": row[4],
                    "category_en": row[5], "category_ar": row[6], "score": row[7],
                })
                cur.execute(
                    "UPDATE kb_entries SET hit_count = hit_count + 1, last_hit_at = NOW() WHERE id = %s",
                    (row[0],),
                )
        return results


def format_kb_response(results: list[dict]) -> str:
    """Format KB search results into a WhatsApp-friendly reply."""
    if not results:
        return None

    best = results[0]
    reply = f"{best['answer_en']}\n\n{best['answer_ar']}"

    if len(results) > 1:
        reply += "\n\n---\nRelated topics / مواضيع ذات صلة:\n"
        for r in results[1:]:
            reply += f"- {r['question_en']}\n"

    return reply
