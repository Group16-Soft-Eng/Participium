FROM python:3.11-slim

WORKDIR /app

# Copia i file necessari
COPY requirements.txt .
COPY bot_config.py .
COPY Functions/endpoint.py .
COPY Functions/start.py .
COPY Functions/login.py .
COPY Functions/logo_tele.jpg .
COPY Functions/ParticipiumLogo.webp .

# Installa le dipendenze
RUN pip3 install --no-cache-dir -r requirements.txt

# Avvia il bot
CMD ["python3", "bot_config.py"]