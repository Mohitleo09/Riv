"""
CLI entry point for the Binance Futures Testnet Trading Bot.

Usage examples:
  python cli.py place-order --symbol BTCUSDT --side BUY --type MARKET --qty 0.01
  python cli.py place-order --symbol BTCUSDT --side SELL --type LIMIT --qty 0.01 --price 85000
  python cli.py place-order --symbol BTCUSDT --side SELL --type STOP_MARKET --qty 0.01 --stop-price 83000
  python cli.py account
  python cli.py price --symbol BTCUSDT
"""

from __future__ import annotations

import os
import sys
import argparse
import textwrap
from typing import NoReturn

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
    format_order_response,
)

# ── Banner ─────────────────────────────────────────────────────────────────────

BANNER = r"""
  ╔══════════════════════════════════════════════════════╗
  ║       Binance Futures Testnet — Trading Bot          ║
  ║           USDT-M Perpetual  |  v1.0.0                ║
  ╚══════════════════════════════════════════════════════╝
"""

# ── Helpers ────────────────────────────────────────────────────────────────────


def _print_banner() -> None:
    print(BANNER)


def _die(message: str) -> NoReturn:
    print(f"\n  [ERROR]  {message}\n")
    sys.exit(1)


def _ok(message: str) -> None:
    print(f"\n  [OK]  {message}\n")


def _load_credentials() -> tuple[str, str]:
    """Load API key and secret from .env or environment variables."""
    load_dotenv()
    api_key = os.getenv("BINANCE_API_KEY", "").strip()
    api_secret = os.getenv("BINANCE_API_SECRET", "").strip()
    if not api_key:
        _die(
            "BINANCE_API_KEY is not set. "
            "Create a .env file or export the variable in your shell."
        )
    if not api_secret:
        _die(
            "BINANCE_API_SECRET is not set. "
            "Create a .env file or export the variable in your shell."
        )
    return api_key, api_secret


# ── Sub-command handlers ───────────────────────────────────────────────────────


def cmd_place_order(args: argparse.Namespace, client: BinanceFuturesClient) -> None:
    """Validate inputs and dispatch to the correct order function."""
    logger = __import__("logging").getLogger("trading_bot.cli")

    # Validate every field up-front so errors are reported before any API call
    try:
        symbol = validate_symbol(args.symbol)
        side = validate_side(args.side)
        order_type = validate_order_type(args.type)
        quantity = validate_quantity(args.qty)
        price = validate_price(args.price, order_type)
        stop_price = validate_stop_price(args.stop_price, order_type)
    except ValueError as exc:
        _die(str(exc))

    # Print summary before sending
    print("  ─────────────────────────────────────────────")
    print("  ORDER REQUEST SUMMARY")
    print("  ─────────────────────────────────────────────")
    print(f"  Symbol     : {symbol}")
    print(f"  Side       : {side}")
    print(f"  Order Type : {order_type}")
    print(f"  Quantity   : {quantity}")
    if price is not None:
        print(f"  Price      : {price}")
    if stop_price is not None:
        print(f"  Stop Price : {stop_price}")
    print("  ─────────────────────────────────────────────\n")

    try:
        if order_type == "MARKET":
            response = place_market_order(client, symbol, side, quantity)
        elif order_type == "LIMIT":
            tif = (args.tif or "GTC").upper()
            response = place_limit_order(client, symbol, side, quantity, price, tif)
        else:  # STOP_MARKET
            response = place_stop_market_order(client, symbol, side, quantity, stop_price)

    except BinanceAPIError as exc:
        logger.error("API error placing order: %s", exc)
        _die(str(exc))
    except ConnectionError as exc:
        logger.error("Network error: %s", exc)
        _die(f"Network error — check your connection. Details: {exc}")

    print(format_order_response(response))
    _ok("Order submitted successfully.")


