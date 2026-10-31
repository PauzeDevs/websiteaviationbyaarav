#!/usr/bin/env python3
"""Collect aviation RSS headlines and generate attributed static story pages."""
import html, json, re, sys
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html import unescape
from pathlib import Path
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "news.json"
ARTICLE_DIR = ROOT / "articles"
FEEDS = [
    ("Simple Flying", "https://simpleflying.com/feed/"),
    ("FlightGlobal", "https://www.flightglobal.com/rss"),
    ("Aviation Week", "https://aviationweek.com/rss.xml"),
]
GOOGLE_NEWS = "https://news.google.com/rss/search?q=(aviation+OR+airline+OR+aircraft+OR+airport+OR+Airbus+OR+Boeing+OR+DGCA)+when:7d&hl=en-IN&gl=IN&ceid=IN:en"
AVIATION_TERMS = ("aviation", "airline", "aircraft", "airport", "airbus", "boeing", "runway", "aeroplane", "airplane", "aerospace", "helicopter", "dgca", "aai", "indigo", "air india", "spicejet", "akasa", "vistara", "jet engine", "air traffic", "airbus a", "boeing 7", "boeing 8", "pilot union", "air force aircraft")
HEADERS = {"User-Agent": "AviationByAaravNewsBot/1.0 (+https://github.com/PauzeDevs/websiteaviationbyaarav)"}

def clean(value):
    value = re.sub(r"<[^>]+>", " ", unescape(value or ""))
    return re.sub(r"\s+", " ", value).strip()

def slugify(value):
    return re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", value.lower()))[:90] or "aviation-story"

def child_text(node, names):
    for name in names:
        found = node.find(name)
        if found is not None and found.text:
            return found.text.strip()
    return ""

def category_for(text):
    t = text.lower()
    if any(k in t for k in ("india", "indigo", "air india", "dgca", "aai ", "mumbai airport", "delhi airport")): return "India"
    if any(k in t for k in ("crash", "incident", "investigation", "safety", "emergency")): return "Safety"
    if any(k in t for k in ("aircraft", "boeing", "airbus", "engine", "delivery", "fleet", "737", "787", "a350")): return "Aircraft"
    if any(k in t for k in ("airline", "indigo", "air india", "emirates", "qatar airways", "lufthansa", "routes", "flight")): return "Airlines"
    return "Industry"

def parse_date(raw):
    if not raw: return datetime.now(timezone.utc)
    try:
        d = parsedate_to_datetime(raw)
        return d.replace(tzinfo=timezone.utc) if d.tzinfo is None else d.astimezone(timezone.utc)
    except Exception:
        try: return datetime.fromisoformat(raw.replace("Z", "+00:00")).astimezone(timezone.utc)
        except Exception: return datetime.now(timezone.utc)


def is_aviation(title, description=""):
    text = (title + " " + description).lower()
    return any(term in text for term in AVIATION_TERMS)

def page_image(url):
    """Best-effort publisher hero image from Open Graph/Twitter metadata."""
    try:
        req = Request(url, headers=HEADERS)
        with urlopen(req, timeout=8) as response:
            final_url = response.geturl()
            raw = response.read(1_500_000).decode("utf-8", "ignore")
        patterns = [
            r'<meta[^>]+(?:property|name)=["\'](?:og:image|twitter:image)["\'][^>]+content=["\']([^"\']+)',
            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\'](?:og:image|twitter:image)["\']',
        ]
        for pattern in patterns:
            match = re.search(pattern, raw, re.I)
            if match:
                image = html.unescape(match.group(1)).strip()
                if image.startswith("//"): image = "https:" + image
                if image.startswith("https://"): return image, final_url
        return "", final_url
    except Exception:
        return "", url

