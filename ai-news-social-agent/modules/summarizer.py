import time
import json
import logging
from openai import OpenAI
from config import (
    AI_PROVIDER,
    GEMINI_API_KEY, GEMINI_MODEL, GEMINI_BASE_URL,
    GROQ_API_KEY, GROQ_MODEL, GROQ_BASE_URL,
    OLLAMA_BASE_URL, OLLAMA_MODEL,
    OPENAI_API_KEY, OPENAI_MODEL,
    DEEPSEEK_API_KEY, DEEPSEEK_MODEL, DEEPSEEK_BASE_URL,
    AI_RATE_LIMIT_DELAY,
)

logger = logging.getLogger(__name__)

# Cấu hình từng provider — tất cả đều dùng OpenAI-compatible API
_PROVIDERS = {
    "gemini": {
        "api_key": lambda: GEMINI_API_KEY,
        "base_url": GEMINI_BASE_URL,
        "model": lambda: GEMINI_MODEL,
        "label": "Google Gemini (free)",
        "supports_system": False,  # Gemini ghép system vào user message
    },
    "groq": {
        "api_key": lambda: GROQ_API_KEY,
        "base_url": GROQ_BASE_URL,
        "model": lambda: GROQ_MODEL,
        "label": "Groq (free)",
        "supports_system": True,
    },
    "ollama": {
        "api_key": lambda: "ollama",  # Ollama không cần key thật
        "base_url": OLLAMA_BASE_URL,
        "model": lambda: OLLAMA_MODEL,
        "label": "Ollama (local free)",
        "supports_system": True,
    },
    "openai": {
        "api_key": lambda: OPENAI_API_KEY,
        "base_url": None,
        "model": lambda: OPENAI_MODEL,
        "label": "OpenAI",
        "supports_system": True,
    },
    "deepseek": {
        "api_key": lambda: DEEPSEEK_API_KEY,
        "base_url": DEEPSEEK_BASE_URL,
        "model": lambda: DEEPSEEK_MODEL,
        "label": "DeepSeek",
        "supports_system": True,
    },
}


def _get_provider_cfg() -> dict:
    cfg = _PROVIDERS.get(AI_PROVIDER)
    if not cfg:
        raise ValueError(f"AI_PROVIDER không hợp lệ: '{AI_PROVIDER}'. Chọn: {list(_PROVIDERS)}")
    return cfg


def _get_client() -> OpenAI:
    cfg = _get_provider_cfg()
    kwargs = {"api_key": cfg["api_key"]()}
    if cfg["base_url"]:
        kwargs["base_url"] = cfg["base_url"]
    return OpenAI(**kwargs)


def _call_ai(system: str, user: str, max_tokens: int = 1500) -> str:
    """Gọi AI API với retry tự động khi bị rate limit."""
    cfg = _get_provider_cfg()
    client = _get_client()
    model = cfg["model"]()

    # Gemini không hỗ trợ role system riêng → ghép vào user message
    if cfg["supports_system"]:
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]
    else:
        messages = [{"role": "user", "content": f"{system}\n\n{user}"}]

    for attempt in range(3):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                max_tokens=max_tokens,
            )
            time.sleep(AI_RATE_LIMIT_DELAY)  # Tránh rate limit free tier
            return response.choices[0].message.content.strip()

        except Exception as e:
            err = str(e).lower()
            if "rate" in err or "429" in err or "quota" in err:
                wait = (attempt + 1) * 10
                logger.warning(f"Rate limit {cfg['label']}, chờ {wait}s... (lần {attempt+1})")
                time.sleep(wait)
            else:
                raise

    raise RuntimeError(f"Gọi AI thất bại sau 3 lần thử ({cfg['label']})")


# ─── Prompt tóm tắt ───────────────────────────────────────────────────────────

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


def _parse_json_response(text: str) -> dict:
    """Làm sạch và parse JSON từ phản hồi AI."""
    text = text.strip()
    if text.startswith("```"):
        parts = text.split("```")
        text = parts[1] if len(parts) > 1 else text
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


def summarize_article(article: dict) -> dict:
    """Tóm tắt bài báo bằng tiếng Việt."""
    title = article.get("title", "")
    raw_summary = article.get("raw_summary", "")
    full_text = article.get("full_text", "")

    content = full_text or raw_summary or title
    user_prompt = (
        f"Nguồn: {article.get('source', '')}\n"
        f"Tiêu đề gốc: {title}\n"
        f"URL: {article.get('url', '')}\n"
        f"Nội dung: {content[:2000]}"
    )

    try:
        data = _parse_json_response(_call_ai(SUMMARIZE_SYSTEM, user_prompt))
        article["title_vi"] = data.get("title_vi", title)
        article["summary_vi"] = data.get("summary_vi", raw_summary)
        article["why_important"] = data.get("why_important", "")
        article["practical_use"] = data.get("practical_use", "")
        if "importance_level" in data and not article.get("importance_level"):
            article["importance_level"] = data["importance_level"]
        logger.info(f"Tóm tắt [{AI_PROVIDER}] xong: {title[:60]}")
    except Exception as e:
        logger.error(f"Lỗi tóm tắt '{title[:60]}': {e}")
        article["title_vi"] = title
        article["summary_vi"] = raw_summary[:500] if raw_summary else ""
        article["why_important"] = ""
        article["practical_use"] = ""

    return article
