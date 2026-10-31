#!/usr/bin/env python3
"""Collect and normalise aviation headlines from public RSS feeds."""
import json, re, sys, time
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html import unescape
from pathlib import Path
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "news.json"
FEEDS = [
    ("Simple Flying", "https://simpleflying.com/feed/"),
    ("FlightGlobal", "https://www.flightglobal.com/rss"),
    ("Aviation Week", "https://aviationweek.com/rss.xml"),
]
HEADERS = {"User-Agent": "AviationByAaravNewsBot/1.0 (+https://github.com/PauzeDevs/websiteaviationbyaarav)"}

def clean(value):
    value = re.sub(r"<[^>]+>", " ", unescape(value or ""))
    return re.sub(r"\s+", " ", value).strip()

def child_text(node, names):
    for name in names:
        found = node.find(name)
        if found is not None and found.text:
            return found.text.strip()
    return ""

def category_for(text):
    t = text.lower()
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

def fetch_feed(name, url):
    req = Request(url, headers=HEADERS)
    with urlopen(req, timeout=20) as response:
        payload = response.read(4_000_000)
    root = ET.fromstring(payload)
    items = root.findall(".//item")
    if not items:
        items = root.findall(".//{*}entry")
    results = []
    for item in items:
        title = clean(child_text(item, ["title", "{*}title"]))
        link = child_text(item, ["link", "{*}link"])
        if not link:
            link_node = item.find("{*}link")
            if link_node is not None: link = link_node.attrib.get("href", "")
        description = child_text(item, ["description", "{*}description", "{*}summary", "{*}content"])
        published = child_text(item, ["pubDate", "{*}published", "{*}updated", "{*}date"])
        image = ""
        for node in item.iter():
            if node.tag.endswith(("content", "thumbnail")):
                image = node.attrib.get("url", "")
                if image: break
        if title and link.startswith("http"):
            results.append({"title": title, "url": link, "summary": clean(description)[:280], "source": name,
                            "published": parse_date(published).isoformat(), "image": image,
                            "category": category_for(title + " " + description)})
    return results

def main():
    articles, failed = [], []
    for name, url in FEEDS:
        try:
            articles.extend(fetch_feed(name, url))
            print(f"Fetched {name}")
        except Exception as exc:
            failed.append(f"{name}: {exc}")
            print(f"Feed failed: {name}: {exc}", file=sys.stderr)
    # Preserve the last successful feed if every upstream publisher is temporarily unavailable.
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
    payload = {"updated": datetime.now(timezone.utc).isoformat(), "articles": unique[:45],
               "feed_warnings": failed}
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Saved {len(payload['articles'])} stories.")

if __name__ == "__main__": main()
