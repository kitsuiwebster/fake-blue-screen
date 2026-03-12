def test_login_success(client):
    resp = client.post(
        "/api/admin/login",
        json={"username": "admin", "password": "testpass123"},
    )
    assert resp.status_code == 200
    assert "token" in resp.get_json()


def test_login_wrong_password(client):
    resp = client.post(
        "/api/admin/login",
        json={"username": "admin", "password": "wrong"},
    )
    assert resp.status_code == 401


def test_login_wrong_username(client):
    resp = client.post(
        "/api/admin/login",
        json={"username": "hacker", "password": "testpass123"},
    )
    assert resp.status_code == 401


def test_kpis_unauthorized(client):
    resp = client.get("/api/admin/kpis")
    assert resp.status_code == 401


def test_kpis_invalid_token(client):
    resp = client.get(
        "/api/admin/kpis",
        headers={"Authorization": "Bearer invalid-token"},
    )
    assert resp.status_code == 401


def test_kpis_success(client, admin_token):
    resp = client.get(
        "/api/admin/kpis",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert "health" in data
    assert "disk" in data
    assert "uploads" in data
    assert "system" in data
    assert data["health"]["status"] == "ok"


def test_ci_report_unauthorized(client):
    resp = client.post("/api/admin/ci-report", json={"type": "trivy", "status": "passed"})
    assert resp.status_code == 401


def test_ci_report_trivy_frontend(client):
    resp = client.post(
        "/api/admin/ci-report",
        json={"type": "trivy_frontend", "status": "passed", "data": {"vulns": 0}},
        headers={"X-CI-API-Key": "test-ci-key"},
    )
    assert resp.status_code == 201
    assert "id" in resp.get_json()


def test_ci_report_trivy_backend(client):
    resp = client.post(
        "/api/admin/ci-report",
        json={"type": "trivy_backend", "status": "passed", "data": {}},
        headers={"X-CI-API-Key": "test-ci-key"},
    )
    assert resp.status_code == 201


def test_ci_report_pytest(client):
    resp = client.post(
        "/api/admin/ci-report",
        json={"type": "pytest", "status": "passed", "data": {}},
        headers={"X-CI-API-Key": "test-ci-key"},
    )
    assert resp.status_code == 201


def test_ci_report_invalid_type(client):
    resp = client.post(
        "/api/admin/ci-report",
        json={"type": "invalid", "status": "passed"},
        headers={"X-CI-API-Key": "test-ci-key"},
    )
    assert resp.status_code == 400


def test_ci_report_invalid_status(client):
    resp = client.post(
        "/api/admin/ci-report",
        json={"type": "trivy_frontend", "status": "unknown"},
        headers={"X-CI-API-Key": "test-ci-key"},
    )
    assert resp.status_code == 400
