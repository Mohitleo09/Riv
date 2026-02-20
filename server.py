"""
Entry point for the Flask web UI.

Run from the project root:
    python server.py

The app reads credentials from .env automatically.
"""

import os
from dotenv import load_dotenv

load_dotenv()

from web.app import app  # noqa: E402  (import after load_dotenv)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    print(f"\n  Trading Bot Web UI  →  http://127.0.0.1:{port}\n  Press Ctrl+C to stop.\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
