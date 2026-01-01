FROM python:3.11-slim

WORKDIR /app

# Copia i file necessari
COPY requirements.txt .
COPY bot_config.py .
COPY Functions/endpoint.py .
COPY Functions/help.py .
COPY Functions/start.py .
COPY Functions/login.py .
COPY Functions/logo_tele.jpg .7
COPY Functions/notifications.py .
COPY Functions/ParticipiumLogo.webp .
COPY Functions/start.py .

# Installa le dipendenze
RUN pip3 install --no-cache-dir -r requirements.txt

# Avvia il bot
CMD ["python3", "bot_config.py"]