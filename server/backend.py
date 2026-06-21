"""
backend.py — Flask backend for the Mundial app.

- Proxies API-Football (hides API key, caches responses)
- Google Sign-In authentication
- Admin page with live WebSocket updates on login/logout
- User login page

Usage:
    # Against real API:
    export API_FOOTBALL_KEY="your-key"
    python3 server/backend.py

    # Against local mock server:
    export API_FOOTBALL_KEY="mock"
    export API_FOOTBALL_URL="http://localhost:5003"
    python3 server/backend.py

Endpoints:
    GET  /api/live                → live WC fixtures
    GET  /api/lineups/<fixture_id> → lineups for a fixture
    POST /api/auth/google         → verify Google Sign-In token, return user info
    GET  /api/auth/me             → current user (from session)
    POST /api/auth/logout         → clear session
    GET  /login                   → user login page
    GET  /admin                   → admin page (live WebSocket updates)
    GET  /api/admin/users         → list all known users (admin only)

WebSocket events (admin):
    server → client: 'user_login'  {user}
    server → client: 'user_logout' {user}
"""

import os, time, sys, json, uuid, re
from pathlib import Path
from flask import Flask, jsonify, request, session, send_file
from flask_socketio import SocketIO

API_KEY = os.environ.get("API_FOOTBALL_KEY", "")
if not API_KEY:
    print("Set API_FOOTBALL_KEY environment variable first.")
    sys.exit(1)

API_BASE = os.environ.get("API_FOOTBALL_URL", "https://v3.football.api-sports.io")
GOOGLE_CLIENT_ID = "657438044008-qddq7m5mgk59k8qnhjpd6dalndqqb50e.apps.googleusercontent.com"
ADMIN_EMAILS = {"christophe.t60@gmail.com"}

import requests as req

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET", os.urandom(32))
socketio = SocketIO(app, cors_allowed_origins="*")

SERVER_DIR = Path(__file__).parent
USERS_FILE = SERVER_DIR / "users.json"
ONLINE_SESSIONS = {}  # session_id → {email, user, device, time}

def _parse_device(ua):
    ua = ua or ""
    browser = "Unknown"
    if "Edg/" in ua: browser = "Edge"
    elif "Chrome/" in ua: browser = "Chrome"
    elif "Safari/" in ua and "Chrome" not in ua: browser = "Safari"
    elif "Firefox/" in ua: browser = "Firefox"
    os_name = "Unknown"
    if "Macintosh" in ua: os_name = "macOS"
    elif "Windows" in ua: os_name = "Windows"
    elif "iPhone" in ua: os_name = "iPhone"
    elif "iPad" in ua: os_name = "iPad"
    elif "Android" in ua: os_name = "Android"
    elif "Linux" in ua: os_name = "Linux"
    return f"{browser} / {os_name}"

def _load_users():
    if USERS_FILE.exists():
        return json.loads(USERS_FILE.read_text())
    return {}

def _save_users(users):
    USERS_FILE.write_text(json.dumps(users, indent=2, ensure_ascii=False))

# ── API-Football proxy ───────────────────────────────────────────────────────

CACHE = {}
CACHE_TTL = 60

def cached_get(path, params):
    url = f"{API_BASE}{path}"
    key = f"{url}?{params}"
    now = time.time()
    if key in CACHE and now - CACHE[key]["t"] < CACHE_TTL:
        return CACHE[key]["data"]
    r = req.get(url, headers={"x-apisports-key": API_KEY}, params=params, timeout=10)
    r.raise_for_status()
    data = r.json().get("response", [])
    CACHE[key] = {"data": data, "t": now}
    return data

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        origin = request.headers.get("Origin", "*")
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, ngrok-skip-browser-warning"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        return response

@app.after_request
def cors(response):
    origin = request.headers.get("Origin", "*")
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, ngrok-skip-browser-warning"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

@app.route("/api/live")
def live():
    fixtures = cached_get("/fixtures", {"live": "all"})
    wc = [f for f in fixtures if f["league"]["name"] == "World Cup"]
    return jsonify(wc)

