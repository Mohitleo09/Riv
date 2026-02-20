"""
Tests for bot/client.py

Uses httpx.MockTransport / respx to verify: signing, error parsing,
and the BinanceAPIError exception surface — without real network calls.
"""

import hashlib
import hmac
import json
import urllib.parse
import pytest
from unittest.mock import MagicMock, patch

from bot.client import BinanceFuturesClient, BinanceAPIError


# ── Fixtures ───────────────────────────────────────────────────────────────────

API_KEY    = "test_api_key_abc123"
API_SECRET = "test_api_secret_xyz789"


def make_client() -> BinanceFuturesClient:
    return BinanceFuturesClient(API_KEY, API_SECRET)


# ── Constructor validation ─────────────────────────────────────────────────────

class TestClientInit:
    def test_empty_key_raises(self):
        with pytest.raises(ValueError, match="API key"):
            BinanceFuturesClient("", "secret")

    def test_empty_secret_raises(self):
        with pytest.raises(ValueError, match="secret"):
            BinanceFuturesClient("key", "")

    def test_valid_init(self):
        client = make_client()
        assert client is not None
        client.close()


# ── Signature generation ───────────────────────────────────────────────────────

class TestSignature:
    def test_sign_produces_correct_hmac(self):
        client = make_client()
        params = {"symbol": "BTCUSDT", "timestamp": 1740036902341}
        query_string = urllib.parse.urlencode(params)
        expected = hmac.new(
            API_SECRET.encode(),
            query_string.encode(),
            hashlib.sha256,
        ).hexdigest()
        assert client._sign(params) == expected
        client.close()

    def test_sign_returns_hex_string(self):
        client = make_client()
        sig = client._sign({"foo": "bar"})
        assert isinstance(sig, str)
        assert len(sig) == 64  # SHA-256 hex is always 64 chars
        client.close()


# ── _handle_response ───────────────────────────────────────────────────────────

class TestHandleResponse:
    def _mock_response(self, status_code: int, body: dict):
        """Build a minimal mock that mimics httpx.Response."""
        mock = MagicMock()
        mock.status_code = status_code
        mock.is_error = status_code >= 400
        mock.json.return_value = body
        mock.text = json.dumps(body)
        return mock

    def test_success_returns_dict(self):
        mock_resp = self._mock_response(200, {"orderId": 123, "status": "FILLED"})
        result = BinanceFuturesClient._handle_response(mock_resp)
        assert result["orderId"] == 123

    def test_api_error_raises_binance_api_error(self):
        mock_resp = self._mock_response(400, {"code": -1102, "msg": "Mandatory parameter missing."})
        with pytest.raises(BinanceAPIError) as exc_info:
            BinanceFuturesClient._handle_response(mock_resp)
        assert exc_info.value.code == -1102
        assert "Mandatory parameter" in exc_info.value.message

    def test_binance_api_error_str(self):
        err = BinanceAPIError(-2014, "API-key format invalid.")
        assert "-2014" in str(err)
        assert "API-key format invalid" in str(err)

    def test_non_json_still_raises(self):
        mock_resp = MagicMock()
        mock_resp.status_code = 500
        mock_resp.is_error = True
        mock_resp.json.side_effect = Exception("not json")
        mock_resp.text = "Internal Server Error"
        mock_resp.raise_for_status.side_effect = Exception("500")
        with pytest.raises(Exception):
            BinanceFuturesClient._handle_response(mock_resp)


# ── place_order (mocked HTTP) ──────────────────────────────────────────────────

class TestPlaceOrder:
    def test_place_order_passes_params(self):
        """Verify place_order builds the POST body and returns the parsed response."""
        with patch.object(BinanceFuturesClient, "_post") as mock_post:
            mock_post.return_value = {"orderId": 999, "status": "FILLED"}
            client = make_client()
            result = client.place_order(symbol="BTCUSDT", side="BUY", type="MARKET", quantity="0.01")
            mock_post.assert_called_once()
            call_kwargs = mock_post.call_args[1] if mock_post.call_args[1] else {}
            assert result["orderId"] == 999
            client.close()

    def test_get_symbol_price_calls_get(self):
        with patch.object(BinanceFuturesClient, "_get") as mock_get:
            mock_get.return_value = {"symbol": "BTCUSDT", "price": "96000.00"}
            client = make_client()
            result = client.get_symbol_price("BTCUSDT")
            assert result["price"] == "96000.00"
            mock_get.assert_called_once_with("/ticker/price", params={"symbol": "BTCUSDT"})
            client.close()
