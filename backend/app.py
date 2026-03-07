import base64
import hashlib
import io
import math
import os
import random
import secrets
import shutil
import sqlite3
import string
import threading
import time
import uuid
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from PIL import Image, ImageDraw, ImageFont
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

app = Flask(__name__)
CORS(app, origins=["http://localhost:4200", "https://screenfake.xyz", "https://www.screenfake.xyz"])

limiter = Limiter(
    get_remote_address,
    app=app,
    storage_uri="memory://",
)

DATA_DIR = Path(os.environ.get("DATA_DIR", "/data"))
MEDIA_DIR = DATA_DIR / "media"
DB_PATH = DATA_DIR / "app.db"

MAX_BYTES = 10 * 1024 * 1024          # 10 MB
RETENTION_SECONDS = 3 * 365 * 24 * 3600  # 3 years

MEDIA_DIR.mkdir(parents=True, exist_ok=True)

HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
)
HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
)


@app.before_request
def _start_request_timer() -> None:
    request._start_time = time.perf_counter()


@app.after_request
def _observe_request(response):
    endpoint = request.path
    method = request.method
    status = str(response.status_code)

    HTTP_REQUESTS_TOTAL.labels(method=method, endpoint=endpoint, status=status).inc()
    started = getattr(request, "_start_time", None)
    if started is not None:
        HTTP_REQUEST_DURATION_SECONDS.labels(method=method, endpoint=endpoint).observe(
            time.perf_counter() - started
        )

    return response


# ── Database ──────────────────────────────────────────────────────────────────

