"""
Binance Futures Testnet REST client.

Handles HMAC-SHA256 request signing, timestamp generation, and raw HTTP
communication.  All calls are logged; errors surface as BinanceAPIError.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import time
import urllib.parse
from typing import Any

import httpx

logger = logging.getLogger("trading_bot.client")

# ── Constants ─────────────────────────────────────────────────────────────────
BASE_URL = "https://testnet.binancefuture.com"
API_VERSION = "/fapi/v1"
RECV_WINDOW = 5_000          # milliseconds
REQUEST_TIMEOUT = 10         # seconds


class BinanceAPIError(Exception):
    """Raised when the Binance API returns an error response."""

    def __init__(self, code: int, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(f"[Binance Error {code}] {message}")


class BinanceFuturesClient:
    """
    Thin, stateless wrapper around the Binance USDT-M Futures REST API.

    All requests are signed with HMAC-SHA256 using the secret key.
    """

    def __init__(self, api_key: str, api_secret: str) -> None:
        if not api_key or not api_secret:
            raise ValueError("Both API key and secret must be non-empty strings.")
        self._api_key = api_key
        self._api_secret = api_secret
        self._session = httpx.Client(
            base_url=BASE_URL,
            timeout=REQUEST_TIMEOUT,
            headers={
                "X-MBX-APIKEY": self._api_key,
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            },
        )
        logger.info("BinanceFuturesClient initialised (testnet: %s)", BASE_URL)

    # ── Internal helpers ──────────────────────────────────────────────────────

    @staticmethod
    def _timestamp() -> int:
        return int(time.time() * 1000)

    def _sign(self, params: dict[str, Any]) -> str:
        """Generate HMAC-SHA256 signature for the given parameter dict."""
        query_string = urllib.parse.urlencode(params)
        signature = hmac.new(
            self._api_secret.encode("utf-8"),
            query_string.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        return signature

    def _get(self, endpoint: str, params: dict[str, Any] | None = None) -> dict:
        params = params or {}
        params["timestamp"] = self._timestamp()
        params["recvWindow"] = RECV_WINDOW
        params["signature"] = self._sign(params)

        url = f"{API_VERSION}{endpoint}"
        logger.debug("GET %s | params=%s", url, {k: v for k, v in params.items() if k != "signature"})

        try:
            response = self._session.get(url, params=params)
        except httpx.RequestError as exc:
            logger.error("Network error on GET %s: %s", url, exc)
            raise ConnectionError(f"Network error: {exc}") from exc

        return self._handle_response(response)

    def _post(self, endpoint: str, params: dict[str, Any] | None = None) -> dict:
        params = params or {}
        params["timestamp"] = self._timestamp()
        params["recvWindow"] = RECV_WINDOW
        params["signature"] = self._sign(params)

        url = f"{API_VERSION}{endpoint}"
        logger.debug(
            "POST %s | body=%s",
            url,
            {k: v for k, v in params.items() if k != "signature"},
        )

        try:
            response = self._session.post(url, data=params)
        except httpx.RequestError as exc:
            logger.error("Network error on POST %s: %s", url, exc)
            raise ConnectionError(f"Network error: {exc}") from exc

        return self._handle_response(response)

    @staticmethod
    def _handle_response(response: httpx.Response) -> dict:
        try:
            data = response.json()
        except Exception:
            logger.error("Non-JSON response (%s): %s", response.status_code, response.text[:300])
            response.raise_for_status()
            return {}

        if response.is_error or (isinstance(data, dict) and "code" in data and data["code"] != 200):
            code = data.get("code", response.status_code)
            msg = data.get("msg", "Unknown error")
            logger.error("API error %s: %s", code, msg)
            raise BinanceAPIError(code, msg)

        logger.debug("Response: %s", data)
        return data

    # ── Public API methods ────────────────────────────────────────────────────

    def get_account_info(self) -> dict:
        """Return futures account info (balance, positions, etc.)."""
        logger.info("Fetching account info …")
        return self._get("/account")

    def get_exchange_info(self) -> dict:
        """Return exchange-level trading rules and symbol details."""
        logger.info("Fetching exchange info …")
        # Exchange info is public — no auth needed, but we keep the method here
        try:
            response = self._session.get(f"{API_VERSION}/exchangeInfo")
            return self._handle_response(response)
        except httpx.RequestError as exc:
            raise ConnectionError(f"Network error: {exc}") from exc

    def get_symbol_price(self, symbol: str) -> dict:
        """Return the latest mark price for *symbol*."""
        logger.info("Fetching price for %s …", symbol)
        return self._get("/ticker/price", params={"symbol": symbol})

    def get_all_orders(self, symbol: str | None = None, limit: int = 20) -> list[dict]:
        """Fetch all orders (completed or open)."""
        params: dict[str, Any] = {"limit": limit}
        if symbol:
            params["symbol"] = symbol
        logger.info("Fetching orders (symbol=%s) …", symbol)
        return self._get("/allOrders", params=params)  # type: ignore

    def place_order(self, **kwargs: Any) -> dict:
        """
        Place a new futures order.

        Keyword arguments are passed directly to POST /fapi/v1/order.
        Required: symbol, side, type, quantity.
        """
        logger.info(
            "Placing order: %s",
            {k: v for k, v in kwargs.items()},
        )
        return self._post("/order", params=dict(kwargs))

    def close(self) -> None:
        """Close the underlying HTTP session."""
        self._session.close()
        logger.debug("HTTP session closed.")

    def __enter__(self) -> "BinanceFuturesClient":
        return self

    def __exit__(self, *_: Any) -> None:
        self.close()
