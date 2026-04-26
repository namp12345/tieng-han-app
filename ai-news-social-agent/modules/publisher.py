"""
Publisher: Placeholder cho tính năng tự động đăng bài.
MVP: Chưa tự đăng, chỉ hỗ trợ gửi nháp qua Telegram.
Giai đoạn 2: Tích hợp Facebook Graph API, LinkedIn API, Telegram Channel.
"""
import logging
from modules.storage import get_news_by_id, update_status

logger = logging.getLogger(__name__)


def publish_to_facebook(news_id: int) -> bool:
    """[Giai đoạn 2] Đăng lên Facebook Page."""
    article = get_news_by_id(news_id)
    if not article:
        return False
    # TODO: Tích hợp Facebook Graph API
    # page_access_token = os.getenv("FB_PAGE_ACCESS_TOKEN")
    # fb_post = article["social_posts"].get("facebook", "")
    # ...
    logger.info(f"[TODO] publish_to_facebook ID={news_id}")
    update_status(news_id, "posted_fb")
    return True


def publish_to_linkedin(news_id: int) -> bool:
    """[Giai đoạn 2] Đăng lên LinkedIn."""
    article = get_news_by_id(news_id)
    if not article:
        return False
    # TODO: Tích hợp LinkedIn API
    logger.info(f"[TODO] publish_to_linkedin ID={news_id}")
    update_status(news_id, "posted_li")
    return True


def publish_to_telegram_channel(news_id: int) -> bool:
    """Đăng lên Telegram Channel (đã cấu hình)."""
    from modules.telegram_bot import send_text
    article = get_news_by_id(news_id)
    if not article:
        return False
    tg_post = article["social_posts"].get("telegram", "")
    if tg_post:
        send_text(tg_post)
        update_status(news_id, "posted_tg")
        logger.info(f"Đã đăng Telegram ID={news_id}")
        return True
    return False
