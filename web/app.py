"""
Flask web application — Binance Futures Testnet Trading Bot UI.

Routes:
  GET  /              → Dashboard (account balances, open positions, order history)
  GET  /order         → Place-order form
  POST /order         → Submit order, return result page
  GET  /price/<sym>   → Latest price JSON (called via fetch from JS)
  GET  /api/account   → Account JSON (AJAX)
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime
from decimal import Decimal
from typing import Any

from flask import Flask, render_template, request, redirect, url_for, jsonify, flash
from dotenv import load_dotenv

from bot.logging_config import setup_logging
from bot.client import BinanceFuturesClient, BinanceAPIError
from bot.validators import (
    validate_symbol,
    validate_side,
    validate_order_type,
    validate_quantity,
    validate_price,
    validate_stop_price,
)
from bot.orders import (
    place_market_order,
    place_limit_order,
    place_stop_market_order,
)

# ── App setup ──────────────────────────────────────────────────────────────────

load_dotenv()
setup_logging("INFO")
logger = logging.getLogger("trading_bot.web")

app = Flask(__name__, template_folder="templates", static_folder="static")
app.secret_key = os.urandom(24)

# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_client() -> BinanceFuturesClient:
    api_key = os.getenv("BINANCE_API_KEY", "").strip()
    api_secret = os.getenv("BINANCE_API_SECRET", "").strip()
    if not api_key or not api_secret:
        raise ValueError(
            "API credentials not configured. "
            "Set BINANCE_API_KEY and BINANCE_API_SECRET in your .env file."
        )
    return BinanceFuturesClient(api_key, api_secret)


def _format_api_time(ts: int) -> str:
    """Convert Binance millisecond timestamp to readable string."""
    return datetime.fromtimestamp(ts / 1000).strftime("%Y-%m-%d %H:%M:%S")


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def dashboard():
    """Main dashboard: real-time account overview + real history from Binance."""
    account_data = None
    real_history = []
    error = None
    try:
        with _make_client() as client:
            raw = client.get_account_info()
            # Fetch real order history from Binance (requires a symbol, defaulting to BTCUSDT)
            try:
                history = client.get_all_orders(symbol="BTCUSDT", limit=15)
            except Exception:
                history = []
            
            # Fetch positions
            assets = [a for a in raw.get("assets", []) if float(a.get("walletBalance", 0)) > 0]
            positions = [p for p in raw.get("positions", []) if float(p.get("positionAmt", 0)) != 0]
            account_data = {"assets": assets, "positions": positions}

            for o in history:
                real_history.append({
                    "timestamp": _format_api_time(o.get("time", 0)),
                    "orderId": o.get("orderId"),
                    "symbol": o.get("symbol"),
                    "side": o.get("side"),
                    "type": o.get("type"),
                    "qty": o.get("origQty"),
                    "price": o.get("price") if o.get("price") != "0" else o.get("avgPrice"),
                    "status": o.get("status")
                })

    except ValueError as exc:
        error = str(exc)
    except (BinanceAPIError, ConnectionError) as exc:
        error = str(exc)
        logger.error("Dashboard account fetch failed: %s", exc)

    return render_template(
        "dashboard.html",
        account=account_data,
        error=error,
        orders=real_history,
        now=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )


@app.route("/order", methods=["GET"])
def order_form():
    """Render the place-order form."""
    return render_template("order.html")


@app.route("/order", methods=["POST"])
def submit_order():
    """Validate form input, place the order, and show result."""
    form = request.form
    raw_symbol = form.get("symbol", "")
    raw_side = form.get("side", "")
    raw_type = form.get("type", "")
    raw_qty = form.get("qty", "")
    raw_price = form.get("price", "") or None
    raw_stop = form.get("stop_price", "") or None
    raw_tif = form.get("tif", "GTC")

    # Validate
    try:
        symbol = validate_symbol(raw_symbol)
        side = validate_side(raw_side)
        order_type = validate_order_type(raw_type)
        quantity = validate_quantity(raw_qty)
        price = validate_price(raw_price, order_type)
        stop_price = validate_stop_price(raw_stop, order_type)
    except ValueError as exc:
        flash(str(exc), "error")
        return redirect(url_for("order_form"))

    # Place
    try:
        with _make_client() as client:
            if order_type == "MARKET":
                response = place_market_order(client, symbol, side, quantity)
            elif order_type == "LIMIT":
                response = place_limit_order(client, symbol, side, quantity, price, raw_tif)
            else:
                response = place_stop_market_order(client, symbol, side, quantity, stop_price)
    except ValueError as exc:
        flash(str(exc), "error")
        return redirect(url_for("order_form"))
    except BinanceAPIError as exc:
        flash(str(exc), "error")
        logger.error("Order placement error: %s", exc)
        return redirect(url_for("order_form"))
    except ConnectionError as exc:
        flash(f"Network error: {exc}", "error")
        return redirect(url_for("order_form"))

    return render_template("result.html", order=response, order_type=order_type)


@app.route("/api/price/<symbol>")
def api_price(symbol: str):
    """Return JSON price for a symbol (called via JS fetch)."""
    try:
        sym = validate_symbol(symbol)
        with _make_client() as client:
            data = client.get_symbol_price(sym)
        return jsonify({"symbol": data["symbol"], "price": data["price"]})
    except (ValueError, BinanceAPIError, ConnectionError) as exc:
        return jsonify({"error": str(exc)}), 400


@app.route("/api/account")
def api_account():
    """Return JSON account summary (called via AJAX refresh)."""
    try:
        with _make_client() as client:
            raw = client.get_account_info()
        assets = [
            a for a in raw.get("assets", [])
            if float(a.get("walletBalance", 0)) > 0
        ]
        positions = [
            p for p in raw.get("positions", [])
            if float(p.get("positionAmt", 0)) != 0
        ]
        return jsonify({"assets": assets, "positions": positions})
    except (ValueError, BinanceAPIError, ConnectionError) as exc:
        return jsonify({"error": str(exc)}), 400
