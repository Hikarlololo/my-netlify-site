"""
FloraScan Flask backend.
Serves static frontend and /api/identify for plant identification.
"""
import os
import json
import base64
from pathlib import Path

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Use project root for static files; on Vercel, static assets are served from public/
ROOT = Path(__file__).parent.resolve()
app = Flask(__name__, static_folder=str(ROOT), static_url_path="")
CORS(app)

# Optional: load dataset from file for identification
DATASET_PATH = Path(__file__).parent / "dataset.json"
DEFAULT_PLANT = {
    "name": "Spider Plant",
    "scientificName": "Chlorophytum comosum",
    "family": "Asparagaceae",
    "definition": "A popular houseplant with arching green and white striped leaves. Easy to grow and helps purify indoor air.",
    "confidence": "85%",
    "category": "Ornamental",
    "origin": "Tropical Africa",
    "description": "The Spider Plant is a common houseplant known for its arching leaves and plantlets.",
    "characteristics": ["Long arching leaves", "Air purifying", "Low maintenance"],
    "care": "Water when soil is dry. Prefers bright indirect light and well-draining soil.",
}


def load_dataset():
    """Load plant dataset from dataset.json if it exists."""
    if DATASET_PATH.exists():
        try:
            with open(DATASET_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except (json.JSONDecodeError, IOError):
            pass
    return []


@app.route("/")
def index():
    # Prefer public/ for Vercel; fallback to root for local dev
    for name in ("index.html", "public/index.html"):
        p = ROOT / name
        if p.is_file():
            return send_from_directory(str(p.parent), p.name)
    return send_from_directory(str(ROOT), "index.html")


@app.route("/<path:path>")
def static_file(path):
    # Check project root and public/ so both local and Vercel layouts work
    for base in (ROOT, ROOT / "public"):
        full = base / path
        if full.is_file():
            return send_from_directory(str(base), path)
    # SPA fallback: serve index.html for unknown paths
    for name in ("index.html", "public/index.html"):
        p = ROOT / name
        if p.is_file():
            return send_from_directory(str(p.parent), p.name)
    return send_from_directory(str(ROOT), "index.html")


@app.route("/api/identify", methods=["POST"])
def identify():
    """
    Accept image as multipart file or JSON { "image": "data:image/...;base64,..." }.
    Return plant info: name, scientificName, family, definition, etc.
    """
    image_data = None

    if request.content_type and "multipart/form-data" in request.content_type:
        file = request.files.get("image") or request.files.get("file")
        if file and file.filename:
            image_data = file.read()
    elif request.is_json:
        data = request.get_json() or {}
        b64 = data.get("image") or data.get("base64")
        if b64:
            if b64.startswith("data:"):
                b64 = b64.split(",", 1)[-1]
            try:
                image_data = base64.b64decode(b64)
            except Exception:
                pass

    # For now we don't run real ML; use dataset or default (you can plug in a model later)
    plants = load_dataset()
    if plants:
        plant = plants[0]
        result = {
            "name": plant.get("name", DEFAULT_PLANT["name"]),
            "scientificName": plant.get("scientificName", DEFAULT_PLANT["scientificName"]),
            "family": plant.get("family", "—"),
            "definition": plant.get("definition") or plant.get("description", DEFAULT_PLANT["definition"]),
            "confidence": "85%",
            "category": plant.get("category", DEFAULT_PLANT["category"]),
            "origin": plant.get("origin", DEFAULT_PLANT["origin"]),
            "description": plant.get("description", ""),
            "characteristics": plant.get("characteristics", DEFAULT_PLANT["characteristics"]),
            "care": plant.get("care", DEFAULT_PLANT["care"]),
            "imageUrl": plant.get("imageUrl", ""),
        }
    else:
        result = {
            "name": DEFAULT_PLANT["name"],
            "scientificName": DEFAULT_PLANT["scientificName"],
            "family": DEFAULT_PLANT["family"],
            "definition": DEFAULT_PLANT["definition"],
            "confidence": DEFAULT_PLANT["confidence"],
            "category": DEFAULT_PLANT["category"],
            "origin": DEFAULT_PLANT["origin"],
            "description": DEFAULT_PLANT["description"],
            "characteristics": DEFAULT_PLANT["characteristics"],
            "care": DEFAULT_PLANT["care"],
            "imageUrl": "",
        }

    if image_data:
        result["image"] = "data:image/jpeg;base64," + base64.b64encode(image_data).decode("utf-8")
    else:
        result["image"] = result.get("imageUrl", "")

    return jsonify(result)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
