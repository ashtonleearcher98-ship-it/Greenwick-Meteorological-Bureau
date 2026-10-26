#!/usr/bin/env python3
"""Copy the dependency-free static site into dist/ for GitHub Pages/Sites."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
if DIST.exists():
    shutil.rmtree(DIST)
DIST.mkdir()
for name in ("index.html", "warnings.html", "cities.html", "legal.html", "styles.css", "pages.css", "weather-core.js", "app.js", "warnings.js", "cities.js"):
    shutil.copy2(ROOT / name, DIST / name)
shutil.copytree(ROOT / "assets", DIST / "assets")
shutil.copytree(ROOT / "data", DIST / "data")
print(f"Built {DIST}")
