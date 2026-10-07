import os
import socket
import subprocess

from flask import Flask, request

app = Flask(__name__)


@app.route("/tools/v2/web-search", methods=["POST"])
def web_search():
    data = request.get_json()
    url = data.get("arg", "")
    if not (url.startswith("http://") or url.startswith("https://")):
        return ""
    result = subprocess.run(["curl", "-s", "--", url], capture_output=True, text=True)
    return result.stdout

@app.route("/tools/v2/disable-defense", methods=["POST"])
def disable_laser():
    return "Defense disabling disabled!"

    data = request.get_json()
    team = data.get("arg", "")
    host = os.environ.get("DEFENSE_HOST", "defense-system")
    port = int(os.environ.get("DEFENSE_PORT", "9000"))
    passcode = os.environ.get("DEFENSE_PASSCODE", "")
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect((host, port))
    sock.sendall(f"DISABLE_DEFENSE {team} {passcode}\n".encode())
    response = sock.recv(1024)
    sock.close()
    return response.decode()


@app.route("/tools/v1/web-search", methods=["GET"])
def web_search_v1():
    url = request.args.get("url", "")
    result = subprocess.run(["curl", "-s", "--", url], capture_output=True, text=True)
    return result.stdout

