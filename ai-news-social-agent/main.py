#!/usr/bin/env python3
"""
AI News Social Agent - Main Entry Point

Tự động quét tin AI, tóm tắt tiếng Việt, tạo social posts,
gửi nháp qua Telegram để duyệt.
"""

import sys
import logging
import argparse
import signal
from pathlib import Path

# Đảm bảo import được từ thư mục gốc
sys.path.insert(0, str(Path(__file__).parent))

from config import LOG_LEVEL
from modules.storage import init_db
from modules.scheduler import start_scheduler, stop_scheduler
from modules.telegram_bot import run_bot, send_text

# ─── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("ai_news_agent.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)


# ─── CLI ──────────────────────────────────────────────────────────────────────

def parse_args():
    parser = argparse.ArgumentParser(
        description="AI News Social Agent",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ví dụ:
  python main.py              # Chạy đầy đủ: scheduler + bot
  python main.py --scan-now   # Quét tin ngay một lần
  python main.py --bot-only   # Chỉ chạy Telegram bot
  python main.py --stats      # Xem thống kê database
        """,
    )
    parser.add_argument(
        "--scan-now",
        action="store_true",
        help="Quét tin ngay lập tức một lần rồi thoát",
    )
    parser.add_argument(
        "--bot-only",
        action="store_true",
        help="Chỉ khởi động Telegram bot, không chạy scheduler",
    )
    parser.add_argument(
        "--stats",
        action="store_true",
        help="Hiển thị thống kê database rồi thoát",
    )
    return parser.parse_args()


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    args = parse_args()

    logger.info("═══ AI News Social Agent đang khởi động ═══")

    # Khởi tạo database
    init_db()

    # Chế độ thống kê
    if args.stats:
        from modules.storage import get_stats
        stats = get_stats()
        print(f"\n📊 Thống kê Database:")
        print(f"  Tổng bài: {stats['total']}")
        for status, count in stats.get("by_status", {}).items():
            print(f"  {status}: {count}")
        return

    # Chế độ quét một lần
    if args.scan_now:
        logger.info("Chế độ: Quét tin ngay một lần.")
        from modules.pipeline import run_pipeline
        count = run_pipeline()
        logger.info(f"Hoàn thành. Đã xử lý {count} bài mới.")
        return

    # Chế độ bot only
    if args.bot_only:
        logger.info("Chế độ: Chỉ chạy Telegram Bot.")
        run_bot()
        return

    # Chế độ mặc định: Scheduler + Bot cùng lúc
    logger.info("Chế độ: Scheduler + Telegram Bot.")

    scheduler = start_scheduler()

    # Xử lý signal để tắt sạch
    def shutdown(sig, frame):
        logger.info("Nhận tín hiệu tắt. Đang dừng...")
        stop_scheduler(scheduler)
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Thông báo khởi động
    send_text(
        "🚀 *AI News Social Agent* đã khởi động!\n\n"
        "⏰ Lịch quét: 7h, 12h, 20h (giờ VN)\n"
        "📱 Dùng /scan\\_ai\\_news để quét ngay\n"
        "📊 Dùng /stats để xem thống kê"
    )

    # Chạy Telegram bot (blocking - giữ process sống)
    run_bot()


if __name__ == "__main__":
    main()
