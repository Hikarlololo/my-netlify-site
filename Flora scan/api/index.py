# Vercel entrypoint: re-export Flask app from project root so Vercel finds it.
import sys
from pathlib import Path

# Ensure project root is on path so "from app import app" finds root app.py
_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from app import app
