import logging
from app.core.database import get_db

logger = logging.getLogger(__name__)


def search_kb(query: str, channel: str = "whatsapp_registration", limit: int = 3) -> list[dict]:
    """Search knowledge base using keyword matching and full-text search.

    Returns top matching FAQ entries sorted by relevance.
    """
    query_lower = query.lower().strip()
    if not query_lower:
        return []

    with get_db() as conn:
        cur = conn.cursor()

        # Split query into words for keyword matching
        words = [w for w in query_lower.split() if len(w) > 2]
        if not words:
            return []

        # Combined search: keyword array overlap + full-text on questions/answers
        cur.execute("""
            SELECT
                e.id,
                e.question_en,
                e.question_ar,
                e.answer_en,
                e.answer_ar,
                c.name_en AS category_en,
                c.name_ar AS category_ar,
                (
                    -- Keyword overlap score (English)
                    COALESCE(array_length(
                        ARRAY(SELECT unnest(e.keywords_en) INTERSECT SELECT unnest(%s::text[])),
                        1
                    ), 0) * 3
                    +
                    -- Keyword overlap score (Arabic)
                    COALESCE(array_length(
                        ARRAY(SELECT unnest(e.keywords_ar) INTERSECT SELECT unnest(%s::text[])),
                        1
                    ), 0) * 3
                    +
                    -- Full-text match on question (English)
                    CASE WHEN lower(e.question_en) LIKE %s THEN 5 ELSE 0 END
                    +
                    -- Full-text match on answer (English)
                    CASE WHEN lower(e.answer_en) LIKE %s THEN 2 ELSE 0 END
                    +
                    -- Full-text match on question (Arabic)
                    CASE WHEN e.question_ar LIKE %s THEN 5 ELSE 0 END
                    +
                    -- Full-text match on answer (Arabic)
                    CASE WHEN e.answer_ar LIKE %s THEN 2 ELSE 0 END
                ) AS relevance_score
            FROM kb_entries e
            JOIN kb_categories c ON e.category_id = c.id
            WHERE e.is_active = TRUE
              AND e.channel = %s
              AND (
                  -- Keyword match
                  e.keywords_en && %s::text[]
                  OR e.keywords_ar && %s::text[]
                  -- Text match in questions/answers
                  OR lower(e.question_en) LIKE %s
                  OR lower(e.answer_en) LIKE %s
                  OR e.question_ar LIKE %s
                  OR e.answer_ar LIKE %s
              )
            ORDER BY relevance_score DESC
            LIMIT %s
        """, (
            words, words,                        # keyword intersect
            f"%{query_lower}%", f"%{query_lower}%",  # English LIKE
            f"%{query}%", f"%{query}%",           # Arabic LIKE (preserve original case)
            channel,                              # channel filter
            words, words,                         # keyword overlap WHERE
            f"%{query_lower}%", f"%{query_lower}%",  # English WHERE
            f"%{query}%", f"%{query}%",           # Arabic WHERE
            limit,
        ))

        rows = cur.fetchall()

        results = []
        for row in rows:
            if row[7] > 0:  # relevance_score > 0
                results.append({
                    "id": row[0],
                    "question_en": row[1],
                    "question_ar": row[2],
                    "answer_en": row[3],
                    "answer_ar": row[4],
                    "category_en": row[5],
                    "category_ar": row[6],
                    "score": row[7],
                })

                # Update hit count
                cur.execute(
                    "UPDATE kb_entries SET hit_count = hit_count + 1, last_hit_at = NOW() WHERE id = %s",
                    (row[0],),
                )

        return results


def get_categories(channel: str = "whatsapp_registration") -> list[dict]:
    """Get all active KB categories for a channel."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """SELECT id, name_en, name_ar, description_en, description_ar
               FROM kb_categories
               WHERE is_active = TRUE AND channel = %s
               ORDER BY sort_order""",
            (channel,),
        )
        return [
            {"id": r[0], "name_en": r[1], "name_ar": r[2],
             "description_en": r[3], "description_ar": r[4]}
            for r in cur.fetchall()
        ]


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
