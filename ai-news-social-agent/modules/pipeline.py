"""
Pipeline chính: Thu thập → Lọc → Tóm tắt → Viết social → Lưu → Gửi Telegram
"""
import logging
from config import MAX_NEWS_PER_RUN
from modules.collector import collect_all_news
from modules.filter import filter_news
from modules.summarizer import summarize_article
from modules.social_writer import generate_all_social_posts
from modules.storage import is_duplicate, save_news
from modules import telegram_bot

logger = logging.getLogger(__name__)


def run_pipeline() -> int:
    """Chạy toàn bộ pipeline. Trả về số bài đã xử lý thành công."""
    logger.info("═══ Bắt đầu pipeline AI News ═══")

    # 1. Thu thập
    raw_articles = collect_all_news()
    if not raw_articles:
        logger.warning("Không thu thập được bài nào.")
        return 0

    # 2. Lọc
    filtered = filter_news(raw_articles)
    if not filtered:
        logger.info("Không có bài nào vượt qua bộ lọc.")
        return 0

    # Giới hạn số lượng mỗi lần chạy
    to_process = filtered[:MAX_NEWS_PER_RUN]
    logger.info(f"Xử lý {len(to_process)} bài (tối đa {MAX_NEWS_PER_RUN}).")

    processed = 0
    for article in to_process:
        try:
            # 3. Kiểm tra trùng
            if is_duplicate(article["url"], article["title"]):
                logger.debug(f"Bỏ qua trùng: {article['title'][:60]}")
                continue

            # 4. Tóm tắt tiếng Việt
            article = summarize_article(article)

            # 5. Tạo social posts
            article["social_posts"] = generate_all_social_posts(article)

            # 6. Lưu vào database
            news_id = save_news(article)
            if news_id is None:
                logger.warning(f"Không lưu được bài: {article['title'][:60]}")
                continue

            article["id"] = news_id

            # 7. Gửi nháp lên Telegram
            telegram_bot.send_draft(article)

            processed += 1
            logger.info(
                f"✓ [{processed}] Xử lý xong: {article.get('title_vi', article['title'])[:60]}"
            )

        except Exception as e:
            logger.error(
                f"Lỗi xử lý bài '{article.get('title', '')[:60]}': {e}",
                exc_info=True,
            )
            continue

    logger.info(f"═══ Pipeline hoàn thành: {processed} bài mới ═══")

    if processed > 0:
        telegram_bot.send_text(
            f"✅ *Quét xong!* Đã xử lý *{processed}* bài AI mới.\n"
            f"Dùng /drafts để xem và duyệt bài."
        )

    return processed
