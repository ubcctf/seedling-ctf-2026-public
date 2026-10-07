FROM --platform=linux/amd64 python:3.11-slim-bookworm

WORKDIR /tools

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

ARG FLAG1=maple{placeholder_flag_1}
RUN printf '%s\n' "$FLAG1" > /flag.txt

RUN useradd --create-home --uid 1000 toolsuser && chown toolsuser:toolsuser /tools
COPY --chown=toolsuser:toolsuser tools.py ./

USER toolsuser

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "1", "--threads", "4", "--worker-class", "gthread", "--timeout", "180", "tools:app"]
