import sqlite3
import json
import hashlib
import logging
from datetime import datetime
from config import DB_PATH

logger = logging.getLogger(__name__)


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS news (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url_hash TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                url TEXT NOT NULL,
                source TEXT,
                published_at TEXT,
                summary_vi TEXT,
                importance_score INTEGER DEFAULT 0,
                importance_level TEXT DEFAULT 'Thấp',
                social_posts TEXT,
                status TEXT DEFAULT 'draft',
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_url_hash ON news(url_hash)
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_status ON news(status)
        """)
        conn.commit()
        logger.info("Database đã được khởi tạo.")
    except Exception as e:
        logger.error(f"Lỗi khởi tạo database: {e}")
    finally:
        conn.close()


def url_to_hash(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:16]


def is_duplicate(url: str, title: str = "") -> bool:
    """Kiểm tra trùng theo URL hash và title similarity."""
    conn = get_connection()
    try:
        url_hash = url_to_hash(url)
        row = conn.execute(
            "SELECT id FROM news WHERE url_hash = ?", (url_hash,)
        ).fetchone()
        if row:
            return True

        # Kiểm tra title tương tự (đơn giản: exact match trên 80% ký tự)
        if title:
            title_lower = title.lower().strip()
            rows = conn.execute(
                "SELECT title FROM news WHERE created_at >= datetime('now', '-2 days')"
            ).fetchall()
            for r in rows:
                existing = r["title"].lower().strip()
                # So sánh đơn giản bằng ratio ký tự chung
                common = len(set(title_lower.split()) & set(existing.split()))
                total = max(len(title_lower.split()), len(existing.split()), 1)
                if common / total > 0.75:
                    return True
        return False
    finally:
        conn.close()


def save_news(article: dict) -> int | None:
    """Lưu bài báo mới. Trả về ID hoặc None nếu đã tồn tại."""
    conn = get_connection()
    try:
        url_hash = url_to_hash(article["url"])
        social_posts_json = json.dumps(
            article.get("social_posts", {}), ensure_ascii=False
        )
        conn.execute(
            """
            INSERT INTO news
                (url_hash, title, url, source, published_at,
                 summary_vi, importance_score, importance_level,
                 social_posts, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                url_hash,
                article.get("title", ""),
                article.get("url", ""),
                article.get("source", ""),
                article.get("published_at", ""),
                article.get("summary_vi", ""),
                article.get("importance_score", 0),
                article.get("importance_level", "Thấp"),
                social_posts_json,
                article.get("status", "draft"),
            ),
        )
        conn.commit()
        row = conn.execute(
            "SELECT id FROM news WHERE url_hash = ?", (url_hash,)
        ).fetchone()
        return row["id"] if row else None
    except sqlite3.IntegrityError:
        return None
    except Exception as e:
        logger.error(f"Lỗi lưu bài báo: {e}")
        return None
    finally:
        conn.close()


def update_status(news_id: int, status: str):
    conn = get_connection()
    try:
        conn.execute(
            "UPDATE news SET status = ?, updated_at = datetime('now') WHERE id = ?",
            (status, news_id),
        )
        conn.commit()
    except Exception as e:
        logger.error(f"Lỗi cập nhật status: {e}")
    finally:
        conn.close()


def get_news_by_id(news_id: int) -> dict | None:
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM news WHERE id = ?", (news_id,)).fetchone()
        if row:
            result = dict(row)
            result["social_posts"] = json.loads(result.get("social_posts") or "{}")
            return result
        return None
    finally:
        conn.close()


def get_draft_news(limit: int = 10) -> list[dict]:
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM news WHERE status = 'draft' ORDER BY importance_score DESC LIMIT ?",
            (limit,),
        ).fetchall()
        results = []
        for row in rows:
            item = dict(row)
            item["social_posts"] = json.loads(item.get("social_posts") or "{}")
            results.append(item)
        return results
    finally:
        conn.close()


def get_stats() -> dict:
    conn = get_connection()
    try:
        total = conn.execute("SELECT COUNT(*) as c FROM news").fetchone()["c"]
        by_status = conn.execute(
            "SELECT status, COUNT(*) as c FROM news GROUP BY status"
        ).fetchall()
        return {
            "total": total,
            "by_status": {r["status"]: r["c"] for r in by_status},
        }
    finally:
        conn.close()
