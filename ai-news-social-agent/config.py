import os
from dotenv import load_dotenv

load_dotenv()

# === AI Provider ===
AI_PROVIDER = os.getenv("AI_PROVIDER", "openai")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
DEEPSEEK_BASE_URL = "https://api.deepseek.com"

# === Telegram ===
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

# === Database ===
DB_PATH = os.path.join(os.path.dirname(__file__), "data", "news.db")

# === Cài đặt hệ thống ===
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
MAX_NEWS_PER_RUN = int(os.getenv("MAX_NEWS_PER_RUN", "20"))
MIN_IMPORTANCE_SCORE = int(os.getenv("MIN_IMPORTANCE_SCORE", "5"))

# === Lịch chạy (giờ Việt Nam, UTC+7) ===
SCHEDULE_HOURS_VN = [7, 12, 20]  # 7h, 12h, 20h

# === Nguồn RSS ===
RSS_SOURCES = [
    {
        "name": "OpenAI Blog",
        "url": "https://openai.com/news/rss.xml",
        "category": "openai",
    },
    {
        "name": "Google DeepMind",
        "url": "https://deepmind.google/blog/rss.xml",
        "category": "google",
    },
    {
        "name": "Anthropic News",
        "url": "https://www.anthropic.com/rss.xml",
        "category": "anthropic",
    },
    {
        "name": "Meta AI",
        "url": "https://ai.meta.com/blog/rss/",
        "category": "meta",
    },
    {
        "name": "Microsoft AI",
        "url": "https://blogs.microsoft.com/ai/feed/",
        "category": "microsoft",
    },
    {
        "name": "NVIDIA AI",
        "url": "https://blogs.nvidia.com/feed/",
        "category": "nvidia",
    },
    {
        "name": "Hugging Face Blog",
        "url": "https://huggingface.co/blog/feed.xml",
        "category": "huggingface",
    },
    {
        "name": "TechCrunch AI",
        "url": "https://techcrunch.com/category/artificial-intelligence/feed/",
        "category": "techcrunch",
    },
    {
        "name": "VentureBeat AI",
        "url": "https://venturebeat.com/category/ai/feed/",
        "category": "venturebeat",
    },
    {
        "name": "The Verge AI",
        "url": "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml",
        "category": "theverge",
    },
]

# === Từ khoá lọc tin quan trọng ===
IMPORTANT_KEYWORDS = [
    # AI tổng quát
    "artificial intelligence", "machine learning", "deep learning",
    "neural network", "large language model", "llm", "foundation model",
    # AI Agent
    "ai agent", "autonomous agent", "agentic", "multi-agent",
    # Sản phẩm nổi bật
    "chatgpt", "gpt-4", "gpt-5", "openai", "claude", "anthropic",
    "gemini", "google ai", "bard", "copilot", "microsoft ai",
    "llama", "meta ai", "mistral", "groq", "perplexity",
    "midjourney", "stable diffusion", "dall-e", "sora",
    # Lĩnh vực
    "ai video", "ai image", "ai audio", "ai voice", "text to video",
    "ai automation", "ai workflow", "ai tool", "ai app",
    "ai coding", "ai programming", "github copilot",
    "ai business", "ai startup", "ai investment", "ai funding",
    "ai education", "ai healthcare", "ai finance",
    "ai content", "ai marketing", "ai seo",
    "ai travel", "ai creative",
    # Xu hướng
    "agi", "superintelligence", "ai safety", "ai regulation",
    "ai job", "ai replace", "ai impact", "ai future",
    "ai model", "ai release", "ai launch", "ai update",
    "ai benchmark", "ai research", "ai paper",
]

# Từ khoá loại bỏ
EXCLUDE_KEYWORDS = [
    "advertisement", "sponsored", "promo", "buy now",
    "discount", "sale", "offer", "deal",
]

# Ngưỡng ngày cũ (giờ)
MAX_NEWS_AGE_HOURS = 48