def fetch_feed(name, url):
    req = Request(url, headers=HEADERS)
    with urlopen(req, timeout=20) as response:
        payload = response.read(4_000_000)
    root = ET.fromstring(payload)
    items = root.findall(".//item") or root.findall(".//{*}entry")
    results = []
    for item in items:
        title = clean(child_text(item, ["title", "{*}title"]))
        link = child_text(item, ["link", "{*}link"])
        if not link:
            link_node = item.find("{*}link")
            if link_node is not None: link = link_node.attrib.get("href", "")
        description = clean(child_text(item, ["description", "{*}description", "{*}summary", "{*}content"]))
        published = child_text(item, ["pubDate", "{*}published", "{*}updated", "{*}date"])
        image = ""
        # RSS publishers use several different image conventions.
        for node in item.iter():
            tag = node.tag.lower()
            candidate = node.attrib.get("url", "") or node.attrib.get("href", "")
            is_image_node = tag.endswith(("content", "thumbnail", "enclosure"))
            mime = node.attrib.get("type", "").lower()
            if candidate.startswith("https://") and (is_image_node or mime.startswith("image/")):
                image = candidate
                break
        if not image:
            raw_description = child_text(item, ["description", "{*}description", "{*}summary", "{*}content"])
            match = re.search(r"""<img[^>]+(?:src|data-src)=["']([^"']+)["']""", raw_description, re.I)
            if match and match.group(1).startswith("https://"):
                image = match.group(1)
        if title and link.startswith("http") and (name != "Google News" or is_aviation(title, description)):
            results.append({"title": title, "slug": slugify(title), "url": link,
                            "summary": description[:1400], "source": name,
                            "published": parse_date(published).isoformat(), "image": image,
                            "category": category_for(title + " " + description)})
    return results

