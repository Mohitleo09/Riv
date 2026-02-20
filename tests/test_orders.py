"""
Tests for bot/orders.py

Uses unittest.mock to patch BinanceFuturesClient.place_order so no real
HTTP calls are made. Tests focus on: correct parameter construction,
response parsing, and format_order_response output.
"""

import pytest
from decimal import Decimal
from unittest.mock import MagicMock, patch

from bot.orders import (
    place_market_order,
    place_limit_order,
    place_stop_market_order,
    format_order_response,
)


# ── Sample API responses ───────────────────────────────────────────────────────

MARKET_RESPONSE = {
    "orderId": 3851920147,
    "symbol": "BTCUSDT",
    "status": "FILLED",
    "clientOrderId": "x-test-market",
    "price": "0",
    "avgPrice": "96412.40000",
    "origQty": "0.010",
    "executedQty": "0.010",
    "timeInForce": "GTC",
    "type": "MARKET",
    "side": "BUY",
}

LIMIT_RESPONSE = {
    "orderId": 3851924089,
    "symbol": "BTCUSDT",
    "status": "NEW",
    "clientOrderId": "x-test-limit",
    "price": "98000",
    "avgPrice": "0.00000",
    "origQty": "0.010",
    "executedQty": "0.000",
    "timeInForce": "GTC",
    "type": "LIMIT",
    "side": "SELL",
}

STOP_RESPONSE = {
    "orderId": 3851927312,
    "symbol": "BTCUSDT",
    "status": "NEW",
    "clientOrderId": "x-test-stop",
    "price": "0",
    "avgPrice": "0.00000",
    "origQty": "0.010",
    "executedQty": "0.000",
    "timeInForce": "GTC",
    "type": "STOP_MARKET",
    "side": "SELL",
    "stopPrice": "83000",
}


# ── place_market_order ─────────────────────────────────────────────────────────

class TestPlaceMarketOrder:
    def _make_client(self, response: dict) -> MagicMock:
        client = MagicMock()
        client.place_order.return_value = response
        return client

    def test_returns_api_response(self):
        client = self._make_client(MARKET_RESPONSE)
        result = place_market_order(client, "BTCUSDT", "BUY", Decimal("0.01"))
        assert result["orderId"] == 3851920147
        assert result["status"] == "FILLED"

    def test_calls_place_order_with_correct_params(self):
        client = self._make_client(MARKET_RESPONSE)
        place_market_order(client, "BTCUSDT", "BUY", Decimal("0.01"))
        client.place_order.assert_called_once_with(
            symbol="BTCUSDT",
            side="BUY",
            type="MARKET",
            quantity="0.01",
        )

    def test_quantity_formatted_as_string(self):
        """Ensure Decimal is serialised to a plain string (no scientific notation)."""
        client = self._make_client(MARKET_RESPONSE)
        place_market_order(client, "ETHUSDT", "SELL", Decimal("0.001"))
        _, kwargs = client.place_order.call_args
        assert kwargs["quantity"] == "0.001"
        assert "E" not in kwargs["quantity"]  # no scientific notation


# ── place_limit_order ──────────────────────────────────────────────────────────

class TestPlaceLimitOrder:
    def _make_client(self, response: dict) -> MagicMock:
        client = MagicMock()
        client.place_order.return_value = response
        return client

    def test_returns_api_response(self):
        client = self._make_client(LIMIT_RESPONSE)
        result = place_limit_order(client, "BTCUSDT", "SELL", Decimal("0.01"), Decimal("98000"))
        assert result["status"] == "NEW"

    def test_default_tif_is_gtc(self):
        client = self._make_client(LIMIT_RESPONSE)
        place_limit_order(client, "BTCUSDT", "SELL", Decimal("0.01"), Decimal("98000"))
        _, kwargs = client.place_order.call_args
        assert kwargs["timeInForce"] == "GTC"

    def test_custom_tif(self):
        client = self._make_client(LIMIT_RESPONSE)
        place_limit_order(client, "BTCUSDT", "BUY", Decimal("0.01"), Decimal("90000"), "IOC")
        _, kwargs = client.place_order.call_args
        assert kwargs["timeInForce"] == "IOC"

    def test_correct_params(self):
        client = self._make_client(LIMIT_RESPONSE)
        place_limit_order(client, "BTCUSDT", "SELL", Decimal("0.01"), Decimal("98000"))
        _, kwargs = client.place_order.call_args
        assert kwargs["symbol"] == "BTCUSDT"
        assert kwargs["side"] == "SELL"
        assert kwargs["type"] == "LIMIT"
        assert kwargs["quantity"] == "0.01"
        assert kwargs["price"] == "98000"


# ── place_stop_market_order ────────────────────────────────────────────────────

class TestPlaceStopMarketOrder:
    def _make_client(self, response: dict) -> MagicMock:
        client = MagicMock()
        client.place_order.return_value = response
        return client

    def test_returns_api_response(self):
        client = self._make_client(STOP_RESPONSE)
        result = place_stop_market_order(client, "BTCUSDT", "SELL", Decimal("0.01"), Decimal("83000"))
        assert result["type"] == "STOP_MARKET"

    def test_correct_params(self):
        client = self._make_client(STOP_RESPONSE)
        place_stop_market_order(client, "BTCUSDT", "SELL", Decimal("0.01"), Decimal("83000"))
        _, kwargs = client.place_order.call_args
        assert kwargs["type"] == "STOP_MARKET"
        assert kwargs["stopPrice"] == "83000"
        assert "price" not in kwargs  # stop_market has no limit price


# ── format_order_response ──────────────────────────────────────────────────────

class TestFormatOrderResponse:
    def test_contains_order_id(self):
        text = format_order_response(MARKET_RESPONSE)
        assert "3851920147" in text

    def test_contains_symbol(self):
        text = format_order_response(MARKET_RESPONSE)
        assert "BTCUSDT" in text

    def test_contains_status(self):
        text = format_order_response(MARKET_RESPONSE)
        assert "FILLED" in text

    def test_contains_avg_price(self):
        text = format_order_response(MARKET_RESPONSE)
        assert "96412.40000" in text

    def test_limit_response_contains_price(self):
        text = format_order_response(LIMIT_RESPONSE)
        assert "98000" in text

    def test_handles_missing_keys_gracefully(self):
        """An empty dict must not raise — all missing fields fall back to N/A."""
        text = format_order_response({})
        assert "N/A" in text

    def test_is_string(self):
        assert isinstance(format_order_response(MARKET_RESPONSE), str)
