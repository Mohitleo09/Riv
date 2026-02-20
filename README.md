# Binance Futures Testnet — Trading Bot

A clean, production-grade Python application for placing orders on the **Binance Futures Testnet (USDT-M)**.  
Supports MARKET, LIMIT, and STOP\_MARKET orders with two interfaces: a **CLI** and a **web dashboard**.

---

## Project Structure

```
Trading_bot/
├── bot/
│   ├── __init__.py
│   ├── client.py          # Binance REST client (HMAC signing, HTTP, errors)
│   ├── orders.py          # Order logic (MARKET / LIMIT / STOP_MARKET)
│   ├── validators.py      # Input validation (symbol, side, qty, price …)
│   └── logging_config.py  # Rotating file + coloured console logging
├── web/
│   ├── __init__.py
│   ├── app.py             # Flask web application
│   ├── static/
│   │   └── style.css      # Dark-theme design system
│   └── templates/
│       ├── base.html      # Shared layout (sidebar, topbar, flash messages)
│       ├── dashboard.html # Account overview + order history
│       ├── order.html     # Place-order form (live price ticker)
│       └── result.html    # Order confirmation page
├── logs/
│   └── trading_bot.log    # Generated at runtime
├── cli.py                 # CLI entry point (argparse)
├── server.py              # Web UI entry point (Flask)
├── .env.example           # Credential template
├── requirements.txt
└── README.md
```

---

## Setup

### 1 — Clone / download

```bash
git clone <repo-url>
cd Trading_bot
```

### 2 — Create a virtual environment

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate
```

### 3 — Install dependencies

```bash
pip install -r requirements.txt
```

### 4 — Configure credentials

```bash
copy .env.example .env       # Windows
cp  .env.example .env        # macOS / Linux
```

Edit `.env`:

```env
BINANCE_API_KEY=<your_testnet_api_key>
BINANCE_API_SECRET=<your_testnet_api_secret>
PORT=5000
FLASK_DEBUG=false
```

> **How to get testnet credentials:**  
> Visit [https://testnet.binancefuture.com](https://testnet.binancefuture.com), log in with GitHub,  
> and generate an API key under **"API Key"** in the top menu.

---

## Interface 1 — CLI

### General syntax

```
python cli.py [--log-level {DEBUG,INFO,WARNING,ERROR}] <command> [options]
```

### Place a MARKET order

```bash
python cli.py place-order --symbol BTCUSDT --side BUY --type MARKET --qty 0.01
```

### Place a LIMIT order

```bash
python cli.py place-order --symbol BTCUSDT --side SELL --type LIMIT --qty 0.01 --price 85000
```

Optional `--tif` (Time-In-Force): `GTC` (default) | `IOC` | `FOK`

```bash
python cli.py place-order --symbol ETHUSDT --side BUY --type LIMIT --qty 0.1 --price 2500 --tif IOC
```

### Place a STOP\_MARKET order (bonus order type)

```bash
python cli.py place-order --symbol BTCUSDT --side SELL --type STOP_MARKET --qty 0.01 --stop-price 83000
```

### View account balances & open positions

```bash
python cli.py account
```

### Fetch the latest price

```bash
python cli.py price --symbol BTCUSDT
```

### Debug-level logging

```bash
python cli.py --log-level DEBUG place-order --symbol BTCUSDT --side BUY --type MARKET --qty 0.001
```

---

## Interface 2 — Web Dashboard (Bonus UI)

```bash
python server.py
```

Then open **http://127.0.0.1:5000** in your browser.

### Features

| Page | Path | Description |
|---|---|---|
| Dashboard | `/` | Account balances, open positions, session order history |
| Place Order | `/order` | Form with live price ticker, conditional fields, client validation |
| Result | `/order` (POST) | Full order confirmation with all response fields |

### API endpoints (used internally by JS)

| Endpoint | Description |
|---|---|
| `GET /api/price/<SYMBOL>` | Latest mark price as JSON |
| `GET /api/account` | Account balances + positions as JSON |

---

## Logging

All activity is logged to **`logs/trading_bot.log`** (rotating, max 10 MB, 5 backups).  
Console output uses colour-coded log levels.

Log entries include:
- Every API request (method, endpoint, parameters — signature redacted)
- Full API responses at DEBUG level
- All errors with context

---

## Error Handling

| Error type | CLI behaviour | Web behaviour |
|---|---|---|
| Invalid input | Message + exit 1 | Flash message, stay on form |
| API error (4xx/5xx) | Error code + message | Flash message |
| Network failure | Human-readable message | Flash message |
| Missing credentials | Startup error | Dashboard error banner |

---

## Assumptions

- Only **USDT-M Perpetual Futures (Testnet)** are supported.  
- Credentials are read from `.env` or existing environment variables.  
- Quantity/price precision is passed as-is — Binance rejects values that violate a symbol's step-size rules. Use common round values for testnet.  
- Web UI order history is in-process only (resets on server restart — this is a testnet tool, not production persistence).

---

## Requirements

- Python 3.9+
- `httpx` — HTTP client with HMAC signing support
- `python-dotenv` — `.env` file loading
- `Flask` — lightweight web framework (for the web UI)