def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS uploads (
                id                TEXT    PRIMARY KEY,
                created_at        INTEGER NOT NULL,
                expires_at        INTEGER NOT NULL,
                status            TEXT    NOT NULL DEFAULT 'active',
                path              TEXT    NOT NULL,
                bytes             INTEGER NOT NULL,
                delete_token_hash TEXT    NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS captchas (
                id          TEXT    PRIMARY KEY,
                code        TEXT    NOT NULL,
                math_answer INTEGER NOT NULL,
                created_at  INTEGER NOT NULL
            )
            """
        )
        conn.commit()


# ── Captcha generation ────────────────────────────────────────────────────

CAPTCHA_TTL = 120  # 2 minutes

def _generate_captcha_image(code: str) -> str:
    """Generate a distorted captcha image, return base64 PNG."""
    width, height = 280, 80
    img = Image.new("RGB", (width, height), (245, 245, 250))
    draw = ImageDraw.Draw(img)

    # Try to use a monospace font, fall back to default
    font_size = 36
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", font_size)
    except (OSError, IOError):
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf", font_size)
        except (OSError, IOError):
            font = ImageFont.load_default()

    # Draw noise lines
    for _ in range(8):
        x1, y1 = random.randint(0, width), random.randint(0, height)
        x2, y2 = random.randint(0, width), random.randint(0, height)
        gray = random.randint(160, 210)
        draw.line([(x1, y1), (x2, y2)], fill=(gray, gray, gray), width=2)

    # Draw noise dots
    for _ in range(200):
        x, y = random.randint(0, width - 1), random.randint(0, height - 1)
        gray = random.randint(140, 200)
        draw.point((x, y), fill=(gray, gray, gray))

    # Draw each character with random offset and rotation
    char_width = width // (len(code) + 2)
    for i, char in enumerate(code):
        char_img = Image.new("RGBA", (50, 60), (0, 0, 0, 0))
        char_draw = ImageDraw.Draw(char_img)
        r = random.randint(20, 80)
        g = random.randint(20, 80)
        b = random.randint(20, 80)
        char_draw.text((5, 5), char, font=font, fill=(r, g, b, 255))
        angle = random.randint(-25, 25)
        char_img = char_img.rotate(angle, expand=True, resample=Image.BICUBIC)
        x = char_width * (i + 1) - char_img.width // 2
        y = (height - char_img.height) // 2 + random.randint(-8, 8)
        img.paste(char_img, (x, y), char_img)

    # Apply wave distortion
    pixels = img.load()
    img2 = img.copy()
    pixels2 = img2.load()
    amp = random.uniform(3, 6)
    period = random.uniform(0.05, 0.1)
    for y in range(height):
        shift = int(amp * math.sin(period * y))
        for x in range(width):
            nx = (x + shift) % width
            pixels2[x, y] = pixels[nx, y]

    buf = io.BytesIO()
    img2.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def _generate_captcha_code(length: int = 8) -> str:
    chars = string.ascii_uppercase + string.digits
    # Remove ambiguous characters
    chars = chars.replace("O", "").replace("0", "").replace("I", "").replace("1", "").replace("L", "")
    return "".join(random.choices(chars, k=length))


def _generate_math_problem() -> tuple[str, int]:
    a = random.randint(10, 99)
    b = random.randint(10, 99)
    op = random.choice(["+", "-", "*"])
    if op == "+":
        return f"{a} + {b}", a + b
    elif op == "-":
        a, b = max(a, b), min(a, b)
        return f"{a} - {b}", a - b
    else:
        a = random.randint(2, 12)
        b = random.randint(2, 12)
        return f"{a} x {b}", a * b


def _cleanup_expired_captchas() -> None:
    cutoff = int(time.time()) - CAPTCHA_TTL
    with get_db() as conn:
        conn.execute("DELETE FROM captchas WHERE created_at < ?", (cutoff,))
        conn.commit()


# ── Cleanup job ───────────────────────────────────────────────────────────────

def _cleanup_once() -> None:
    """Delete expired uploads from disk and mark them deleted in DB."""
    now = int(time.time())
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, path FROM uploads WHERE status = 'active' AND expires_at <= ?",
            (now,),
        ).fetchall()
        for row in rows:
            try:
                Path(row["path"]).unlink(missing_ok=True)
            except Exception:
                pass
            conn.execute(
                "UPDATE uploads SET status = 'deleted' WHERE id = ?",
                (row["id"],),
            )
        conn.commit()


def _schedule_cleanup() -> None:
    _cleanup_once()
    t = threading.Timer(86400, _schedule_cleanup)
    t.daemon = True
    t.start()


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/metrics")
def metrics():
    return generate_latest(), 200, {"Content-Type": CONTENT_TYPE_LATEST}


@app.route("/api/uploads", methods=["POST"])
@limiter.limit("3 per minute")
def upload():
    f = request.files.get("file")
    if not f:
        return jsonify({"error": "No file provided"}), 400

    data = f.read()
    if len(data) > MAX_BYTES:
        return jsonify({"error": "File too large (max 10 MB)"}), 413

    # Validate image by opening it (rejects non-images and polyglots)
    try:
        img = Image.open(io.BytesIO(data))
        img.verify()
        img = Image.open(io.BytesIO(data))
        rgb = img.convert("RGB")
    except Exception:
        return jsonify({"error": "Invalid or unsupported image"}), 400

    # Re-encode to WebP — strips EXIF and normalises the file
    output = io.BytesIO()
    rgb.save(output, format="WEBP", quality=85)
    webp_data = output.getvalue()

    # AC-UP-11 — Reject upload if disk usage > 90%
    disk = shutil.disk_usage(MEDIA_DIR)
    if disk.used / disk.total > 0.90:
        return jsonify({"error": "Service temporarily unavailable"}), 507

    image_id = str(uuid.uuid4())
    delete_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(delete_token.encode()).hexdigest()

    file_path = MEDIA_DIR / f"{image_id}.webp"
    file_path.write_bytes(webp_data)

    now = int(time.time())
    with get_db() as conn:
        conn.execute(
            "INSERT INTO uploads VALUES (?, ?, ?, 'active', ?, ?, ?)",
            (image_id, now, now + RETENTION_SECONDS, str(file_path), len(webp_data), token_hash),
        )
        conn.commit()

    return jsonify(
        {"id": image_id, "url": f"/media/{image_id}.webp", "delete_token": delete_token}
    ), 201


@app.route("/api/gallery")
def gallery():
    try:
        page = max(1, int(request.args.get("page", 1)))
        limit = min(100, max(1, int(request.args.get("limit", 24))))
    except ValueError:
        return jsonify({"error": "Invalid pagination parameters"}), 400

    offset = (page - 1) * limit
    with get_db() as conn:
        total: int = conn.execute(
            "SELECT COUNT(*) FROM uploads WHERE status = 'active'"
        ).fetchone()[0]
        rows = conn.execute(
            "SELECT id, created_at FROM uploads WHERE status = 'active'"
            " ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()

    return jsonify(
        {
            "items": [
                {
                    "id": row["id"],
                    "url": f"/media/{row['id']}.webp",
                    "created_at": row["created_at"],
                }
                for row in rows
            ],
            "page": page,
            "limit": limit,
            "total": total,
        }
    )


@app.route("/api/captcha", methods=["GET"])
def get_captcha():
    _cleanup_expired_captchas()

    code = _generate_captcha_code()
    math_question, math_answer = _generate_math_problem()
    image_b64 = _generate_captcha_image(code)

    challenge_id = str(uuid.uuid4())
    now = int(time.time())

    with get_db() as conn:
        conn.execute(
            "INSERT INTO captchas VALUES (?, ?, ?, ?)",
            (challenge_id, code, math_answer, now),
        )
        conn.commit()

    return jsonify({
        "challenge_id": challenge_id,
        "image": image_b64,
        "math_question": math_question,
    })


@app.route("/api/delete", methods=["POST"])
def delete_upload():
    body = request.get_json(silent=True) or {}
    image_id = str(body.get("id", ""))[:64]
    challenge_id = str(body.get("challenge_id", ""))[:64]
    captcha_answer = str(body.get("captcha_answer", "")).strip().upper()[:16]
    math_answer_str = str(body.get("math_answer", "")).strip()[:16]

    if not image_id or not challenge_id or not captcha_answer or not math_answer_str:
        return jsonify({"error": "Missing required fields"}), 400

    # Validate captcha
    with get_db() as conn:
        captcha = conn.execute(
            "SELECT code, math_answer, created_at FROM captchas WHERE id = ?",
            (challenge_id,),
        ).fetchone()

        if not captcha:
            return jsonify({"error": "Invalid or expired captcha"}), 400

        # Check expiration
        if int(time.time()) - captcha["created_at"] > CAPTCHA_TTL:
            conn.execute("DELETE FROM captchas WHERE id = ?", (challenge_id,))
            conn.commit()
            return jsonify({"error": "Captcha expired, please try again"}), 400

        # Check code
        if captcha_answer != captcha["code"]:
            conn.execute("DELETE FROM captchas WHERE id = ?", (challenge_id,))
            conn.commit()
            return jsonify({"error": "Wrong captcha code"}), 400

        # Check math
        try:
            if int(math_answer_str) != captcha["math_answer"]:
                conn.execute("DELETE FROM captchas WHERE id = ?", (challenge_id,))
                conn.commit()
                return jsonify({"error": "Wrong math answer"}), 400
        except ValueError:
            return jsonify({"error": "Invalid math answer"}), 400

        # Consume captcha (one-time use)
        conn.execute("DELETE FROM captchas WHERE id = ?", (challenge_id,))
        conn.commit()

    # Delete the image
    with get_db() as conn:
        row = conn.execute(
            "SELECT path FROM uploads WHERE id = ? AND status = 'active'",
            (image_id,),
        ).fetchone()
        if not row:
            return jsonify({"error": "Not found"}), 404

        try:
            Path(row["path"]).unlink(missing_ok=True)
        except Exception:
            pass

        conn.execute(
            "UPDATE uploads SET status = 'deleted' WHERE id = ?", (image_id,)
        )
        conn.commit()

    return jsonify({"success": True})


@app.route("/media/<path:filename>")
def serve_media(filename):
    return send_from_directory(str(MEDIA_DIR), filename)


# ── Error handlers ────────────────────────────────────────────────────────

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method not allowed"}), 405


@app.errorhandler(413)
def payload_too_large(e):
    return jsonify({"error": "File too large"}), 413


@app.errorhandler(429)
def rate_limit_exceeded(e):
    return jsonify({"error": "Too many requests, please try again later"}), 429


@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error"}), 500


# ── Bootstrap ─────────────────────────────────────────────────────────────────

init_db()
_schedule_cleanup()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
