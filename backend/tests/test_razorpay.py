import os, hmac, hashlib, requests, pytest

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://db-integration-16.preview.emergentagent.com').rstrip('/')
SECRET = "cwYauUFEKheGa1Kt5HEpAFrA"

def test_create_order():
    r = requests.post(f"{BASE_URL}/api/orders/create", json={
        "amount": 200, "currency": "INR", "receipt": "TEST_rcpt_1", "notes": {"k": "v"}
    }, timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["id"].startswith("order_")
    assert d["amount"] == 200
    assert d["currency"] == "INR"
    assert d["status"] in ("created", "attempted")
    pytest.order_id = d["id"]

def test_verify_valid_signature():
    order_id = getattr(pytest, "order_id", "order_TEST123")
    payment_id = "pay_TEST123"
    msg = f"{order_id}|{payment_id}"
    sig = hmac.new(SECRET.encode(), msg.encode(), hashlib.sha256).hexdigest()
    r = requests.post(f"{BASE_URL}/api/orders/verify", json={
        "razorpay_order_id": order_id, "razorpay_payment_id": payment_id, "razorpay_signature": sig
    }, timeout=30)
    assert r.status_code == 200
    assert r.json()["success"] is True

def test_verify_invalid_signature():
    r = requests.post(f"{BASE_URL}/api/orders/verify", json={
        "razorpay_order_id": "order_X", "razorpay_payment_id": "pay_X", "razorpay_signature": "badsig"
    }, timeout=30)
    assert r.status_code == 200
    assert r.json()["success"] is False

def test_create_order_invalid_amount():
    r = requests.post(f"{BASE_URL}/api/orders/create", json={
        "amount": 0, "currency": "INR", "receipt": "TEST_bad"
    }, timeout=30)
    assert r.status_code in (400, 500)
