FROM python:3.14-slim

RUN apt-get update && apt-get install -y --no-install-recommends socat \
    && rm -rf /var/lib/apt/lists/*

COPY server.py /app/server.py
COPY flag.txt /app/flag.txt

WORKDIR /app

EXPOSE 1337
# useless comment
CMD ["socat", "TCP-LISTEN:1337,reuseaddr,fork", "EXEC:python3 -u /app/server.py"]
