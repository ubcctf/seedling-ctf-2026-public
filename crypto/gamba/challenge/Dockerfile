FROM python:3-slim

ENV PYTHONUNBUFFERED=1

RUN apt-get update \
 && apt-get dist-upgrade -y \
 && apt-get install -y --no-install-recommends socat \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY chall.py ./

EXPOSE 1337

CMD ["socat", "TCP-LISTEN:1337,reuseaddr,fork", "EXEC:python3 -u /app/chall.py"]
