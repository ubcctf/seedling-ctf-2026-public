from flask import Flask, jsonify, render_template

import command_server

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("state.html")


@app.route("/status")
def status():
    disabled, team, seconds_left = command_server.state.snapshot()
    return jsonify(disabled=disabled, team=team, seconds_left=seconds_left)


command_server.start()
