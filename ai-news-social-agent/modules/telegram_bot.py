import logging
import asyncio
from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import (
    Application, CallbackQueryHandler, CommandHandler, ContextTypes
)
from telegram.error import TelegramError
from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
from modules import storage

logger = logging.getLogger(__name__)

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _keyboard_for(news_id: int) -> InlineKeyboardMarkup:
    """Tạo nút bấm inline cho một bài báo."""
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("✅ Duyệt FB", callback_data=f"approve_fb_{news_id}"),
            InlineKeyboardButton("💼 Duyệt LI", callback_data=f"approve_li_{news_id}"),
        ],
        [
            InlineKeyboardButton("📢 Duyệt TG", callback_data=f"approve_tg_{news_id}"),
            InlineKeyboardButton("🎬 Xem TikTok", callback_data=f"view_tiktok_{news_id}"),
        ],
        [
            InlineKeyboardButton("❌ Bỏ qua", callback_data=f"skip_{news_id}"),
            InlineKeyboardButton("🔁 Viết lại", callback_data=f"rewrite_{news_id}"),
        ],
    ])


def _format_draft_message(article: dict) -> str:
    level_emoji = {"Cao": "🔴", "Trung bình": "🟡", "Thấp": "🟢"}.get(
        article.get("importance_level", "Thấp"), "⚪"
    )
    tg_post = article.get("social_posts", {}).get("telegram", "")
    return (
        f"📨 *BÀI BÁO MỚI* (ID: {article['id']})\n"
        f"{level_emoji} Mức độ: *{article.get('importance_level', 'Thấp')}* "
        f"(điểm: {article.get('importance_score', 0)})\n"
        f"📰 Nguồn: {article.get('source', '')}\n\n"
        f"{tg_post}\n\n"
        f"━━━━━━━━━━━━━━━━━━"
    )


# ─── Gửi nháp ─────────────────────────────────────────────────────────────────

