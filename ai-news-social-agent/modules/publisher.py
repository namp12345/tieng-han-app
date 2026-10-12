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


async def publish_to_telegram_channel_async(news_id: int, bot) -> bool:
    """Publish plain AI text; record posted only after Telegram accepts it."""
    from config import TELEGRAM_CHANNEL_ID
    from telegram.error import TelegramError

    article = get_news_by_id(news_id)
    if not article or not TELEGRAM_CHANNEL_ID:
        return False
    if article.get("status") == "posted_tg":
        return True
    tg_post = article.get("social_posts", {}).get("telegram", "")
    if not tg_post or not tg_post.strip():
        return False
    try:
        await bot.send_message(
            chat_id=TELEGRAM_CHANNEL_ID, text=tg_post, parse_mode=None
        )
    except TelegramError:
        logger.exception("Telegram channel publish failed for ID=%s", news_id)
        return False
    update_status(news_id, "posted_tg")
    return True


def publish_to_telegram_channel(news_id: int) -> bool:
    """Synchronous entry point; async handlers must use the async function."""
    import asyncio
    from config import TELEGRAM_BOT_TOKEN
    from telegram import Bot

    if not TELEGRAM_BOT_TOKEN:
        return False

    async def publish():
        async with Bot(token=TELEGRAM_BOT_TOKEN) as bot:
            return await publish_to_telegram_channel_async(news_id, bot)

    return asyncio.run(publish())
