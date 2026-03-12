import io

from PIL import Image


def _upload_image(client):
    img = Image.new("RGB", (50, 50), color=(0, 255, 0))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return client.post(
        "/api/uploads",
        data={"file": (buf, "img.png")},
        content_type="multipart/form-data",
    )


def test_gallery_empty(client):
    resp = client.get("/api/gallery")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert data["page"] == 1


def test_gallery_with_uploads(client):
    _upload_image(client)
    _upload_image(client)
    resp = client.get("/api/gallery")
    data = resp.get_json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2


def test_gallery_pagination(client):
    resp = client.get("/api/gallery?page=1&limit=1")
    data = resp.get_json()
    assert data["limit"] == 1
    assert len(data["items"]) <= 1


def test_gallery_invalid_params(client):
    resp = client.get("/api/gallery?page=abc")
    assert resp.status_code == 400