def cmd_account(args: argparse.Namespace, client: BinanceFuturesClient) -> None:
    """Display futures account balance summary."""
    logger = __import__("logging").getLogger("trading_bot.cli")
    try:
        info = client.get_account_info()
    except BinanceAPIError as exc:
        logger.error("API error fetching account: %s", exc)
        _die(str(exc))
    except ConnectionError as exc:
        _die(str(exc))

    assets = info.get("assets", [])
    positions = [p for p in info.get("positions", []) if float(p.get("positionAmt", 0)) != 0]

    print("\n  ── Account Balances ───────────────────────────────")
    for asset in assets:
        balance = float(asset.get("walletBalance", 0))
        unrealised = float(asset.get("unrealizedProfit", 0))
        if balance > 0 or unrealised != 0:
            print(
                f"  {asset['asset']:<8} "
                f"Wallet: {balance:>12.4f}   "
                f"Unrealised PnL: {unrealised:>12.4f}"
            )

    if positions:
        print("\n  ── Open Positions ─────────────────────────────────")
        for pos in positions:
            print(
                f"  {pos['symbol']:<12} "
                f"Amt: {pos['positionAmt']:>10}   "
                f"Entry: {pos['entryPrice']:>12}   "
                f"PnL: {pos['unrealizedProfit']:>12}"
            )
    else:
        print("\n  No open positions.")

    print()


def cmd_price(args: argparse.Namespace, client: BinanceFuturesClient) -> None:
    """Fetch and display the latest price for a symbol."""
    logger = __import__("logging").getLogger("trading_bot.cli")
    try:
        symbol = validate_symbol(args.symbol)
        data = client.get_symbol_price(symbol)
    except ValueError as exc:
        _die(str(exc))
    except BinanceAPIError as exc:
        logger.error("API error fetching price: %s", exc)
        _die(str(exc))
    except ConnectionError as exc:
        _die(str(exc))

    print(f"\n  Latest price for {data['symbol']}: {data['price']} USDT\n")


# ── Argument parser ────────────────────────────────────────────────────────────


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="trading_bot",
        description=textwrap.dedent(
            """\
            Binance Futures Testnet — Trading Bot
            Place MARKET, LIMIT, and STOP_MARKET orders on USDT-M futures.
            """
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=textwrap.dedent(
            """\
            Examples:
              python cli.py place-order --symbol BTCUSDT --side BUY --type MARKET --qty 0.01
              python cli.py place-order --symbol BTCUSDT --side SELL --type LIMIT --qty 0.01 --price 85000
              python cli.py place-order --symbol BTCUSDT --side SELL --type STOP_MARKET --qty 0.01 --stop-price 83000
              python cli.py account
              python cli.py price --symbol ETHUSDT
            """
        ),
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Logging verbosity (default: INFO)",
    )

    sub = parser.add_subparsers(dest="command", required=True, title="commands")

    # ── place-order ────────────────────────────────────────────────────────────
    order_p = sub.add_parser("place-order", help="Place a new futures order")
    order_p.add_argument("--symbol", required=True, help="Trading pair, e.g. BTCUSDT")
    order_p.add_argument(
        "--side", required=True, choices=["BUY", "SELL"], help="Order side"
    )
    order_p.add_argument(
        "--type",
        required=True,
        dest="type",
        choices=["MARKET", "LIMIT", "STOP_MARKET"],
        help="Order type",
    )
    order_p.add_argument("--qty", required=True, type=str, help="Order quantity")
    order_p.add_argument(
        "--price", default=None, type=str, help="Limit price (required for LIMIT orders)"
    )
    order_p.add_argument(
        "--stop-price",
        default=None,
        type=str,
        dest="stop_price",
        help="Stop trigger price (required for STOP_MARKET orders)",
    )
    order_p.add_argument(
        "--tif",
        default="GTC",
        choices=["GTC", "IOC", "FOK"],
        help="Time-in-force for LIMIT orders (default: GTC)",
    )

    # ── account ────────────────────────────────────────────────────────────────
    sub.add_parser("account", help="Show futures account balances and open positions")

    # ── price ──────────────────────────────────────────────────────────────────
    price_p = sub.add_parser("price", help="Fetch the latest mark price for a symbol")
    price_p.add_argument("--symbol", required=True, help="Trading pair, e.g. BTCUSDT")

    return parser


# ── Entry point ────────────────────────────────────────────────────────────────


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    _print_banner()

    logger = setup_logging(args.log_level)
    logger.info("Trading Bot started (command=%s log_level=%s)", args.command, args.log_level)

    api_key, api_secret = _load_credentials()

    with BinanceFuturesClient(api_key, api_secret) as client:
        if args.command == "place-order":
            cmd_place_order(args, client)
        elif args.command == "account":
            cmd_account(args, client)
        elif args.command == "price":
            cmd_price(args, client)
        else:
            parser.print_help()

    logger.info("Trading Bot finished.")


if __name__ == "__main__":
    main()
