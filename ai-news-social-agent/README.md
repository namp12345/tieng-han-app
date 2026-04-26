# AI News Social Agent

Tự động quét tin tức AI mới nhất, tóm tắt tiếng Việt, tạo nội dung mạng xã hội và gửi nháp qua Telegram để duyệt.

## Cấu trúc

```
ai-news-social-agent/
├── main.py              # Entry point
├── config.py            # Cấu hình nguồn tin, từ khoá, lịch chạy
├── .env.example         # Template biến môi trường
├── requirements.txt
├── data/
│   └── news.db          # SQLite database (tự tạo)
└── modules/
    ├── collector.py     # Thu thập RSS
    ├── filter.py        # Lọc & chấm điểm tin
    ├── summarizer.py    # Tóm tắt tiếng Việt (OpenAI/DeepSeek)
    ├── social_writer.py # Tạo Facebook/TikTok/LinkedIn/Telegram posts
    ├── telegram_bot.py  # Bot nhận lệnh và gửi nháp
    ├── pipeline.py      # Orchestrate toàn bộ quy trình
    ├── publisher.py     # Đăng bài (Giai đoạn 2)
    ├── scheduler.py     # Chạy định kỳ 7h/12h/20h
    └── storage.py       # SQLite CRUD
```

## Cài đặt

```bash
cd ai-news-social-agent
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Chỉnh sửa .env với API keys của bạn
```

## Cấu hình `.env`

| Biến | Mô tả |
|------|-------|
| `AI_PROVIDER` | `openai` hoặc `deepseek` |
| `OPENAI_API_KEY` | API key từ platform.openai.com |
| `DEEPSEEK_API_KEY` | API key từ platform.deepseek.com |
| `TELEGRAM_BOT_TOKEN` | Token từ @BotFather |
| `TELEGRAM_CHAT_ID` | Chat ID của bạn (dùng @userinfobot) |

## Chạy

```bash
# Quét tin ngay một lần (test)
python main.py --scan-now

# Xem thống kê
python main.py --stats

# Chạy đầy đủ: Scheduler 3 lần/ngày + Telegram Bot
python main.py

# Chỉ chạy Telegram Bot (nếu scheduler chạy riêng)
python main.py --bot-only
```

## Lệnh Telegram

| Lệnh | Chức năng |
|------|-----------|
| `/scan_ai_news` | Quét tin ngay lập tức |
| `/drafts` | Xem 5 bài nháp mới nhất |
| `/stats` | Thống kê database |
| `/help` | Hướng dẫn |

## Quy trình duyệt bài

1. Bot gửi tin nháp kèm nút bấm
2. Nhấn **✅ Duyệt FB** → Xem Facebook post đầy đủ
3. Nhấn **💼 Duyệt LI** → Xem LinkedIn post
4. Nhấn **📢 Duyệt TG** → Đăng lên Telegram Channel
5. Nhấn **🎬 Xem TikTok** → Xem script video
6. Nhấn **❌ Bỏ qua** → Đánh dấu skipped
7. Nhấn **🔁 Viết lại** → Tính năng sắp có

## Mở rộng thêm nguồn

Thêm vào `RSS_SOURCES` trong `config.py`:

```python
{
    "name": "Tên Nguồn",
    "url": "https://example.com/rss.xml",
    "category": "custom",
},
```

## Roadmap

- [x] MVP: Quét RSS, tóm tắt VI, Facebook/TikTok/LinkedIn posts, Telegram duyệt bài
- [ ] Giai đoạn 2: Tự động đăng Facebook Page
- [ ] Giai đoạn 3: Instagram, LinkedIn, TikTok API
- [ ] Giai đoạn 4: YouTube Shorts tự động
- [ ] Giai đoạn 5: Google Sheets logging
