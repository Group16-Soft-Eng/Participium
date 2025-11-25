from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler
from telegram import BotCommand
import requests
from endpoint import *
conv_handler = ConversationHandler(
    entry_points=[
        CommandHandler('report', sendReport),
        CallbackQueryHandler(handle_start_report, pattern="^start_report$")
    ],
    states={
        WAITING_TITLE: [MessageHandler(filters.TEXT & ~filters.COMMAND, receiveTitle), CallbackQueryHandler(handle_back, pattern="^back_")],
        WAITING_DESCRIPTION: [MessageHandler(filters.TEXT & ~filters.COMMAND, receiveDescription), CallbackQueryHandler(handle_back, pattern="^back_")],
        WAITING_CATEGORY: [CallbackQueryHandler(receiveCategory), CallbackQueryHandler(handle_back, pattern="^back_")],
        WAITING_PHOTO: [
            MessageHandler(filters.PHOTO, receivePhoto),
            CommandHandler('done', done_photos),
            CommandHandler('skip', skip_photo),
            CallbackQueryHandler(done_photos, pattern="^done_photos$"),
            CallbackQueryHandler(handle_back, pattern="^back_")
        ],
        WAITING_LOCATION: [MessageHandler(filters.LOCATION, receiveLocation), CallbackQueryHandler(handle_back, pattern="^back_")],
        WAITING_ANONYMOUS: [CallbackQueryHandler(receiveAnonymous), CallbackQueryHandler(handle_back, pattern="^back_")],
    },
    fallbacks=[CommandHandler('cancel', cancel), CallbackQueryHandler(cancel, pattern="^cancel_report$")],
    per_message=False
)

async def post_init(application):
    await application.bot.set_my_commands([
        BotCommand("start", "Avvia il bot"),
        BotCommand("login", "Effettua il login"),
        BotCommand("info", "Recupera le informazioni dell'utente"),
        BotCommand("logout", "Effettua il logout"),
    ])

app = ApplicationBuilder().token("8413586512:AAHkAtWfo3A2LLfwc7_QmEnlYTTsjqn7_UM").post_init(post_init).build()
app.add_handler(CommandHandler("start", start))
app.add_handler(CallbackQueryHandler(handle_login, pattern="^login$"))
app.add_handler(CommandHandler("login", retrieveAccount))
app.add_handler(CommandHandler("logout", logout))
app.add_handler(conv_handler)
app.run_polling()