# Aviation by Aarav ✈️

An Apple-inspired aviation newsroom with a dark matte palette, translucent glass cards and subtle animated aircraft flight paths.

## Website features
- Daily aviation headlines with source, date and category filters.
- Individual, attributed static story pages generated from RSS feed summaries.
- Dedicated India aviation coverage section.
- Aircraft profiles and manufacturer reference links.
- Aviation photography showcase linked to Instagram.
- Responsive layout and reduced-motion accessibility support.
- Instagram: [@aviation_byaarav](https://www.instagram.com/aviation_byaarav/).

## Daily newsroom automation
GitHub Actions runs every day at **08:00 India Standard Time** and on manual dispatch. It collects public RSS entries from Simple Flying, FlightGlobal and Aviation Week, deduplicates them, writes `data/news.json`, generates static pages under `articles/`, and deploys the site to GitHub Pages.

Story pages contain the publisher's headline and a short RSS excerpt, with a clear attribution and link to the original report. They are news briefs, not AI-written full-length articles or a replacement for the source publisher. No article is invented when feeds are unavailable; the previous feed is preserved if every feed fails.

Some publishers may block automated feed requests or change their RSS endpoints. A feed failure is logged while other available feeds continue.

## Enable GitHub Pages
In **Settings → Pages**, select **GitHub Actions** as the build and deployment source. The workflow attempts to enable Pages and deploy the repository root.

## Project structure
- `index.html` – homepage and publication sections
- `assets/style.css` – responsive glass UI and animated aircraft
- `assets/app.js` – news feed rendering and filters
- `data/news.json` – generated news feed
- `articles/` – generated story pages
- `scripts/fetch_news.py` – RSS collector and static article generator
- `.github/workflows/daily-news.yml` – scheduled collection and deployment

## Local preview
Run `python -m http.server 8000` from the repository root, then open `http://localhost:8000`.

© Aviation by Aarav
