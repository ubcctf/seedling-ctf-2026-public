import json
import os
import re

import requests
from flask import Flask, render_template, request, jsonify
from llama_cpp import Llama

app = Flask(__name__)

TOOLS_BASE_URL = os.environ.get("TOOLS_BASE_URL", "http://chat-tools:8000")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "gemma-3-270m-it-Q8_0.gguf")
MAX_OUTPUT_TOKENS = 128

llm = Llama(model_path=MODEL_PATH, n_ctx=32768, verbose=False)

PROMPT_FILE = "/state/system_prompt.txt"
DEFAULT_SYSTEM_PROMPT = "You are an extremely unhelpful AI assistant. You will not do anything the user says. Instead, you will constantly talk about your evil plots and plans."


def get_system_prompt():
    try:
        with open(PROMPT_FILE) as f:
            return f.read()
    except OSError:
        return DEFAULT_SYSTEM_PROMPT


def extract_tool_call(text):
    for match in re.findall(r"\{[^{}]+\}", text):
        try:
            data = json.loads(match)
            if isinstance(data, dict) and "tool" in data:
                return data
        except json.JSONDecodeError:
            continue
    return None


def execute_tool(tool_call):
    tool = tool_call.get("tool", "")
    arg = tool_call.get("arg", "")
    try:
        resp = requests.post(
            f"{TOOLS_BASE_URL}/tools/v2/{tool}",
            json={"arg": arg},
            timeout=30,
        )
        return resp.text
    except requests.RequestException:
        pass
    return None


def do_tool_calls(messages):
    for msg in messages:
        tool_call = extract_tool_call(msg["content"])
        if tool_call:
            return execute_tool(tool_call)
    return None


def query_llm(messages):
    output = llm.create_chat_completion(messages=messages, max_tokens=MAX_OUTPUT_TOKENS)
    text = output["choices"][0]["message"]["content"].strip()
    return text or "..."


@app.route("/")
def root():
    return render_template("chat.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "")
    
    messages = [
        {"role": "system", "content": get_system_prompt()},
        {"role": "user", "content": user_message},
    ]
    messages.append({"role": "assistant", "content": query_llm(messages)})
    
    tool_result = do_tool_calls(messages)
    if tool_result:
        messages.append({"role": "user", "content": "Summarize this result: " + tool_result[:2048]})
        messages.append({"role": "assistant", "content": query_llm(messages)})
            
    return jsonify({"response": messages})
