import io

from PIL import Image


def _make_test_image(fmt="PNG", size=(100, 100)):
    img = Image.new("RGB", size, color=(255, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    buf.seek(0)
    return buf


def test_upload_valid_image(client):
    img = _make_test_image()
    resp = client.post(
        "/api/uploads",
        data={"file": (img, "test.png")},
        content_type="multipart/form-data",
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert "id" in data
    assert "url" in data
    assert "delete_token" in data
    assert data["url"].endswith(".webp")


def test_upload_no_file(client):
    resp = client.post("/api/uploads")
    assert resp.status_code == 400
    assert "No file" in resp.get_json()["error"]


def test_upload_invalid_file(client):
    fake = io.BytesIO(b"not an image at all")
    resp = client.post(
        "/api/uploads",
        data={"file": (fake, "bad.png")},
        content_type="multipart/form-data",
    )
    assert resp.status_code == 400
    assert "Invalid" in resp.get_json()["error"]


def test_upload_jpeg(client):
    img = _make_test_image(fmt="JPEG")
    resp = client.post(
        "/api/uploads",
        data={"file": (img, "test.jpg")},
        content_type="multipart/form-data",
    )
    assert resp.status_code == 201
    assert resp.get_json()["url"].endswith(".webp")
