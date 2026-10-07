import os
import socket
import threading
import time

DEFENSE_PASSCODE = os.environ.get("DEFENSE_PASSCODE", "")
PORT = int(os.environ.get("DEFENSE_PORT", 9000))
REENABLE_SECONDS = 300


class DefenseState:
    def __init__(self):
        self._lock = threading.Lock()
        self._disabled_by = None
        self._disabled_at = 0.0

    def disable(self, team):
        with self._lock:
            self._disabled_by = team
            self._disabled_at = time.monotonic()

    def snapshot(self):
        with self._lock:
            if self._disabled_by is None:
                return False, None, 0
            elapsed = time.monotonic() - self._disabled_at
            if elapsed >= REENABLE_SECONDS:
                return False, None, 0
            return True, self._disabled_by, int(REENABLE_SECONDS - elapsed)


state = DefenseState()


def handle_client(conn: socket.socket):
    try:
        data = conn.recv(1024).decode().strip()
        print(data)
        parts = data.split(" ", 2)
        if len(parts) == 3 and parts[0] == "DISABLE_SYSTEM" and parts[2] == DEFENSE_PASSCODE:
            team = parts[1]
            state.disable(team)
            print(f"Defense disabled by team: {team}")
            conn.sendall(b"DEFENSE DISABLED\n")
        elif parts and parts[0] == "DISABLE_SYSTEM":
            conn.sendall(b"INVALID PASSCODE\n")
        else:
            conn.sendall(b"UNKNOWN COMMAND\n")
    except Exception as e:
        print(f"Failed to handle client: {e}")
    finally:
        conn.close()


def _serve():
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(("0.0.0.0", PORT))
    srv.listen(4)
    print(f"Listening on :{PORT}")
    while True:
        conn, _ = srv.accept()
        threading.Thread(target=handle_client, args=(conn,), daemon=True).start()


def start():
    threading.Thread(target=_serve, daemon=True).start()
