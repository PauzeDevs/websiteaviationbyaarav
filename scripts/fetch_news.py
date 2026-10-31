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
GOOGLE_NEWS = "https://news.google.com/rss/search?q=(aviation+OR+airline+OR+aircraft+OR+airport+OR+aerospace+OR+DGCA)+when:7d&hl=en-IN&gl=IN&ceid=IN:en"
AVIATION_TERMS = ("aviation", "airline", "aircraft", "airport", "airbus", "boeing", "flight", "pilot", "runway", "aeroplane", "airplane", "aerospace", "helicopter", "dgca", "aai", "indigo", "air india", "spicejet", "akasa", "vistara", "jet engine", "air traffic")
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
                            "summary": description[:360], "source": name,
                            "published": parse_date(published).isoformat(), "image": image,
                            "category": category_for(title + " " + description)})
    return results

def article_page(article):
    title = html.escape(article["title"])
    summary = html.escape(article.get("summary") or "Open the original publisher's report for the full story.")
    source = html.escape(article.get("source") or "Original publisher")
    url = html.escape(article["url"], quote=True)
    category = html.escape(article.get("category", "Aviation"))
    published = html.escape(article.get("published", ""))
    image = article.get("image", "")
    image_markup = f'<img class="cover" src="{html.escape(image, quote=True)}" alt="" />' if image.startswith("https://") else ""
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#080d16"><meta name="description" content="{summary[:155]}">
<meta property="og:title" content="{title} | Aviation by Aarav"><meta property="og:description" content="{summary[:180]}">
<title>{title} | Aviation by Aarav</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>
*{{box-sizing:border-box}}body{{margin:0;background:#080d16;color:#f4f7fb;font-family:'DM Sans',sans-serif}}a{{color:#a9d2f5;text-decoration:none}}.nav{{max-width:900px;margin:auto;padding:25px 24px;border-bottom:1px solid #ffffff18}}.nav img{{display:block;width:210px;max-width:60vw;height:auto;filter:brightness(0) invert(1)}}main{{max-width:820px;margin:70px auto;padding:0 24px}}.tag{{color:#9bcfff;font-size:10px;letter-spacing:2px;text-transform:uppercase}}h1{{font:700 clamp(34px,6vw,58px)/1.12 'Manrope',sans-serif;letter-spacing:-2px;margin:20px 0}}.meta{{color:#8295ab;font-size:12px;margin-bottom:28px}}.cover{{width:100%;max-height:420px;object-fit:cover;border-radius:18px;margin-bottom:26px}}.panel{{border:1px solid #c4e0ff24;border-radius:20px;background:linear-gradient(145deg,#17283a99,#0c1624bb);padding:28px;backdrop-filter:blur(18px)}}.panel p{{font-size:16px;line-height:1.8;color:#c0ccda}}.note{{font-size:11px!important;color:#8194aa!important;border-top:1px solid #ffffff18;padding-top:17px;margin-top:24px}}.button{{display:inline-block;margin-top:18px;background:#eaf4ff;color:#0a1726;padding:14px 19px;border-radius:30px;font-size:12px;font-weight:700}}footer{{max-width:820px;margin:80px auto 35px;padding:0 24px;color:#718198;font-size:10px}}
</style></head><body><header class="nav"><a href="../index.html" aria-label="Aviation by Aarav home"><img src="../assets/aviation-by-aarav-logo.svg" alt="Aviation by Aarav" /></a></header>
<main><div class="tag">{category} · NEWS DESK</div><h1>{title}</h1><div class="meta">{source} &nbsp;·&nbsp; {published}</div>{image_markup}
<section class="panel"><p>{summary}</p><p class="note">This page is an attributed news brief generated from the publisher's public RSS feed. It is not a substitute for the original reporting and does not reproduce the full article. Follow the source link for complete details, context and updates.</p><a class="button" href="{url}" target="_blank" rel="noopener noreferrer">Read the original report ↗</a></section>
</main><footer>© Aviation by Aarav · Independent aviation coverage · <a href="https://www.instagram.com/aviation_byaarav/">Instagram ↗</a></footer></body></html>"""

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