@app.route("/api/lineups/<int:fixture_id>")
def lineups(fixture_id):
    data = cached_get("/fixtures/lineups", {"fixture": fixture_id})
    return jsonify(data)

# ── Auth ─────────────────────────────────────────────────────────────────────

@app.route("/api/auth/google", methods=["POST"])
def auth_google():
    token = request.json.get("credential")
    if not token:
        return jsonify({"error": "missing credential"}), 400

    r = req.get("https://oauth2.googleapis.com/tokeninfo", params={"id_token": token}, timeout=5)
    if r.status_code != 200:
        return jsonify({"error": "invalid token"}), 401

    info = r.json()
    if info.get("aud") != GOOGLE_CLIENT_ID:
        return jsonify({"error": "wrong audience"}), 401

    user = {
        "email": info["email"],
        "name": info.get("name", ""),
        "picture": info.get("picture", ""),
        "last_login": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    session["user"] = user

    users = _load_users()
    users[user["email"]] = user
    _save_users(users)

    sid = str(uuid.uuid4())[:8]
    device = _parse_device(request.headers.get("User-Agent"))
    ONLINE_SESSIONS[sid] = {
        "email": user["email"], "user": user, "device": device,
        "time": user["last_login"], "sid": sid,
    }
    socketio.emit("user_login", {**user, "device": device, "sid": sid})

    return jsonify({"user": user, "admin": user["email"] in ADMIN_EMAILS, "sid": sid})

@app.route("/api/auth/me")
def auth_me():
    user = session.get("user")
    if not user:
        return jsonify({"user": None}), 200
    return jsonify({"user": user, "admin": user["email"] in ADMIN_EMAILS})

@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    user = session.pop("user", None)
    data = request.json or {}
    sid = data.get("sid")
    email = data.get("email")
    if sid and sid in ONLINE_SESSIONS:
        entry = ONLINE_SESSIONS.pop(sid)
        user = entry["user"]
    elif email:
        for k, v in list(ONLINE_SESSIONS.items()):
            if v["email"] == email:
                ONLINE_SESSIONS.pop(k)
                user = v["user"]
                break
    if user:
        socketio.emit("user_logout", user)
    return jsonify({"ok": True})

# ── Pages ────────────────────────────────────────────────────────────────────

@app.route("/login")
def login_page():
    return send_file(SERVER_DIR / "login.html")

@app.route("/admin")
def admin_page():
    return send_file(SERVER_DIR / "admin.html")

@app.route("/api/admin/users")
def admin_users():
    user = session.get("user")
    if not user or user["email"] not in ADMIN_EMAILS:
        return jsonify({"error": "forbidden"}), 403
    return jsonify(_load_users())

@app.route("/api/admin/online")
def admin_online():
    user = session.get("user")
    if not user or user["email"] not in ADMIN_EMAILS:
        return jsonify({"error": "forbidden"}), 403
    return jsonify(list(ONLINE_SESSIONS.values()))

@app.route("/api/admin/kick", methods=["POST"])
def admin_kick():
    user = session.get("user")
    if not user or user["email"] not in ADMIN_EMAILS:
        return jsonify({"error": "forbidden"}), 403
    sid = request.json.get("sid")
    email = request.json.get("email")
    if sid and sid in ONLINE_SESSIONS:
        entry = ONLINE_SESSIONS.pop(sid)
        socketio.emit("user_kicked", {"email": entry["email"], "sid": sid})
    elif email:
        for k, v in list(ONLINE_SESSIONS.items()):
            if v["email"] == email:
                ONLINE_SESSIONS.pop(k)
        socketio.emit("user_kicked", {"email": email})
    else:
        return jsonify({"error": "missing sid or email"}), 400
    return jsonify({"ok": True})

if __name__ == "__main__":
    print(f"Proxy → {API_BASE}")
    socketio.run(app, host="0.0.0.0", port=5002, allow_unsafe_werkzeug=True)
