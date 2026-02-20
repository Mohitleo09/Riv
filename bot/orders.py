"""
Order placement logic.

This module builds the correct parameter set for each order type and
delegates the actual HTTP call to BinanceFuturesClient.
"""

from __future__ import annotations

import logging
from decimal import Decimal
from typing import Any

from bot.client import BinanceFuturesClient, BinanceAPIError

logger = logging.getLogger("trading_bot.orders")


def _fmt(value: Decimal | None) -> str | None:
    """Convert a Decimal to a plain string without scientific notation."""
    if value is None:
        return None
    return f"{value:f}"


def place_market_order(
    client: BinanceFuturesClient,
    symbol: str,
    side: str,
    quantity: Decimal,
) -> dict[str, Any]:
    """
    Place a MARKET order.

    Args:
        client:   Authenticated BinanceFuturesClient instance.
        symbol:   Trading pair (e.g. "BTCUSDT").
        side:     "BUY" or "SELL".
        quantity: Order quantity.

    Returns:
        Raw API response dict.

    Raises:
        BinanceAPIError: On Binance-level errors.
        ConnectionError: On network failures.
    """
    logger.info(
        "Market order request | symbol=%s side=%s qty=%s",
        symbol, side, quantity,
    )
    params: dict[str, Any] = {
        "symbol": symbol,
        "side": side,
        "type": "MARKET",
        "quantity": _fmt(quantity),
    }
    response = client.place_order(**params)
    logger.info("Market order placed | orderId=%s status=%s", response.get("orderId"), response.get("status"))
    return response


def place_limit_order(
    client: BinanceFuturesClient,
    symbol: str,
    side: str,
    quantity: Decimal,
    price: Decimal,
    time_in_force: str = "GTC",
) -> dict[str, Any]:
    """
    Place a LIMIT order.

    Args:
        client:         Authenticated BinanceFuturesClient instance.
        symbol:         Trading pair.
        side:           "BUY" or "SELL".
        quantity:       Order quantity.
        price:          Limit price.
        time_in_force:  "GTC" (default), "IOC", or "FOK".

    Returns:
        Raw API response dict.
    """
    logger.info(
        "Limit order request | symbol=%s side=%s qty=%s price=%s tif=%s",
        symbol, side, quantity, price, time_in_force,
    )
    params: dict[str, Any] = {
        "symbol": symbol,
        "side": side,
        "type": "LIMIT",
        "quantity": _fmt(quantity),
        "price": _fmt(price),
        "timeInForce": time_in_force,
    }
    response = client.place_order(**params)
    logger.info("Limit order placed | orderId=%s status=%s", response.get("orderId"), response.get("status"))
    return response


def place_stop_market_order(
    client: BinanceFuturesClient,
    symbol: str,
    side: str,
    quantity: Decimal,
    stop_price: Decimal,
) -> dict[str, Any]:
    """
    Place a STOP_MARKET order (closes or opens a position when price hits
    the stop price).

    Args:
        client:      Authenticated BinanceFuturesClient instance.
        symbol:      Trading pair.
        side:        "BUY" or "SELL".
        quantity:    Order quantity.
        stop_price:  Trigger price.

    Returns:
        Raw API response dict.
    """
    logger.info(
        "Stop-Market order request | symbol=%s side=%s qty=%s stopPrice=%s",
        symbol, side, quantity, stop_price,
    )
    params: dict[str, Any] = {
        "symbol": symbol,
        "side": side,
        "type": "STOP_MARKET",
        "quantity": _fmt(quantity),
        "stopPrice": _fmt(stop_price),
    }
    response = client.place_order(**params)
    logger.info(
        "Stop-Market order placed | orderId=%s status=%s",
        response.get("orderId"), response.get("status"),
    )
    return response


def format_order_response(response: dict[str, Any]) -> str:
    """
    Return a human-readable summary of an order response.

    Args:
        response: Raw dict returned by the Binance Orders API.

    Returns:
        Formatted multi-line string.
    """
    order_id = response.get("orderId", "N/A")
    symbol = response.get("symbol", "N/A")
    side = response.get("side", "N/A")
    order_type = response.get("type", "N/A")
    status = response.get("status", "N/A")
    orig_qty = response.get("origQty", "N/A")
    exec_qty = response.get("executedQty", "N/A")
    avg_price = response.get("avgPrice")
    if not avg_price or avg_price in ("0", "0.00000"):
        avg_price = response.get("price", "N/A")
    time_in_force = response.get("timeInForce", "N/A")
    client_order_id = response.get("clientOrderId", "N/A")

    lines = [
        "",
        "  ┌─────────────────────────────────────────┐",
        "  │           ORDER CONFIRMATION             │",
        "  ├─────────────────────────────────────────┤",
        f"  │  Order ID       : {str(order_id):<23}│",
        f"  │  Client ID      : {str(client_order_id):<23}│",
        f"  │  Symbol         : {str(symbol):<23}│",
        f"  │  Side           : {str(side):<23}│",
        f"  │  Type           : {str(order_type):<23}│",
        f"  │  Time In Force  : {str(time_in_force):<23}│",
        f"  │  Qty Ordered    : {str(orig_qty):<23}│",
        f"  │  Qty Executed   : {str(exec_qty):<23}│",
        f"  │  Avg Price      : {str(avg_price):<23}│",
        f"  │  Status         : {str(status):<23}│",
        "  └─────────────────────────────────────────┘",
        "",
    ]
    return "\n".join(lines)
