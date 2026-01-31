# FloraScan

AI-powered plant identification for Philippine flora. Upload a photo, take a picture (camera works on mobile), or use your own dataset.

## Run with Flask backend (local)

1. Install: `pip install -r requirements.txt`
2. Run: `python app.py`
3. Open: [http://localhost:5000](http://localhost:5000)

The frontend calls `POST /api/identify` with the image; the backend returns plant name, scientific name, family, definition, and more. Add a `dataset.json` in the project root (same format as the Datasets page) for the backend to use.

## Put it online (free)

### Option 1: Netlify

1. Push this folder to a Git repo (GitHub, GitLab, or Bitbucket).
2. Go to [netlify.com](https://www.netlify.com) → **Add new site** → **Import an existing project**.
3. Connect your repo. **Build command**: leave empty. **Publish directory**: `.` (root).
4. Deploy. You get a URL like `https://your-site.netlify.app`.

### Option 2: Vercel

1. Push this folder to a GitHub repo.
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import your repo.
3. Leave build settings as default (no build). Deploy.
4. You get a URL like `https://your-project.vercel.app`.

### Option 3: GitHub Pages

1. Push this folder to a GitHub repo.
2. Repo → **Settings** → **Pages** → Source: **Deploy from a branch**.
3. Branch: `main`, folder: **/ (root)**. Save.
4. Your site will be at `https://<username>.github.io/<repo>/`. Use `index.html` as the entry (e.g. `https://<username>.github.io/<repo>/index.html`).

---

## Datasets

Use the **Datasets** page in the app to:

- **Upload** a JSON or CSV file with your plants.
- **Paste** JSON directly and save.
- **Download** the sample JSON to see the format.

Dataset format (JSON array of plants):

```json
[
  {
    "name": "Spider Plant",
    "scientificName": "Chlorophytum comosum",
    "imageUrl": "https://example.com/image.jpg",
    "description": "Popular houseplant.",
    "category": "Ornamental",
    "origin": "Philippines",
    "characteristics": ["Green leaves", "Low maintenance"],
    "care": "Water when dry."
  }
]
```

CSV: use columns `name`, `scientificName`, `imageUrl`, `description`, `category`, `origin`, `characteristics` (semicolon-separated), `care`.

Your dataset is stored in the browser and used on the **Home** page (Common Philippine Plants) and when you **Identify** a plant.
