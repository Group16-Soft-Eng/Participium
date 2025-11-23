from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ConversationHandler
from telegram import BotCommand, BotCommandScopeChat
import requests

SERVER_URL = "http://localhost:5000/api/v1"
sessions = {}
user_states = {}  # Track user progress: 'initial', 'started', 'logged_in'

# Stati per la conversazione
WAITING_LOCATION = 1
async def start(update, context):
    chat_id = update.effective_chat.id
    user_states[chat_id] = 'started'
    
    # Send welcome message with image
    welcome_text = "🎉 Benvenuto in Participium!\n\nGrazie per aver scelto la nostra piattaforma. Ora puoi effettuare il login con /login"
    
    # Send image (you can replace with your actual image URL or file)
    try:
        # Example: send a photo from URL or local file
        # await update.message.reply_photo(photo="URL_OR_FILE_ID", caption=welcome_text)
        await update.message.reply_text(welcome_text)
    except:
        await update.message.reply_text(welcome_text)
    
    # Update commands to show login
    await context.bot.set_my_commands([
        BotCommand("start", "Avvia il bot"),
        BotCommand("login", "Effettua il login"),
    ], scope=BotCommandScopeChat(chat_id=chat_id))

async def retrieveAccount(update, context):
    chat_id = update.effective_chat.id
    
    # Check if user has started
    if user_states.get(chat_id) != 'started' and user_states.get(chat_id) != 'logged_in':
        await update.message.reply_text("Per favore, usa prima /start")
        return
    
    req_str = SERVER_URL + "/auth/telegram"
    username = update.effective_user.username
    print("Telegram username:", username)
    response = requests.post(req_str, json={"username": username})
    if response.status_code == 200:
        data = response.json()
        token = data
        sessions[chat_id] = token
        user_states[chat_id] = 'logged_in'
        
        # Update commands to show report and info
        await context.bot.set_my_commands([
            BotCommand("report", "Invia un report"),
            BotCommand("info", "Recupera le informazioni dell'utente"),
            BotCommand("logout", "Effettua il logout"),
        ], scope=BotCommandScopeChat(chat_id=chat_id))
        
        await update.message.reply_text("✅ Login effettuato con successo!\n\nOra puoi usare /report per inviare una segnalazione o /info per vedere il tuo profilo.")
    else:
        await update.message.reply_text("❌ Errore nel login. Assicurati di aver registrato il tuo username Telegram nel sistema.")
    
async def sendReport(update, context):
    chat_id = update.effective_chat.id
    
    # Check if user is logged in
    if user_states.get(chat_id) != 'logged_in':
        await update.message.reply_text("⚠️ Devi prima effettuare il login con /login.")
        return ConversationHandler.END
    
    token = sessions.get(chat_id)
    if not token:
        await update.message.reply_text("⚠️ Devi prima effettuare il login con /login.")
        return ConversationHandler.END
    
    await update.message.reply_text("📍 Invia la tua posizione per creare una segnalazione.")
    return WAITING_LOCATION

async def receiveLocation(update, context):
    latitude = update.message.location.latitude
    longitude = update.message.location.longitude
    print("Latitude:", latitude, "Longitude:", longitude)
    await update.message.reply_text(f"Posizione ricevuta: {latitude}, {longitude}")
    # Qui puoi inviare i dati al server
    return ConversationHandler.END

async def cancel(update, context):
    await update.message.reply_text("Operazione annullata.")
    return ConversationHandler.END

async def info(update, context):
    chat_id = update.effective_chat.id
    
    # Check if user is logged in
    if user_states.get(chat_id) != 'logged_in':
        await update.message.reply_text("⚠️ Devi prima effettuare il login con /login.")
        return
    
    token = sessions.get(chat_id)
    if not token:
        await update.message.reply_text("⚠️ Devi prima effettuare il login con /login.")
        return
    
    req_str = SERVER_URL + "/users/me/info"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(req_str, headers=headers)
    if response.status_code == 200:
        data = response.json()
        await update.message.reply_text(f"👤 Info utente:\n\n{data}")
    else:
        await update.message.reply_text("❌ Errore nel recupero delle informazioni.")

aync def logout(update, context):
    chat_id = update.effective_chat.id
    
    # Check if user is logged in
    if user_states.get(chat_id) != 'logged_in':
        await update.message.reply_text("⚠️ Non sei loggato.")
        return
    
    # Remove session and update state
    sessions.pop(chat_id, None)
    user_states[chat_id] = 'started'
    
    # Update commands to show login
    await context.bot.set_my_commands([
        BotCommand("start", "Avvia il bot"),
        BotCommand("login", "Effettua il login"),
    ], scope=BotCommandScopeChat(chat_id=chat_id))
    
    await update.message.reply_text("✅ Logout effettuato con successo.")