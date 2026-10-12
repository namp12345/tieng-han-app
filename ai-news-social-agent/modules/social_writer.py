import json
import logging
from modules.summarizer import _call_ai

logger = logging.getLogger(__name__)

# ─── Prompt templates ─────────────────────────────────────────────────────────

FACEBOOK_SYSTEM = """Bạn là chuyên gia viết content mạng xã hội tiếng Việt.
Tạo Facebook post hấp dẫn theo cấu trúc:
- Mở đầu bằng câu hook mạnh (dùng emoji phù hợp)
- Nội dung dễ hiểu, có cảm xúc, 3-5 bullet điểm ngắn
- Kết thúc bằng câu hỏi kích thích tương tác
- 5-8 hashtag liên quan đến AI, công nghệ, Việt Nam
Giọng văn: thân thiện, gần gũi, không quá chuyên ngành."""

TIKTOK_SYSTEM = """Bạn là chuyên gia viết script TikTok/YouTube Shorts tiếng Việt.
Tạo script video 45-60 giây theo cấu trúc:
[HOOK - 3 giây]: Câu mở đầu gây sốc/tò mò, VIẾT HOA
[NỘI DUNG - 40 giây]: Giải thích rõ ràng, dùng ví dụ gần gũi
[CTA - 5 giây]: Kêu gọi follow/like/comment
Thêm hướng dẫn cảnh quay ngắn trong [dấu ngoặc vuông] nếu cần."""

LINKEDIN_SYSTEM = """Bạn là chuyên gia viết content LinkedIn chuyên nghiệp tiếng Việt.
Tạo LinkedIn post theo cấu trúc:
- Mở đầu với insight hoặc số liệu ấn tượng
- Phân tích ảnh hưởng đến công việc, kinh doanh, thị trường Việt Nam
- Bài học hoặc hành động cụ thể cho doanh nghiệp/cá nhân
- 3-5 hashtag chuyên nghiệp
Giọng văn: chuyên nghiệp, có chiều sâu, tư duy lãnh đạo."""

TELEGRAM_SYSTEM = """Tạo Telegram message ngắn gọn về tin tức AI, dùng emoji phù hợp.
Định dạng:
🔥 [Tiêu đề tiếng Việt hấp dẫn]

📌 [Tóm tắt 2-3 câu]

⚡ Tại sao quan trọng: [1-2 câu]

🇻🇳 Cho người Việt: [1-2 câu ứng dụng thực tế]

📎 Nguồn: [tên nguồn]
🔗 [URL]

🏷 #AI #CôngNghệ"""


def _build_user_prompt(article: dict) -> str:
    return f"""Tiêu đề gốc: {article.get('title', '')}
Tiêu đề tiếng Việt: {article.get('title_vi', '')}
Tóm tắt: {article.get('summary_vi', '')}
Tại sao quan trọng: {article.get('why_important', '')}
Ứng dụng cho người Việt: {article.get('practical_use', '')}
Nguồn: {article.get('source', '')}
URL: {article.get('url', '')}"""


def write_facebook(article: dict) -> str:
    try:
        return _call_ai(FACEBOOK_SYSTEM, _build_user_prompt(article))
    except Exception as e:
        logger.error(f"Lỗi viết Facebook post: {e}")
        return f"[Lỗi tạo Facebook post]\n{article.get('title_vi', '')}\n{article.get('url', '')}"


def write_tiktok(article: dict) -> str:
    try:
        return _call_ai(TIKTOK_SYSTEM, _build_user_prompt(article))
    except Exception as e:
        logger.error(f"Lỗi viết TikTok script: {e}")
        return f"[Lỗi tạo TikTok script]\n{article.get('title_vi', '')}"


def write_linkedin(article: dict) -> str:
    try:
        return _call_ai(LINKEDIN_SYSTEM, _build_user_prompt(article))
    except Exception as e:
        logger.error(f"Lỗi viết LinkedIn post: {e}")
        return f"[Lỗi tạo LinkedIn post]\n{article.get('title_vi', '')}"


def write_telegram_summary(article: dict) -> str:
    try:
        return _call_ai(TELEGRAM_SYSTEM, _build_user_prompt(article))
    except Exception as e:
        logger.error(f"Lỗi viết Telegram summary: {e}")
        # Fallback thủ công
        return (
            f"🔥 {article.get('title_vi', article.get('title', ''))}\n\n"
            f"📌 {article.get('summary_vi', '')}\n\n"
            f"📎 {article.get('source', '')}\n"
            f"🔗 {article.get('url', '')}"
        )


def generate_all_social_posts(article: dict) -> dict:
    """Tạo tất cả 4 định dạng social posts cho một bài báo."""
    logger.info(f"Đang tạo social posts cho: {article.get('title_vi', '')[:50]}")
    return {
        "facebook": write_facebook(article),
        "tiktok": write_tiktok(article),
        "linkedin": write_linkedin(article),
        "telegram": write_telegram_summary(article),
    }