def article_page(article):
    title = html.escape(article["title"])
    summary_raw = article.get("summary") or "The publisher did not provide an extended RSS summary for this report."
    summary = html.escape(summary_raw)
    source = html.escape(article.get("source") or "Original publisher")
    url = html.escape(article["url"], quote=True)
    category = html.escape(article.get("category", "Aviation"))
    published = html.escape(article.get("published", ""))
    image = article.get("image", "")
    image_markup = f'<img class="cover" src="{html.escape(image, quote=True)}" alt="{title}" loading="lazy" />' if image.startswith("https://") else ""
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#e9eef0"><meta name="description" content="{html.escape(summary_raw[:155], quote=True)}">
<meta property="og:title" content="{title} | Aviation by Aarav"><meta property="og:description" content="{html.escape(summary_raw[:180], quote=True)}">
<title>{title} | Aviation by Aarav</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/pauzex-editorial.css">
<style>
*{{box-sizing:border-box}}body{{margin:0;background:linear-gradient(135deg,#e9eef0,#f5f7f7 55%,#e2e9e9);color:#1d3444;font-family:'DM Sans',sans-serif;min-height:100vh}}
a{{color:#587f99;text-decoration:none}}.nav{{max-width:1100px;margin:auto;padding:20px 28px;border-bottom:1px solid rgba(29,52,68,.15);display:flex;align-items:center;min-height:88px}}
.nav img{{display:block;width:168px;height:58px;max-width:60vw;object-fit:contain;object-position:left center;mix-blend-mode:multiply;filter:none}}
main{{max-width:900px;margin:clamp(45px,8vw,100px) auto;padding:0 24px}}
.tag{{color:#748895;font:500 9px 'DM Mono',monospace;letter-spacing:.16em;text-transform:uppercase}}
h1{{font:400 clamp(42px,7vw,76px)/.96 'Instrument Serif',Georgia,serif;letter-spacing:-.035em;margin:22px 0;color:#1d3444}}
.meta{{color:#748895;font:9px 'DM Mono',monospace;letter-spacing:.08em;margin-bottom:28px}}
.cover{{width:100%;max-height:480px;object-fit:cover;border-radius:20px;margin-bottom:26px;box-shadow:0 24px 60px rgba(31,61,82,.12)}}
.report{{border:1px solid rgba(255,255,255,.88);border-radius:22px;background:rgba(255,255,255,.54);padding:clamp(24px,5vw,44px);box-shadow:0 24px 70px rgba(31,61,82,.09),inset 0 1px 0 white;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)}}
.report h2{{font:400 32px 'Instrument Serif',Georgia,serif;margin:0 0 18px;color:#1d3444}}
.report p{{font-size:15px;line-height:1.95;color:#4b6373;white-space:pre-line;margin:0}}
.source-note{{border-top:1px solid rgba(29,52,68,.14);margin-top:28px;padding-top:18px;color:#748895;font-size:11px;line-height:1.8}}
.source-actions{{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}}
.button{{display:inline-flex;align-items:center;gap:12px;padding:14px 18px;background:#1d3444;color:#f5f7f7;border-radius:4px;font-size:12px;font-weight:600}}
.button.secondary{{background:rgba(255,255,255,.52);color:#1d3444;border:1px solid rgba(29,52,68,.18)}}
footer{{max-width:900px;margin:65px auto 30px;padding:0 24px;color:#748895;font:9px 'DM Mono',monospace;letter-spacing:.06em}}
@media(max-width:600px){{.nav{{padding:15px 20px}}.nav img{{width:145px;height:52px}}main{{padding:0 18px}}.report{{padding:24px 20px}}.report p{{font-size:14px}}}}
</style></head><body><header class="nav"><a href="../index.html" aria-label="Aviation by Aarav home"><img src="../assets/file_000000008260821183c81398641a4ae8.png" alt="Aviation by Aarav" /></a></header>
<main><div class="tag">{category} · AVIATION BY AARAV REPORT</div><h1>{title}</h1><div class="meta">SOURCE: {source} &nbsp;·&nbsp; {published}</div>{image_markup}
<article class="report"><h2>Report overview</h2><p>{summary}</p>
<div class="source-note">Source credit: reporting and source summary supplied by {source}. This page presents the publisher-provided summary with attribution; it does not reproduce the publisher's complete copyrighted article. For the full report, original wording, additional context and subsequent updates, visit the publisher directly.</div>
<div class="source-actions"><a class="button" href="{url}" target="_blank" rel="noopener noreferrer">Read the complete original report ↗</a><a class="button secondary" href="../news/">Back to newsroom</a></div>
</article></main><footer>AVIATION BY AARAV · INDEPENDENT AVIATION COVERAGE · <a href="https://www.instagram.com/aviation_byaarav/">INSTAGRAM ↗</a></footer></body></html>"""

def main():
    articles, failed = [], []
    for name, url in FEEDS:
        try:
            articles.extend(fetch_feed(name, url))
            print(f"Fetched {name}")
        except Exception as exc:
            failed.append(f"{name}: {exc}")
            print(f"Feed failed: {name}: {exc}", file=sys.stderr)
    if not articles:
        if OUTPUT.exists() and json.loads(OUTPUT.read_text()).get("articles"):
            print("No feeds responded; preserving previous news data.")
            return
        raise SystemExit("No RSS feeds responded and no cached articles exist.")
    unique, seen = [], set()
    for article in sorted(articles, key=lambda x: x["published"], reverse=True):
        key = article["url"].split("#")[0].rstrip("/")
        if key in seen: continue
        seen.add(key); unique.append(article)
    # Google News is a filtered backup feed, used when publisher feeds are sparse.
    if len(unique) < 25:
        try:
            google_items = fetch_feed("Google News", GOOGLE_NEWS)
            for article in sorted(google_items, key=lambda x: x["published"], reverse=True):
                key = article["url"].split("#")[0].rstrip("/")
                if key not in seen:
                    seen.add(key); unique.append(article)
            print(f"Google News fallback supplied {len(google_items)} aviation-filtered items.")
        except Exception as exc:
            failed.append(f"Google News fallback: {exc}")
            print(f"Google News fallback failed: {exc}", file=sys.stderr)
    unique = unique[:45]
    # Prefer each publisher's own image. If RSS omits one, retrieve the article's
    # Open Graph/Twitter image. Never substitute a category-wide stock photo.
    for article in unique[:30]:
        if not article.get("image"):
            image, final_url = page_image(article["url"])
            if image: article["image"] = image
            if final_url and final_url.startswith("https://"): article["url"] = final_url
    ARTICLE_DIR.mkdir(parents=True, exist_ok=True)
    for article in unique:
        (ARTICLE_DIR / (article["slug"] + ".html")).write_text(article_page(article), encoding="utf-8")
    payload = {"updated": datetime.now(timezone.utc).isoformat(), "articles": unique, "feed_warnings": failed}
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Saved {len(unique)} stories and generated {len(unique)} article pages.")

if __name__ == "__main__": main()
