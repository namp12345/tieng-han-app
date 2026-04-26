import logging
from openai import OpenAI
from config import (
    AI_PROVIDER, OPENAI_API_KEY, OPENAI_MODEL,
    DEEPSEEK_API_KEY, DEEPSEEK_MODEL, DEEPSEEK_BASE_URL,
)

logger = logging.getLogger(__name__)


def _get_client() -> OpenAI:
    """Trả về OpenAI client (hoặc DeepSeek-compatible client)."""
    if AI_PROVIDER == "deepseek":
        return OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)
    return OpenAI(api_key=OPENAI_API_KEY)


def _get_model() -> str:
    return DEEPSEEK_MODEL if AI_PROVIDER == "deepseek" else OPENAI_MODEL


def _call_ai(system: str, user: str) -> str:
    """Gọi AI API, trả về text. Raise exception nếu lỗi."""
    client = _get_client()
    model = _get_model()
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.7,
        max_tokens=1500,
    )
    return response.choices[0].message.content.strip()


SUMMARIZE_SYSTEM = """Bạn là chuyên gia phân tích tin tức AI cho độc giả Việt Nam.
Hãy tóm tắt bài báo theo định dạng JSON sau (không markdown):
{
  "title_vi": "Tiêu đề tiếng Việt hấp dẫn",
  "summary_vi": "Tóm tắt 3-5 dòng rõ ràng, dễ hiểu",
  "why_important": "Vì sao tin này quan trọng (2-3 câu)",
  "practical_use": "Ứng dụng thực tế cho người Việt Nam (2-3 câu)",
  "importance_level": "Cao | Trung bình | Thấp"
}
Trả về JSON thuần túy, không có text xung quanh."""


def summarize_article(article: dict) -> dict:
    """Tóm tắt bài báo bằng tiếng Việt. Trả về dict với các trường mới."""
    title = article.get("title", "")
    raw_summary = article.get("raw_summary", "")
    full_text = article.get("full_text", "")
    source = article.get("source", "")
    url = article.get("url", "")

    content = full_text or raw_summary or title
    user_prompt = f"""Nguồn: {source}
Tiêu đề gốc: {title}
URL: {url}
Nội dung: {content[:2000]}"""

    try:
        import json
        result_text = _call_ai(SUMMARIZE_SYSTEM, user_prompt)

        # Làm sạch nếu AI bọc trong ```json
        result_text = result_text.strip()
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
        result_text = result_text.strip()

        data = json.loads(result_text)
        article["title_vi"] = data.get("title_vi", title)
        article["summary_vi"] = data.get("summary_vi", raw_summary)
        article["why_important"] = data.get("why_important", "")
        article["practical_use"] = data.get("practical_use", "")
        # Giữ importance_level từ filter nếu không có từ AI
        if "importance_level" in data and not article.get("importance_level"):
            article["importance_level"] = data["importance_level"]
        logger.info(f"Tóm tắt xong: {title[:60]}")
    except Exception as e:
        logger.error(f"Lỗi tóm tắt bài '{title[:60]}': {e}")
        # Fallback: giữ nguyên title, để trống summary
        article["title_vi"] = title
        article["summary_vi"] = raw_summary[:500] if raw_summary else ""
        article["why_important"] = ""
        article["practical_use"] = ""

    return article
