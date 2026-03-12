def test_404(client):
    resp = client.get("/api/nonexistent")
    assert resp.status_code == 404
    assert resp.get_json()["error"] == "Not found"


def test_405(client):
    resp = client.delete("/api/health")
    assert resp.status_code == 405
    assert resp.get_json()["error"] == "Method not allowed"


def test_media_nonexistent(client):
    resp = client.get("/media/nonexistent.webp")
    assert resp.status_code == 404
