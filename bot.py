import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

# ============================================================
# ТОКЕН (ВСТАВЬ СВОЙ)
# ============================================================
BOT_TOKEN = ""
# ============================================================
# НАСТРОЙКИ
# ============================================================
logging.basicConfig(level=logging.INFO)

bot = Bot(
    token=BOT_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML)
)
dp = Dispatcher()

# ============================================================
# КНОПКА ДЛЯ ОТКРЫТИЯ САЙТА
# ============================================================
def webapp_keyboard():
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(
                text="🚀 ОТКРЫТЬ UNDERDOGG",
                web_app=WebAppInfo(url="https://shdofeh-ship-it.github.io/UNDERDOGG-v2-base/home.html")
            )]
        ]
    )

# ============================================================
# КОМАНДА /start
# ============================================================
@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    await message.answer(
        "🎰 <b>ДОБРО ПОЖАЛОВАТЬ В UNDERDOGG!</b>\n\n"
        "Нажми на кнопку ниже, чтобы открыть панель управления.\n"
        "Все функции доступны прямо в Telegram.",
        reply_markup=webapp_keyboard()
    )

# ============================================================
# ЗАПУСК БОТА
# ============================================================
async def main():
    print("🤖 Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
