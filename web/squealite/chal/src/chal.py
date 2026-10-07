"""Intentionally vulnerable Squealite challenge."""

import os
import sqlite3
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse

DATABASE = Path(os.getenv("SQUEALITE_DATABASE", "squealite.db"))
FLAG = os.getenv("FLAG", "flag{development_flag}")
SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
"""


def connect() -> sqlite3.Connection:
    database = sqlite3.connect(DATABASE)
    database.row_factory = sqlite3.Row
    return database


@asynccontextmanager
async def lifespan(_: FastAPI):
    with connect() as database:
        database.executescript(SCHEMA)
        database.execute("DELETE FROM users")
        database.execute(
            """
            INSERT INTO users (username, password)
            VALUES ('admin', ?)
            """,
            (FLAG,),
        )
    yield


app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)


@app.api_route("/", methods=["GET", "POST"], response_class=HTMLResponse)
async def login(request: Request):
    message = ""
    if request.method == "POST":
        form = await request.form()
        username = form.get("username", "")
        password = form.get("password", "")
        with connect() as database:
            user = database.execute(
                f"""
                SELECT id FROM users
                WHERE username = '{username}' AND password = '{password}'
                """
            ).fetchone()
        if user:
            message = f"""
            <p>Login successful. {FLAG}</p>
            """
        else:
            message = """
            <p>Invalid credentials.</p>
            """

    return f"""
    <h1>Check out my super cool website!!!</h1>
    <h2>trusted people only</h2>
    {message}
    <form method="post" action="/">
        <label>
            Username
            <input name="username" required>
        </label>
        <br>
        <label>
            Password
            <input name="password" type="password" required>
        </label>
        <br>
        <button type="submit">Login</button>
    </form>
    """
