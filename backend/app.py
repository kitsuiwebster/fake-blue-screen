import hashlib
import io
import os
import secrets
import sqlite3
import threading
import time
import uuid
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from PIL import Image
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


@app.route("/api/delete", methods=["POST"])
def delete_upload():
    body = request.get_json(silent=True) or {}
    image_id = str(body.get("id", ""))[:64]

    if not image_id:
        return jsonify({"error": "Missing id"}), 400

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
