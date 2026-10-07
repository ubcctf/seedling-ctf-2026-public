FROM ubuntu:24.04

RUN apt-get update && \
    apt-get install -y --no-install-recommends socat && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY trees /app/trees
COPY flag.txt /app/flag.txt

RUN chmod +x /app/trees

EXPOSE 1337

CMD ["socat", "TCP-LISTEN:1337,reuseaddr,fork", "EXEC:/app/trees"]