FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY src/ ./src/

EXPOSE 8000

CMD ["/app/.venv/bin/fastapi", "run", "src/chal.py", "--host", "0.0.0.0", "--port", "8000"]
