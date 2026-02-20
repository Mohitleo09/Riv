"""
Tests for bot/validators.py

Covers happy-path and all known error branches for every validator.
"""

import pytest
from decimal import Decimal

from bot.validators import (
    validate_symbol,
    validate_side,
    validate_order_type,
    validate_quantity,
    validate_price,
    validate_stop_price,
)


# ── validate_symbol ────────────────────────────────────────────────────────────

class TestValidateSymbol:
    def test_returns_uppercase(self):
        assert validate_symbol("btcusdt") == "BTCUSDT"

    def test_strips_whitespace(self):
        assert validate_symbol("  ETHUSDT  ") == "ETHUSDT"

    def test_valid_symbol(self):
        assert validate_symbol("BNBUSDT") == "BNBUSDT"

    def test_empty_raises(self):
        with pytest.raises(ValueError, match="cannot be empty"):
            validate_symbol("")

    def test_whitespace_only_raises(self):
        with pytest.raises(ValueError, match="cannot be empty"):
            validate_symbol("   ")

    def test_non_alpha_raises(self):
        with pytest.raises(ValueError, match="alphabetic"):
            validate_symbol("BTC/USDT")

    def test_number_in_symbol_raises(self):
        with pytest.raises(ValueError, match="alphabetic"):
            validate_symbol("BTC123")


# ── validate_side ──────────────────────────────────────────────────────────────

class TestValidateSide:
    def test_buy_lowercase(self):
        assert validate_side("buy") == "BUY"

    def test_sell_uppercase(self):
        assert validate_side("SELL") == "SELL"

    def test_invalid_raises(self):
        with pytest.raises(ValueError, match="not valid"):
            validate_side("LONG")

    def test_empty_raises(self):
        with pytest.raises(ValueError):
            validate_side("")


# ── validate_order_type ────────────────────────────────────────────────────────

class TestValidateOrderType:
    def test_market(self):
        assert validate_order_type("market") == "MARKET"

    def test_limit(self):
        assert validate_order_type("LIMIT") == "LIMIT"

    def test_stop_market(self):
        assert validate_order_type("stop_market") == "STOP_MARKET"

    def test_invalid_raises(self):
        with pytest.raises(ValueError, match="not valid"):
            validate_order_type("OCO")


# ── validate_quantity ──────────────────────────────────────────────────────────

class TestValidateQuantity:
    def test_integer_string(self):
        assert validate_quantity("1") == Decimal("1")

    def test_float_string(self):
        assert validate_quantity("0.001") == Decimal("0.001")

    def test_float_value(self):
        assert validate_quantity(0.5) == Decimal("0.5")

    def test_zero_raises(self):
        with pytest.raises(ValueError, match="greater than zero"):
            validate_quantity("0")

    def test_negative_raises(self):
        with pytest.raises(ValueError, match="greater than zero"):
            validate_quantity("-1")

    def test_non_numeric_raises(self):
        with pytest.raises(ValueError, match="not a valid number"):
            validate_quantity("abc")

    def test_empty_string_raises(self):
        with pytest.raises(ValueError, match="not a valid number"):
            validate_quantity("")


# ── validate_price ─────────────────────────────────────────────────────────────

class TestValidatePrice:
    def test_market_ignores_price(self):
        """MARKET orders should return None regardless of price argument."""
        assert validate_price("99999", "MARKET") is None
        assert validate_price(None, "MARKET") is None

    def test_limit_requires_price(self):
        with pytest.raises(ValueError, match="required"):
            validate_price(None, "LIMIT")

    def test_limit_empty_string_raises(self):
        with pytest.raises(ValueError, match="required"):
            validate_price("", "LIMIT")

    def test_limit_valid(self):
        assert validate_price("85000", "LIMIT") == Decimal("85000")

    def test_limit_zero_raises(self):
        with pytest.raises(ValueError, match="greater than zero"):
            validate_price("0", "LIMIT")

    def test_limit_negative_raises(self):
        with pytest.raises(ValueError, match="greater than zero"):
            validate_price("-100", "LIMIT")

    def test_limit_non_numeric_raises(self):
        with pytest.raises(ValueError, match="not a valid number"):
            validate_price("cheap", "LIMIT")

    def test_stop_market_returns_none(self):
        """STOP_MARKET is not LIMIT so validate_price returns None."""
        assert validate_price(None, "STOP_MARKET") is None

    def test_stop_market_with_price_still_returns_none(self):
        """validate_price ignores price for non-LIMIT types."""
        assert validate_price("83000", "STOP_MARKET") is None


# ── validate_stop_price ────────────────────────────────────────────────────────

class TestValidateStopPrice:
    def test_non_stop_market_returns_none(self):
        assert validate_stop_price("83000", "MARKET") is None
        assert validate_stop_price("83000", "LIMIT") is None

    def test_stop_market_valid(self):
        assert validate_stop_price("83000", "STOP_MARKET") == Decimal("83000")

    def test_stop_market_requires_value(self):
        with pytest.raises(ValueError, match="required"):
            validate_stop_price(None, "STOP_MARKET")

    def test_stop_market_empty_string_raises(self):
        with pytest.raises(ValueError, match="required"):
            validate_stop_price("", "STOP_MARKET")

    def test_stop_market_zero_raises(self):
        with pytest.raises(ValueError, match="greater than zero"):
            validate_stop_price("0", "STOP_MARKET")

    def test_stop_market_non_numeric_raises(self):
        with pytest.raises(ValueError, match="not a valid number"):
            validate_stop_price("xyz", "STOP_MARKET")