async def send_draft_async(article: dict):
    """Gửi nháp một bài báo qua Telegram (async)."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        logger.warning("Chưa cấu hình Telegram. Bỏ qua gửi nháp.")
        return

    bot = Bot(token=TELEGRAM_BOT_TOKEN)
    text = _format_draft_message(article)
    try:
        await bot.send_message(
            chat_id=TELEGRAM_CHAT_ID,
            text=text,
            parse_mode="Markdown",
            reply_markup=_keyboard_for(article["id"]),
        )
        logger.info(f"Đã gửi nháp ID={article['id']} lên Telegram.")
    except TelegramError as e:
        logger.error(f"Lỗi gửi Telegram: {e}")


def send_draft(article: dict):
    """Wrapper đồng bộ để gọi từ code thường."""
    try:
        asyncio.run(send_draft_async(article))
    except RuntimeError:
        # Nếu đã có event loop đang chạy
        loop = asyncio.get_event_loop()
        loop.run_until_complete(send_draft_async(article))


async def send_text_async(text: str, parse_mode: str = "Markdown"):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return
    bot = Bot(token=TELEGRAM_BOT_TOKEN)
    try:
        await bot.send_message(
            chat_id=TELEGRAM_CHAT_ID, text=text, parse_mode=parse_mode
        )
    except TelegramError as e:
        logger.error(f"Lỗi gửi text Telegram: {e}")


def send_text(text: str):
    try:
        asyncio.run(send_text_async(text))
    except RuntimeError:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(send_text_async(text))


# ─── Xử lý nút bấm ────────────────────────────────────────────────────────────

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data

    if "_" not in data:
        return

    parts = data.rsplit("_", 1)
    action = parts[0]
    news_id = int(parts[1])

    article = storage.get_news_by_id(news_id)
    if not article:
        await query.edit_message_text("❌ Không tìm thấy bài báo này.")
        return

    if action == "approve_fb":
        storage.update_status(news_id, "approved_fb")
        fb_post = article["social_posts"].get("facebook", "")
        await query.edit_message_text(
            f"✅ *Đã duyệt Facebook* (ID: {news_id})\n\n```\n{fb_post[:3000]}\n```",
            parse_mode="Markdown",
        )

    elif action == "approve_li":
        storage.update_status(news_id, "approved_li")
        li_post = article["social_posts"].get("linkedin", "")
        await query.edit_message_text(
            f"💼 *Đã duyệt LinkedIn* (ID: {news_id})\n\n```\n{li_post[:3000]}\n```",
            parse_mode="Markdown",
        )

    elif action == "approve_tg":
        storage.update_status(news_id, "approved_tg")
        tg_post = article["social_posts"].get("telegram", "")
        await query.edit_message_text(
            f"📢 *Đã duyệt Telegram* (ID: {news_id})\n\n{tg_post}",
            parse_mode="Markdown",
        )

    elif action == "view_tiktok":
        tiktok_script = article["social_posts"].get("tiktok", "")
        await context.bot.send_message(
            chat_id=query.message.chat_id,
            text=f"🎬 *TikTok Script* (ID: {news_id})\n\n```\n{tiktok_script[:3500]}\n```",
            parse_mode="Markdown",
        )

    elif action == "skip":
        storage.update_status(news_id, "skipped")
        await query.edit_message_text(f"❌ Đã bỏ qua bài ID: {news_id}")

    elif action == "rewrite":
        await query.edit_message_text(
            f"🔁 Đang viết lại bài ID: {news_id}... (tính năng sắp có)"
        )


# ─── Lệnh Telegram ─────────────────────────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🤖 *AI News Social Agent* đang hoạt động!\n\n"
        "Các lệnh:\n"
        "/scan\\_ai\\_news - Quét tin AI ngay\n"
        "/stats - Thống kê database\n"
        "/drafts - Xem danh sách nháp\n"
        "/help - Hướng dẫn",
        parse_mode="Markdown",
    )


async def cmd_stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    stats = storage.get_stats()
    by_status = "\n".join(
        f"  • {k}: {v}" for k, v in stats.get("by_status", {}).items()
    )
    await update.message.reply_text(
        f"📊 *Thống kê Database*\n\n"
        f"Tổng bài: {stats['total']}\n\n"
        f"Theo trạng thái:\n{by_status}",
        parse_mode="Markdown",
    )


async def cmd_drafts(update: Update, context: ContextTypes.DEFAULT_TYPE):
    drafts = storage.get_draft_news(limit=5)
    if not drafts:
        await update.message.reply_text("📭 Không có bài nháp nào.")
        return
    for article in drafts:
        text = _format_draft_message(article)
        await update.message.reply_text(
            text,
            parse_mode="Markdown",
            reply_markup=_keyboard_for(article["id"]),
        )


async def cmd_scan(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🔍 Bắt đầu quét tin AI... Vui lòng chờ.")
    try:
        from modules.pipeline import run_pipeline
        count = await asyncio.to_thread(run_pipeline)
        await update.message.reply_text(
            f"✅ Quét xong! Đã xử lý {count} bài mới."
        )
    except Exception as e:
        logger.error(f"Lỗi khi quét thủ công: {e}")
        await update.message.reply_text(f"❌ Lỗi: {e}")


# ─── Khởi động bot ─────────────────────────────────────────────────────────────

def build_application() -> Application:
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_start))
    app.add_handler(CommandHandler("stats", cmd_stats))
    app.add_handler(CommandHandler("drafts", cmd_drafts))
    app.add_handler(CommandHandler("scan_ai_news", cmd_scan))
    app.add_handler(CallbackQueryHandler(handle_callback))
    return app


def run_bot():
    """Chạy Telegram bot (blocking)."""
    if not TELEGRAM_BOT_TOKEN:
        logger.error("Chưa cấu hình TELEGRAM_BOT_TOKEN. Bot không chạy.")
        return
    logger.info("Khởi động Telegram Bot...")
    app = build_application()
    app.run_polling(drop_pending_updates=True)
