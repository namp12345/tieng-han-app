"""Credential-free regressions. Minimal SDK doubles when Telegram is unavailable."""
import importlib.util
import sys
import types
import unittest
from html import escape
from unittest.mock import AsyncMock, patch

if importlib.util.find_spec("telegram") is None:
    telegram = types.ModuleType("telegram")
    for name in ("Bot", "InlineKeyboardButton", "InlineKeyboardMarkup", "Update"):
        setattr(telegram, name, lambda *a, **kw: None)
    ext = types.ModuleType("telegram.ext")
    for name in ("Application", "CallbackQueryHandler", "CommandHandler"):
        setattr(ext, name, object)
    ext.ContextTypes = types.SimpleNamespace(DEFAULT_TYPE=object)
    error = types.ModuleType("telegram.error")
    error.TelegramError = type("TelegramError", (Exception,), {})
    sys.modules.update({"telegram": telegram, "telegram.ext": ext, "telegram.error": error})
if importlib.util.find_spec("dotenv") is None:
    dotenv = types.ModuleType("dotenv")
    dotenv.load_dotenv = lambda: None
    sys.modules["dotenv"] = dotenv

from telegram.error import TelegramError
from modules import telegram_bot as tb, publisher


class TelegramTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.post = "_AI* [field](https://x/a_b) `code` <tag> & \\"
        self.article = dict(id=7, status="draft", source=self.post,
                            importance_level="Cao", social_posts={"telegram": self.post})
        self.query = types.SimpleNamespace(data="approve_tg_7", answer=AsyncMock(),
                                          edit_message_text=AsyncMock(),
                                          message=types.SimpleNamespace(chat_id="review"))
        self.update = types.SimpleNamespace(callback_query=self.query,
                         message=types.SimpleNamespace(reply_text=AsyncMock()))
        self.bot = types.SimpleNamespace(send_message=AsyncMock())
        self.context = types.SimpleNamespace(bot=self.bot)

    async def test_stats_escapes_dynamic_status(self):
        with patch.object(tb.storage, "get_stats", return_value={
                "total": 3, "by_status": {"approved_tg": 2, "<bad>&": 1}}):
            await tb.cmd_stats(self.update, self.context)
        args = self.update.message.reply_text.call_args
        self.assertEqual(args.kwargs["parse_mode"], "HTML")
        self.assertIn("approved_tg", args.args[0])
        self.assertIn("&lt;bad&gt;&amp;", args.args[0])

    async def test_draft_and_drafts_escape_ai_content(self):
        with patch.object(tb, "TELEGRAM_BOT_TOKEN", "dummy"), patch.object(
                tb, "TELEGRAM_CHAT_ID", "review"), patch.object(tb, "Bot", return_value=self.bot):
            await tb.send_draft_async(self.article)
        args = self.bot.send_message.call_args.kwargs
        self.assertEqual(args["parse_mode"], "HTML")
        self.assertIn(escape(self.post), args["text"])
        with patch.object(tb.storage, "get_draft_news", return_value=[self.article]):
            await tb.cmd_drafts(self.update, self.context)
        self.assertEqual(self.update.message.reply_text.call_args.kwargs["parse_mode"], "HTML")

    async def run_callback(self, channel="channel", fail=False, article=None):
        if fail:
            self.bot.send_message.side_effect = [TelegramError("rejected"), None]
        with patch.object(tb, "TELEGRAM_CHANNEL_ID", channel), patch(
                "config.TELEGRAM_CHANNEL_ID", channel), patch.object(
                tb.storage, "get_news_by_id", return_value=article or self.article), patch.object(
                publisher, "get_news_by_id", return_value=article or self.article), patch.object(
                publisher, "update_status") as status:
            if not fail:
                async def accepted(**kwargs):
                    status.assert_not_called()
                self.bot.send_message.side_effect = accepted
            await tb.handle_callback(self.update, self.context)
            return status.call_args_list

    async def test_approval_sends_to_channel_before_recording_success(self):
        calls = await self.run_callback()
        self.bot.send_message.assert_awaited_once_with(
            chat_id="channel", text=self.post, parse_mode=None)
        self.assertEqual(calls[0].args, (7, "posted_tg"))
        self.query.edit_message_text.assert_awaited_once()

    async def test_failure_keeps_status_and_review_buttons_for_retry(self):
        self.assertEqual(await self.run_callback(fail=True), [])
        self.query.edit_message_text.assert_not_awaited()

    async def test_missing_channel_does_not_mark_posted(self):
        self.assertEqual(await self.run_callback(channel=""), [])
        self.assertEqual(self.bot.send_message.call_args.kwargs["chat_id"], "review")
        self.query.edit_message_text.assert_not_awaited()

    async def test_empty_post_does_not_mark_posted(self):
        self.assertEqual(await self.run_callback(article={
            **self.article, "social_posts": {"telegram": " "}}), [])

    async def test_already_posted_is_not_sent_again(self):
        self.assertEqual(await self.run_callback(article={
            **self.article, "status": "posted_tg"}), [])
        self.bot.send_message.assert_not_awaited()


if __name__ == "__main__":
    unittest.main()
