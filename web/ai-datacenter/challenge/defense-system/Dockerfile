FROM --platform=linux/amd64 python:3.11-slim-bookworm

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN useradd --create-home --uid 1000 appuser && chown appuser:appuser /app
COPY --chown=appuser:appuser app.py command_server.py ./
COPY --chown=appuser:appuser templates ./templates

USER appuser

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "1", "--threads", "4", "--worker-class", "gthread", "--timeout", "180", "app:app"]
