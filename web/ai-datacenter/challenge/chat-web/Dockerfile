FROM --platform=linux/amd64 python:3.11-slim-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN useradd --create-home --uid 1000 appuser && chown appuser:appuser /app
RUN mkdir /state && chown appuser:appuser /state

COPY --chown=appuser:appuser gemma-3-270m-it-Q8_0.gguf ./
COPY --chown=appuser:appuser app.py ./
COPY --chown=appuser:appuser templates ./templates

USER appuser

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "1", "--threads", "4", "--worker-class", "gthread", "--timeout", "180", "app:app"]
