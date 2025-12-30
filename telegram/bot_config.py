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
from Functions.notifications import *
from Functions.help import *
# Pattern constants (rinominati per non collidere con le funzioni)
BACK_PATTERN = r"^back_"
DONE_PHOTOS_PATTERN = r"^done_photos$"
CANCEL_REPORT_PATTERN = r"^cancel_report$"
START_REPORT_PATTERN = r"^start_report$"
BACK_MAIN_MENU = r"^back_main_menu$"
VIEW_ACTIVE_REPORTS_PATTERN = r"^view_reports$"
MANAGE_NOTIFICATIONS_PATTERN = r"^manage_notifications$"
FOLLOW_ALL_PERSONAL_REPORT = r"^follow_all_personal_reports$"
UNFOLLOW_ALL_PERSONAL_REPORT = r"^unfollow_all_personal_reports$"
FOLLOW_REPORT_BY_ID_PATTERN = r"^follow_report_by_id$"
UNFOLLOW_REPORT_BY_ID_PATTERN = r"^unfollow_report_by_id$"

HELP_MENU_PATTERN = r"^help_menu$"
BASIC_COMMAND_PATTERN = r"^basic_commands$"
FAQ_PATTERN = r"^faq$"
CONTACT_SUPPORT_PATTERN = r"^contact_support$"

conv_handler = ConversationHandler(
    entry_points=[
        CommandHandler('report', sendReport),
        CallbackQueryHandler(handle_start_report, pattern=START_REPORT_PATTERN),
        CallbackQueryHandler(handle_view_reports, pattern=VIEW_ACTIVE_REPORTS_PATTERN),
        CallbackQueryHandler(handle_manage_notifications, pattern=MANAGE_NOTIFICATIONS_PATTERN),
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

id_notification_handler = ConversationHandler(
    entry_points=[
        CallbackQueryHandler(ask_for_id_to_follow, pattern=r"^follow_report_by_id$"),
        CallbackQueryHandler(ask_for_id_to_unfollow, pattern=r"^unfollow_report_by_id$"),
    ],
    states={
        WAITING_ID_TO_FOLLOW: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_id_to_follow)],
        WAITING_ID_TO_UNFOLLOW: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_id_to_unfollow)],
    },
    fallbacks=[
        # Questo bottone "Back" ti riporterà al menu delle notifiche
        CallbackQueryHandler(handle_manage_notifications, pattern=r"^back_to_notification_menu$")
    ],
    map_to_parent={
        # Se la conversazione finisce, non torna a nessun'altra conversazione
        ConversationHandler.END: ConversationHandler.END,
    }
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
app.add_handler(CallbackQueryHandler(handle_follow_all_personal_reports, pattern=FOLLOW_ALL_PERSONAL_REPORT))
app.add_handler(CallbackQueryHandler(handle_unfollow_report, pattern=r"^stop_follow_\d+$"))
app.add_handler(CallbackQueryHandler(handle_unfollow_all_personal_reports, pattern=UNFOLLOW_ALL_PERSONAL_REPORT))
app.add_handler(CallbackQueryHandler(handle_back_to_main_menu, pattern=BACK_MAIN_MENU))

# Handlers per il menu di help
app.add_handler(CommandHandler("help", help_command))
app.add_handler(CallbackQueryHandler(handle_help_menu, pattern=HELP_MENU_PATTERN)) # <-- AGGIUNGI QUESTA RIGA
app.add_handler(CallbackQueryHandler(handle_basic_commands, pattern=BASIC_COMMAND_PATTERN))
app.add_handler(CallbackQueryHandler(handle_faq, pattern=FAQ_PATTERN))
app.add_handler(CallbackQueryHandler(handle_contact_support, pattern=CONTACT_SUPPORT_PATTERN))  


app.add_handler(conv_handler)
app.add_handler(id_notification_handler)
app.run_polling(drop_pending_updates=True)