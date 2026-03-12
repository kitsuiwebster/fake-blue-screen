def test_get_captcha(client):
    resp = client.get("/api/captcha")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "challenge_id" in data
    assert "image" in data
    assert "math_question" in data
    # Image should be base64 PNG
    assert len(data["image"]) > 100


def test_delete_missing_fields(client):
    resp = client.post("/api/delete", json={})
    assert resp.status_code == 400
    assert "Missing" in resp.get_json()["error"]


def test_delete_invalid_captcha(client):
    resp = client.post(
        "/api/delete",
        json={
            "id": "fake-id",
            "challenge_id": "fake-challenge",
            "captcha_answer": "WRONG",
            "math_answer": "0",
        },
    )
    assert resp.status_code == 400
    assert "Invalid" in resp.get_json()["error"]


def test_delete_full_flow(client):
    import io

    from PIL import Image

    # 1. Upload an image
    img = Image.new("RGB", (50, 50), color=(0, 0, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    upload_resp = client.post(
        "/api/uploads",
        data={"file": (buf, "del.png")},
        content_type="multipart/form-data",
    )
    image_id = upload_resp.get_json()["id"]

    # 2. Get captcha
    captcha_resp = client.get("/api/captcha")
    captcha_data = captcha_resp.get_json()

    # 3. Solve captcha by reading from DB directly
    from app import get_db

    with get_db() as conn:
        row = conn.execute(
            "SELECT code, math_answer FROM captchas WHERE id = ?",
            (captcha_data["challenge_id"],),
        ).fetchone()

    # 4. Delete with correct answers
    delete_resp = client.post(
        "/api/delete",
        json={
            "id": image_id,
            "challenge_id": captcha_data["challenge_id"],
            "captcha_answer": row["code"],
            "math_answer": str(row["math_answer"]),
        },
    )
    assert delete_resp.status_code == 200
    assert delete_resp.get_json()["success"] is True

    # 5. Verify it's gone from gallery
    gallery_resp = client.get("/api/gallery")
    ids = [item["id"] for item in gallery_resp.get_json()["items"]]
    assert image_id not in ids
