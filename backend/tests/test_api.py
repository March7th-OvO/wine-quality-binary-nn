from fastapi.testclient import TestClient
from src.main import app

VALID_FEATURES = {
    "fixed_acidity": 7.4,
    "volatile_acidity": 0.36,
    "citric_acid": 0.3,
    "residual_sugar": 1.8,
    "chlorides": 0.074,
    "free_sulfur_dioxide": 17,
    "total_sulfur_dioxide": 24,
    "density": 0.99419,
    "pH": 3.24,
    "sulphates": 0.7,
    "alcohol": 11.4,
}


def test_health_check():
    response = TestClient(app).get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_prediction_rejects_out_of_range_feature():
    payload = {**VALID_FEATURES, "alcohol": 100}
    response = TestClient(app).post("/api/predict", json=payload)
    assert response.status_code == 422


def test_prediction_rejects_missing_feature():
    payload = {key: value for key, value in VALID_FEATURES.items() if key != "pH"}
    response = TestClient(app).post("/api/predict", json=payload)
    assert response.status_code == 422
