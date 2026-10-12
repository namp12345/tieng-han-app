import feedparser
import requests
import logging
from datetime import datetime, timezone, timedelta
from bs4 import BeautifulSoup
from config import RSS_SOURCES, MAX_NEWS_AGE_HOURS

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; AINewsBot/1.0; +https://github.com/ainewsbot)"
    )
}


def parse_date(entry) -> datetime | None:
    """Parse ngày từ RSS entry, trả về datetime UTC."""
    for field in ("published_parsed", "updated_parsed", "created_parsed"):
        t = getattr(entry, field, None)
        if t:
            try:
                return datetime(*t[:6], tzinfo=timezone.utc)
            except Exception:
                pass
    return None


def is_recent(pub_date: datetime | None) -> bool:
    if pub_date is None:
        return True  # Không xác định ngày → cho qua
    cutoff = datetime.now(timezone.utc) - timedelta(hours=MAX_NEWS_AGE_HOURS)
    return pub_date >= cutoff


def get_article_text(url: str, max_chars: int = 3000) -> str:
    """Lấy nội dung bài báo từ URL (tối đa max_chars ký tự)."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")
        # Ưu tiên thẻ article
        article = soup.find("article") or soup.find("main") or soup.body
        if article:
            text = article.get_text(separator=" ", strip=True)
            return text[:max_chars]
    except Exception as e:
        logger.debug(f"Không lấy được nội dung từ {url}: {e}")
    return ""


def collect_from_rss(source: dict) -> list[dict]:
    """Thu thập tin từ một nguồn RSS."""
    articles = []
    try:
        feed = feedparser.parse(
            source["url"],
            request_headers=HEADERS,
            agent=HEADERS["User-Agent"],
        )
        if feed.bozo and not feed.entries:
            logger.warning(f"RSS lỗi từ {source['name']}: {feed.bozo_exception}")
            return []

        for entry in feed.entries:
            pub_date = parse_date(entry)
            if not is_recent(pub_date):
                continue

            title = getattr(entry, "title", "").strip()
            url = getattr(entry, "link", "").strip()
            if not title or not url:
                continue

            # Lấy mô tả ngắn từ RSS
            summary = ""
            for field in ("summary", "description", "content"):
                raw = getattr(entry, field, None)
                if raw:
                    if isinstance(raw, list):
                        raw = raw[0].get("value", "")
                    soup = BeautifulSoup(str(raw), "lxml")
                    summary = soup.get_text(separator=" ", strip=True)[:1000]
                    break

            articles.append(
                {
                    "title": title,
                    "url": url,
                    "source": source["name"],
                    "category": source.get("category", "general"),
                    "published_at": pub_date.isoformat() if pub_date else "",
                    "raw_summary": summary,
                    "full_text": "",  # Sẽ lấy sau nếu cần
                }
            )

        logger.info(f"Thu thập {len(articles)} bài từ {source['name']}")
    except Exception as e:
        logger.error(f"Lỗi thu thập từ {source['name']}: {e}")
    return articles


def collect_all_news() -> list[dict]:
    """Thu thập tin từ tất cả nguồn RSS được cấu hình."""
    all_articles = []
    for source in RSS_SOURCES:
        articles = collect_from_rss(source)
        all_articles.extend(articles)

    logger.info(f"Tổng cộng thu thập được {len(all_articles)} bài.")
    return all_articles
