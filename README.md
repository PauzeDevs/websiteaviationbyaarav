# Aviation by Aarav ✈️

An Apple-inspired aviation newsroom covering airline updates, aircraft, airports, safety and the wider aerospace industry.

## Website
- Static, responsive website hosted on GitHub Pages.
- Daily RSS headline collection from aviation publishers.
- Source links and publication dates retained with every story.
- Category filters for Airlines, Aircraft, Industry and Safety.
- Instagram: [@aviation_byaarav](https://www.instagram.com/aviation_byaarav/).

## Daily publishing
GitHub Actions runs every day at **08:00 India Standard Time** and can also be started manually from the Actions tab. The collector reads public RSS feeds, normalises and deduplicates stories, and updates `data/news.json`. The site is then deployed to GitHub Pages.

Current feed sources:
- Simple Flying
- FlightGlobal
- Aviation Week

Headlines and summaries are attributed to their original publishers. The automation republishes feed metadata and short excerpts with links to the source; it does not invent reporting or claim that an RSS excerpt is original journalism. Feed availability and publisher terms may change.

## Enable GitHub Pages
In the repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**. The workflow deploys the repository root as the static site.

## Local preview
For the news feed to load locally, serve the repository with a local HTTP server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Project structure
- `index.html` – homepage
- `assets/` – styling and frontend behaviour
- `data/news.json` – generated news feed
- `scripts/fetch_news.py` – RSS collector
- `.github/workflows/daily-news.yml` – scheduled collection and deployment

© Aviation by Aarav
