"""
Input validation for order parameters.
All validators raise ValueError with human-readable messages on failure.
"""

from __future__ import annotations

from decimal import Decimal, InvalidOperation

VALID_SIDES = {"BUY", "SELL"}
VALID_ORDER_TYPES = {"MARKET", "LIMIT", "STOP_MARKET"}


def validate_symbol(symbol: str) -> str:
    """Return the uppercased trading pair or raise ValueError."""
    symbol = symbol.strip().upper()
    if not symbol:
        raise ValueError("Symbol cannot be empty.")
    if not symbol.isalpha():
        raise ValueError(
            f"Symbol '{symbol}' must contain only alphabetic characters (e.g. BTCUSDT)."
        )
    return symbol


def validate_side(side: str) -> str:
    """Return the uppercased order side or raise ValueError."""
    side = side.strip().upper()
    if side not in VALID_SIDES:
        raise ValueError(
            f"Side '{side}' is not valid. Choose from: {', '.join(sorted(VALID_SIDES))}."
        )
    return side


def validate_order_type(order_type: str) -> str:
    """Return the uppercased order type or raise ValueError."""
    order_type = order_type.strip().upper()
    if order_type not in VALID_ORDER_TYPES:
        raise ValueError(
            f"Order type '{order_type}' is not valid. "
            f"Choose from: {', '.join(sorted(VALID_ORDER_TYPES))}."
        )
    return order_type


def validate_quantity(quantity: str | float) -> Decimal:
    """
    Parse and validate the order quantity.

    Returns:
        Positive Decimal quantity.

    Raises:
        ValueError: If the quantity is not a positive number.
    """
    try:
        qty = Decimal(str(quantity))
    except InvalidOperation:
        raise ValueError(f"Quantity '{quantity}' is not a valid number.")
    if qty <= 0:
        raise ValueError(f"Quantity must be greater than zero (got {qty}).")
    return qty


def validate_price(price: str | float | None, order_type: str) -> Decimal | None:
    """
    Parse and validate the limit price.

    Only LIMIT orders require a price. MARKET and STOP_MARKET orders use
    different price mechanisms (market fill and stop_price respectively),
    so this function returns None for both without raising.

    Args:
        price:      Raw price value (may be None for non-LIMIT orders).
        order_type: Validated order type string.

    Returns:
        Positive Decimal price for LIMIT orders, None otherwise.

    Raises:
        ValueError: If price is missing or invalid for a LIMIT order.
    """
    if order_type != "LIMIT":
        return None  # only LIMIT orders need a limit price

    if price is None or str(price).strip() == "":
        raise ValueError("A price is required for LIMIT orders.")

    try:
        prc = Decimal(str(price))
    except InvalidOperation:
        raise ValueError(f"Price '{price}' is not a valid number.")
    if prc <= 0:
        raise ValueError(f"Price must be greater than zero (got {prc}).")
    return prc


def validate_stop_price(stop_price: str | float | None, order_type: str) -> Decimal | None:
    """Validate the stop price for STOP_MARKET orders."""
    if order_type != "STOP_MARKET":
        return None
    if stop_price is None or str(stop_price).strip() == "":
        raise ValueError("A stop price (--stop-price) is required for STOP_MARKET orders.")
    try:
        sp = Decimal(str(stop_price))
    except InvalidOperation:
        raise ValueError(f"Stop price '{stop_price}' is not a valid number.")
    if sp <= 0:
        raise ValueError(f"Stop price must be greater than zero (got {sp}).")
    return sp
