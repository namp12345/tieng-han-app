# AI News Social Agent

Tự động quét tin tức AI mới nhất, tóm tắt tiếng Việt, tạo nội dung mạng xã hội và gửi nháp qua Telegram để duyệt.

## Dùng hoàn toàn MIỄN PHÍ

| Provider | Giới hạn free | Đăng ký |
|----------|--------------|---------|
| **Google Gemini** ⭐ | 1,500 req/ngày · 1M tokens/ngày | [aistudio.google.com](https://aistudio.google.com) — chỉ cần Google account |
| **Groq** | ~14,400 req/ngày · siêu nhanh | [console.groq.com](https://console.groq.com) — Google/GitHub login |
| **Ollama** | Không giới hạn · chạy offline | [ollama.ai](https://ollama.ai) — không cần internet sau khi cài |

> **Khuyến nghị**: Dùng **Gemini** (đăng ký 1 phút, free rất nhiều, chất lượng tốt).

## Cấu trúc

```
ai-news-social-agent/
├── main.py              # Entry point + CLI
├── config.py            # Nguồn tin, từ khoá, lịch chạy, AI provider
├── .env.example         # Template cấu hình (copy thành .env)
├── requirements.txt
├── data/news.db         # SQLite tự tạo khi chạy
└── modules/
    ├── collector.py     # Thu thập RSS từ 10 nguồn
    ├── filter.py        # Lọc & chấm điểm Cao/TB/Thấp
    ├── summarizer.py    # Tóm tắt tiếng Việt (hỗ trợ 5 provider)
    ├── social_writer.py # Tạo Facebook/TikTok/LinkedIn/Telegram posts
    ├── telegram_bot.py  # Bot + nút duyệt bài inline
    ├── pipeline.py      # Orchestrate toàn bộ quy trình
    ├── publisher.py     # Đăng bài (Giai đoạn 2)
    ├── scheduler.py     # Tự chạy 7h/12h/20h giờ VN
    └── storage.py       # SQLite CRUD + chống trùng
```

## Cài đặt nhanh

```bash
cd ai-news-social-agent
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

## Bước 1 — Lấy Gemini API key (miễn phí, 2 phút)

1. Vào [aistudio.google.com](https://aistudio.google.com)
2. Đăng nhập bằng Google account
3. Nhấn **"Get API key"** → **"Create API key"**
4. Copy key, dán vào `.env`:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=AIza...key-của-bạn...
```

## Bước 2 — Tạo Telegram Bot (miễn phí, 3 phút)

1. Mở Telegram, tìm **@BotFather** → `/newbot`
2. Đặt tên bot → lấy **token** (dạng `123456:ABC-DEF...`)
3. Tìm **@userinfobot** → gửi bất kỳ tin → lấy **chat ID** (số nguyên)
4. Điền vào `.env`:

```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_CHAT_ID=987654321
```

## Bước 3 — Chạy

```bash
# Test quét một lần
python main.py --scan-now

# Xem thống kê database
python main.py --stats

# Chạy đầy đủ: tự động 7h/12h/20h + Telegram Bot
python main.py
```

## Lệnh Telegram

| Lệnh | Chức năng |
|------|-----------|
| `/scan_ai_news` | Quét tin ngay lập tức |
| `/drafts` | Xem 5 bài nháp gần nhất |
| `/stats` | Thống kê database |
| `/help` | Hướng dẫn |

## Nút duyệt bài trong Telegram

Mỗi bài sẽ gửi kèm các nút:

| Nút | Hành động |
|-----|-----------|
| ✅ Duyệt FB | Xem Facebook post đầy đủ |
| 💼 Duyệt LI | Xem LinkedIn post |
| 📢 Duyệt TG | Đăng lên Telegram channel |
| 🎬 Xem TikTok | Xem script video |
| ❌ Bỏ qua | Đánh dấu skipped |
| 🔁 Viết lại | Tính năng giai đoạn 2 |

## Chuyển provider

Chỉnh `AI_PROVIDER` trong `.env`:

```env
# Dùng Groq (nhanh hơn, cũng free)
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...

# Dùng Ollama (offline hoàn toàn)
AI_PROVIDER=ollama
# Cài trước: ollama pull gemma2:2b
```

## Thêm nguồn RSS

Thêm vào `RSS_SOURCES` trong `config.py`:

```python
{
    "name": "Tên Nguồn",
    "url": "https://example.com/rss.xml",
    "category": "custom",
},
```

## Roadmap

- [x] MVP: Quét RSS, tóm tắt VI, Facebook/TikTok/LinkedIn/Telegram posts, duyệt bài
- [x] Hỗ trợ AI free: Gemini, Groq, Ollama
- [ ] Giai đoạn 2: Tự động đăng Facebook Page
- [ ] Giai đoạn 3: Instagram, LinkedIn, TikTok API
- [ ] Giai đoạn 4: YouTube Shorts tự động
- [ ] Giai đoạn 5: Google Sheets logging
