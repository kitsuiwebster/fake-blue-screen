import os
import tempfile

import pytest

# Set DATA_DIR to a temp directory BEFORE importing app
_tmpdir = tempfile.mkdtemp()
os.environ["DATA_DIR"] = _tmpdir
os.environ["ADMIN_USERNAME"] = "admin"
os.environ["ADMIN_PASSWORD"] = "testpass123"
os.environ["ADMIN_JWT_SECRET"] = "test-secret-key"
os.environ["CI_API_KEY"] = "test-ci-key"

from app import app, limiter  # noqa: E402


@pytest.fixture()
def client():
    app.config["TESTING"] = True
    limiter.enabled = False
    with app.test_client() as client:
        yield client


@pytest.fixture()
def admin_token(client):
    resp = client.post(
        "/api/admin/login",
        json={"username": "admin", "password": "testpass123"},
    )
    return resp.get_json()["token"]
