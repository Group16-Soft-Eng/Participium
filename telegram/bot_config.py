from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler
from telegram import BotCommand
import requests
from endpoint import *
conv_handler = ConversationHandler(
    entry_points=[CommandHandler('report', sendReport)],
    states={
        WAITING_LOCATION: [MessageHandler(filters.LOCATION, receiveLocation)],
    },
    fallbacks=[CommandHandler('cancel', cancel)]
)

async def post_init(application):
    # Set only /start command initially (global default)
    await application.bot.set_my_commands([
        BotCommand("start", "Avvia il bot"),
    ])

app = ApplicationBuilder().token("8413586512:AAHkAtWfo3A2LLfwc7_QmEnlYTTsjqn7_UM").post_init(post_init).build()
app.add_handler(CommandHandler("start", start))
app.add_handler(CommandHandler("login", retrieveAccount))
app.add_handler(CommandHandler("info", info))
app.add_handler(conv_handler)
app.run_polling()
