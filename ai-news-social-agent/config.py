import os
from dotenv import load_dotenv

load_dotenv()

# === AI Provider ===
# Các lựa chọn FREE: "gemini" | "groq" | "ollama"
# Trả phí:           "openai" | "deepseek"
AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini")

# --- Google Gemini (FREE: 1,500 req/ngày, 1M tokens/ngày) ---
# Lấy key miễn phí tại: aistudio.google.com (chỉ cần Google account)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"

# --- Groq (FREE: ~14,400 req/ngày, siêu nhanh) ---
# Lấy key miễn phí tại: console.groq.com (Google/GitHub login)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
GROQ_BASE_URL = "https://api.groq.com/openai/v1"

# --- Ollama (FREE hoàn toàn, chạy local, không cần internet) ---
# Cài tại: ollama.ai → chạy: ollama pull gemma2:2b
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma2:2b")

# --- OpenAI (trả phí) ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# --- DeepSeek (trả phí, rẻ) ---
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
DEEPSEEK_BASE_URL = "https://api.deepseek.com"

# Rate limit delay giữa các lần gọi AI (giây) - tránh bị block free tier
AI_RATE_LIMIT_DELAY = float(os.getenv("AI_RATE_LIMIT_DELAY", "2"))

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
