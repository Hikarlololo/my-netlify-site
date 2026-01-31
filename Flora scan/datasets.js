/* FloraScan dataset storage key */
const DATASET_KEY = "floraScanDataset";

/**
 * Parse CSV text into array of plant objects.
 * Expects header: name, scientificName, imageUrl, description, category, origin, characteristics, care
 */
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const plants = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row = {};
    headers.forEach((h, j) => {
      row[h] = values[j] || "";
    });
    if (row.characteristics && typeof row.characteristics === "string") {
      row.characteristics = row.characteristics.split(";").map((s) => s.trim()).filter(Boolean);
    }
    plants.push(normalizePlant(row));
  }
  return plants;
}

/**
 * Normalize a plant object to have expected fields.
 */
function normalizePlant(p) {
  return {
    name: p.name || "Unknown",
    scientificName: p.scientificName || p.scientific_name || "",
    family: p.family || p.family_name || "",
    definition: p.definition || p.description || "",
    imageUrl: p.imageUrl || p.image_url || "",
    description: p.description || "",
    category: p.category || "Ornamental",
    origin: p.origin || "Philippines",
    characteristics: Array.isArray(p.characteristics) ? p.characteristics : (p.characteristics ? [p.characteristics] : []),
    care: p.care || "",
  };
}

/**
 * Load dataset from localStorage.
 */
function loadDataset() {
  try {
    const raw = localStorage.getItem(DATASET_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

/**
 * Save dataset to localStorage.
 */
function saveDataset(plants) {
  if (!Array.isArray(plants) || plants.length === 0) {
    localStorage.removeItem(DATASET_KEY);
    return;
  }
  const normalized = plants.map(normalizePlant);
  localStorage.setItem(DATASET_KEY, JSON.stringify(normalized));
}

/**
 * Update UI: status, preview list, clear button.
 */
function updateUI() {
  const status = document.getElementById("datasetStatus");
  const preview = document.getElementById("datasetPreview");
  const clearBtn = document.getElementById("clearDataset");
  const dataset = loadDataset();

  if (!dataset || dataset.length === 0) {
    if (status) status.textContent = "No dataset loaded. Upload or paste above.";
    if (preview) preview.innerHTML = "";
    if (clearBtn) clearBtn.style.display = "none";
    return;
  }

  if (status) status.textContent = dataset.length + " plant(s) in dataset. Used on Home and for identification.";
  if (preview) {
    preview.innerHTML = dataset
      .slice(0, 20)
      .map((p) => '<div class="preview-item">' + (p.name || "—") + " <em>" + (p.scientificName || "") + "</em></div>")
      .join("") + (dataset.length > 20 ? "<div class='preview-item'>… and " + (dataset.length - 20) + " more</div>" : "");
  }
  if (clearBtn) clearBtn.style.display = "inline-flex";
}

/**
 * Sample JSON for download.
 */
const sampleJSON = [
  {
    name: "Spider Plant",
    scientificName: "Chlorophytum comosum",
    family: "Asparagaceae",
    definition: "A popular houseplant with arching green and white striped leaves. Easy to grow and helps purify indoor air.",
    imageUrl: "https://images.unsplash.com/photo-1638842940758-c933b1d7a369?w=400&h=400&fit=crop",
    description: "Popular houseplant with arching leaves.",
    category: "Ornamental",
    origin: "Tropical Africa",
    characteristics: ["Long arching leaves", "Air purifying", "Low maintenance"],
    care: "Water when dry, bright indirect light.",
  },
  {
    name: "Snake Plant",
    scientificName: "Sansevieria trifasciata",
    family: "Asparagaceae",
    definition: "Hardy succulent with upright, sword-shaped leaves. Very drought tolerant.",
    imageUrl: "https://images.unsplash.com/photo-1596670121720-43b064147efd?w=400&h=400&fit=crop",
    description: "Hardy succulent with upright leaves.",
    category: "Ornamental",
    origin: "West Africa",
    characteristics: ["Upright leaves", "Drought tolerant", "Low light"],
    care: "Water sparingly, tolerates low light.",
  },
];

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("datasetFile");
  const pasteArea = document.getElementById("datasetPaste");
  const saveFromPasteBtn = document.getElementById("saveFromPaste");
  const clearBtn = document.getElementById("clearDataset");
  const downloadSampleLink = document.getElementById("downloadSample");

  updateUI();

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target.result;
        let plants = [];
        if (file.name.toLowerCase().endsWith(".csv")) {
          plants = parseCSV(text);
        } else {
          try {
            const data = JSON.parse(text);
            plants = Array.isArray(data) ? data.map(normalizePlant) : [];
          } catch (err) {
            alert("Invalid JSON: " + err.message);
            return;
          }
        }
        if (plants.length === 0) {
          alert("No valid plants found in file.");
          return;
        }
        saveDataset(plants);
        updateUI();
        e.target.value = "";
        alert("Dataset saved: " + plants.length + " plant(s).");
      };
      reader.readAsText(file);
    });
  }

  if (saveFromPasteBtn && pasteArea) {
    saveFromPasteBtn.addEventListener("click", () => {
      const text = pasteArea.value.trim();
      if (!text) {
        alert("Paste JSON first.");
        return;
      }
      try {
        const data = JSON.parse(text);
        const plants = Array.isArray(data) ? data.map(normalizePlant) : [];
        if (plants.length === 0) {
          alert("JSON must be an array of plants.");
          return;
        }
        saveDataset(plants);
        updateUI();
        alert("Dataset saved: " + plants.length + " plant(s).");
      } catch (err) {
        alert("Invalid JSON: " + err.message);
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm("Clear the current dataset? The default plants will show on Home again.")) {
        localStorage.removeItem(DATASET_KEY);
        updateUI();
      }
    });
  }

  if (downloadSampleLink) {
    downloadSampleLink.addEventListener("click", (e) => {
      e.preventDefault();
      const blob = new Blob([JSON.stringify(sampleJSON, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "florascan-sample-dataset.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }
});
