from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    filters,
    ConversationHandler,
    CallbackQueryHandler,
    ContextTypes,
)

from Functions.login import *
from Functions.start import *
from Functions.endpoint import *

# Pattern constants (rinominati per non collidere con le funzioni)
BACK_PATTERN = r"^back_"
DONE_PHOTOS_PATTERN = r"^done_photos$"
CANCEL_REPORT_PATTERN = r"^cancel_report$"
START_REPORT_PATTERN = r"^start_report$"
VIEW_ACTIVE_REPORTS_PATTERN = r"^view_reports$"

conv_handler = ConversationHandler(
    entry_points=[
        CommandHandler('report', sendReport),
        CallbackQueryHandler(handle_start_report, pattern=START_REPORT_PATTERN),
        CallbackQueryHandler(handle_view_reports, pattern=VIEW_ACTIVE_REPORTS_PATTERN),
    ],
    states={
        WAITING_TITLE: [
            MessageHandler(filters.TEXT & ~filters.COMMAND, receiveTitle),
            CallbackQueryHandler(handle_back, pattern=BACK_PATTERN),
        ],
        WAITING_DESCRIPTION: [
            MessageHandler(filters.TEXT & ~filters.COMMAND, receiveDescription),
            CallbackQueryHandler(handle_back, pattern=BACK_PATTERN),
        ],
        WAITING_CATEGORY: [
            CallbackQueryHandler(receiveCategory, pattern=r"^category_\d+$"),
            CallbackQueryHandler(handle_back, pattern=BACK_PATTERN),
        ],
        WAITING_PHOTO: [
            MessageHandler(filters.PHOTO, receivePhoto),
            CommandHandler('done', done_photos),  # callback è la funzione done_photos
            CommandHandler('skip', skip_photo),
            CallbackQueryHandler(done_photos, pattern=DONE_PHOTOS_PATTERN),
            CallbackQueryHandler(handle_back, pattern=BACK_PATTERN),
        ],
        WAITING_LOCATION: [
            MessageHandler(filters.LOCATION, receiveLocation),
            CallbackQueryHandler(handle_back, pattern=BACK_PATTERN),
        ],
        WAITING_ANONYMOUS: [
            CallbackQueryHandler(receiveAnonymous, pattern=r"^anonymous_(yes|no)$"),
            CallbackQueryHandler(handle_back, pattern=BACK_PATTERN),
        ],
    },
    fallbacks=[CommandHandler('cancel', cancel), CallbackQueryHandler(cancel, pattern=CANCEL_REPORT_PATTERN)],
    per_message=False
)

async def post_init(application: Application) -> None:
    await load_categories()

app = Application.builder().token("7796981555:AAFAU2xf7n6f-BihJhw5bjXo3H--_fzgwGg").post_init(post_init).build()

async def on_error(update, context):
    print(f"Error: {context.error}")

app.add_error_handler(on_error)
app.add_handler(CommandHandler("start", start))
app.add_handler(CallbackQueryHandler(handle_login, pattern=r"^login$"))
app.add_handler(CommandHandler("login", retrieveAccount))
app.add_handler(CommandHandler("logout", logout))

# Aggiungi qui i nuovi handler per follow/unfollow
app.add_handler(CallbackQueryHandler(handle_follow_report, pattern=r"^start_follow_\d+$"))
app.add_handler(CallbackQueryHandler(handle_unfollow_report, pattern=r"^stop_follow_\d+$"))

app.add_handler(conv_handler)
app.run_polling(drop_pending_updates=True)