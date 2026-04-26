import logging
import pytz
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from config import SCHEDULE_HOURS_VN
from modules.pipeline import run_pipeline

logger = logging.getLogger(__name__)

VN_TZ = pytz.timezone("Asia/Ho_Chi_Minh")


def _job():
    logger.info("Scheduler: Bắt đầu chạy pipeline theo lịch.")
    try:
        run_pipeline()
    except Exception as e:
        logger.error(f"Scheduler: Lỗi khi chạy pipeline: {e}", exc_info=True)


def start_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler(timezone=VN_TZ)

    for hour in SCHEDULE_HOURS_VN:
        scheduler.add_job(
            _job,
            trigger=CronTrigger(hour=hour, minute=0, timezone=VN_TZ),
            id=f"news_scan_{hour}h",
            name=f"Quét tin AI lúc {hour}:00 VN",
            replace_existing=True,
            misfire_grace_time=300,  # Cho phép trễ tối đa 5 phút
        )
        logger.info(f"Đã lên lịch quét tin lúc {hour}:00 giờ Việt Nam.")

    scheduler.start()
    logger.info("Scheduler đã khởi động.")
    return scheduler


def stop_scheduler(scheduler: BackgroundScheduler):
    if scheduler and scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler đã dừng.")
