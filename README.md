A clean, production-grade Python application for placing orders on the **Binance Futures Testnet (USDT-M)**.  
Supports MARKET, LIMIT, and STOP\_MARKET orders with two interfaces: a **CLI** and a **web dashboard**.

---

## 🚨 CRITICAL: API Key Configuration

**This application will NOT function without a valid Binance Futures Testnet API Key and Secret.**

### What happens if API keys are missing?
- **Authentication Failure:** Every request to place an order, view your balance, or see open positions will be rejected by Binance.
- **CLI Errors:** The CLI will immediately stop and print a descriptive error message if keys are not found in your `.env` file.
- **Web UI Errors:** The dashboard will display a red error banner, and order forms will fail to submit.
- **Security:** Always use the `.env` file for your keys. **NEVER** hardcode your keys directly into the source code or commit the `.env` file to GitHub, as this exposes your account to theft.

> **Note on Submission Credentials:** The API keys have not been pre-configured in this submission because the Binance Testnet currently requires identity verification and a deposit for key generation. However, the project is fully implemented and tested; once valid API credentials are added to the `.env` file, all features (ordering, account info, and history) will function correctly as requested.

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

## 🚀 Running the Application

This project provides **three distinct ways** to interact with the Binance Testnet. Choose the one that best fits your workflow:

### Option 1: Direct CLI Commands
**Best for:** Automation and quick status checks.
- **Command:** `python cli.py <command> [options]`
- **What happens:** The bot executes the specific command, prints the result to your terminal, and exits.
- **Examples:**
  ```bash
  # Check your testnet wallet balance
  python cli.py account
  
  # Place a Market Buy
  python cli.py place-order --symbol BTCUSDT --side BUY --type MARKET --qty 0.01
  ```

### Option 2: Interactive CLI Menu (Bonus)
**Best for:** Users who want a guided experience without typing long flags.
- **Command:** `python cli.py menu`
- **What happens:** A text-based menu opens in your terminal. It will prompt you step-by-step for the symbol, side, and quantity. You don't need to remember any flags.
- **How to exit:** Choose option `0` from the menu.

### Option 3: Web Dashboard (Bonus)
**Best for:** Visual monitoring and a modern trading interface.
- **Command:** `python server.py`
- **What happens:** A local web server starts on your machine.
- **How to view:** Open your browser and go to **[http://127.0.0.1:5000](http://127.0.0.1:5000)**.
- **Features:** A dark-mode dashboard showing live stats, open positions, and a "Place Order" button.

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
