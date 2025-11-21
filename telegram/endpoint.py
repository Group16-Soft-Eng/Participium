from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ConversationHandler
import requests

SERVER_URL = "http://localhost:5000/api/v1"
sessions = {}

# Stati per la conversazione
WAITING_LOCATION = 1

async def start(update, context):
    await update.message.reply_text("Benvenuto! Usa /login utente password")

async def retrieveAccount(update, context):
    chat_id = update.effective_chat.id
    req_str = SERVER_URL + "/auth/telegram"
    username = update.effective_user.username
    print("Telegram username:", username)
    response = requests.post(req_str, json={"username": username})
    if response.status_code == 200:
        data = response.json()
        token = data
        sessions[chat_id] = token
        await update.message.reply_text("Login effettuato!")
    else:
        await update.message.reply_text("Errore nel login. Assicurati di aver registrato il tuo username Telegram.")
    
async def sendReport(update, context):
    chat_id = update.effective_chat.id
    token = sessions.get(chat_id)
    if not token:
        await update.message.reply_text("Devi prima effettuare il login con /login.")
        return ConversationHandler.END
    await update.message.reply_text("Invia la tua posizione.")
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
    token = sessions.get(chat_id)
    if not token:
        await update.message.reply_text("Devi prima effettuare il login con /login.")
        return
    req_str = SERVER_URL + "/users/me/info"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(req_str, headers=headers)
    if response.status_code == 200:
        data = response.json()
        await update.message.reply_text(f"Info utente: {data}")
    else:
        await update.message.reply_text("Errore nel recupero delle informazioni.")
        