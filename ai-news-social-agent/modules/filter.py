import logging
from config import IMPORTANT_KEYWORDS, EXCLUDE_KEYWORDS, MIN_IMPORTANCE_SCORE

logger = logging.getLogger(__name__)


def compute_importance_score(article: dict) -> int:
    """Tính điểm quan trọng (0-20) dựa trên từ khoá trong tiêu đề và tóm tắt."""
    text = (
        article.get("title", "") + " " + article.get("raw_summary", "")
    ).lower()

    score = 0

    # Từ khoá ưu tiên cao (3 điểm)
    high_priority = [
        "openai", "chatgpt", "gpt-4", "gpt-5", "claude", "anthropic",
        "gemini", "sora", "ai agent", "agi", "gpt",
    ]
    for kw in high_priority:
        if kw in text:
            score += 3

    # Từ khoá trung bình (2 điểm)
    mid_priority = [
        "google ai", "deepmind", "meta ai", "microsoft ai", "copilot",
        "llama", "mistral", "midjourney", "stable diffusion", "dall-e",
        "ai model", "ai launch", "ai release", "ai update",
        "ai video", "ai image", "text to video",
    ]
    for kw in mid_priority:
        if kw in text:
            score += 2

    # Từ khoá thông thường (1 điểm)
    for kw in IMPORTANT_KEYWORDS:
        if kw in text:
            score += 1

    # Giới hạn tối đa
    return min(score, 20)


def importance_level(score: int) -> str:
    if score >= 12:
        return "Cao"
    elif score >= 6:
        return "Trung bình"
    return "Thấp"


def has_exclude_keywords(article: dict) -> bool:
    text = (
        article.get("title", "") + " " + article.get("raw_summary", "")
    ).lower()
    return any(kw in text for kw in EXCLUDE_KEYWORDS)


def filter_news(articles: list[dict]) -> list[dict]:
    """Lọc và chấm điểm danh sách bài báo."""
    filtered = []
    for article in articles:
        if has_exclude_keywords(article):
            logger.debug(f"Loại bỏ (từ khoá rác): {article['title'][:60]}")
            continue

        score = compute_importance_score(article)
        if score < MIN_IMPORTANCE_SCORE:
            logger.debug(
                f"Loại bỏ (điểm thấp={score}): {article['title'][:60]}"
            )
            continue

        article["importance_score"] = score
        article["importance_level"] = importance_level(score)
        filtered.append(article)

    # Sắp xếp theo điểm giảm dần
    filtered.sort(key=lambda x: x["importance_score"], reverse=True)
    logger.info(f"Sau khi lọc còn {len(filtered)} bài.")
    return filtered
