FROM python:3.11-slim

WORKDIR /app

# Install minimal system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python deps
RUN pip install --no-cache-dir -r requirements.txt

# Copy app files (models included)
COPY app.py inference.py ./
COPY routes ./routes
COPY models ./models

# Environment
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    MAX_MODEL_CACHE=1 \
    MODEL_NAME=YoloV11n

EXPOSE 10000

# Use PORT from Render (fallback 10000)
CMD gunicorn --bind 0.0.0.0:${PORT:-10000} --workers 1 --threads 2 --timeout 300 --max-requests 100 --max-requests-jitter 10 app:app
