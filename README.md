<div align="center">

# Aviation by Aarav ✈️

<a href="https://aviationbyaarav.devs.surf/">
  <img src="https://readme-typing-svg.demolab.com?font=Orbitron&weight=600&size=24&pause=900&color=58A6FF&center=true&vCenter=true&width=520&lines=EXPLORE+AVIATION+BY+AARAV;YOUR+DAILY+AVIATION+NEWSROOM;OPEN+THE+LIVE+WEBSITE+%E2%86%92" alt="Explore Aviation by Aarav, your daily aviation newsroom" />
</a>

<br />

[![Visit Website](https://img.shields.io/badge/🌐_VISIT_WEBSITE-Open_Newsroom-1D75BD?style=for-the-badge)](https://aviationbyaarav.devs.surf/)
[![Instagram](https://img.shields.io/badge/INSTAGRAM-@aviation__byaarav-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/aviation_byaarav/)

*An editorial aviation newsroom with the ThreeUI Temple Night WebGL scene, darker liquid-glass surfaces and responsive reporting pages.*

</div>

## Website features
- Daily aviation headlines with source, date and category filters.
- Individual, attributed static story pages generated from RSS feed summaries.
- Dedicated India aviation coverage section.
- Aircraft profiles and manufacturer reference links.
- Aviation photography showcase linked to Instagram.
- Full-page ThreeUI Temple Night background with lazy initialisation, visibility-aware rendering, responsive quality and reduced-motion support.
- Darker liquid-glass cards and translucent navigation across the homepage, newsroom, aircraft directory and report pages.

## Hybrid AI newsroom
The existing daily workflow continues to collect and publish attributed RSS briefs. After a successful collection, the separate **AI newsroom drafts** workflow researches recent stories, checks for coverage by at least two independent publisher domains, and uses the Groq API to draft original Aviation by Aarav reports. It writes report pages under `originals/` and an index at `data/original-reports.json`, then opens or updates a **draft pull request**. Nothing written by the AI workflow is published until a human reviews and merges that PR.

The writer is instructed to use only the retrieved source material, avoid invented quotes or figures, attribute claims that are not independently confirmed, and disclose evidence gaps. Stories without enough corroboration are skipped. Source links are included on every original report.

### Required repository secret
Add `GROQ_API_KEY` under **Settings → Secrets and variables → Actions**. The workflow uses Groq's OpenAI-compatible chat completions endpoint with `openai/gpt-oss-120b` by default. Groq's free Developer tier has usage limits that can change; check your Groq console for the current limits. This is separate from ChatGPT subscriptions.

The AI workflow is triggered after the daily RSS workflow succeeds, or manually with **Actions → AI newsroom drafts → Run workflow**. It creates a draft PR for editorial approval; it never auto-merges or directly publishes AI-written reports.

Some publishers may block automated page requests. Such sources are skipped, and no report is generated unless at least two independent publisher domains can be researched.

## Enable GitHub Pages
In **Settings → Pages**, select **GitHub Actions** as the build and deployment source. The workflow attempts to enable Pages and deploy the repository root.

## Project structure
- `index.html` – homepage and publication sections
- `assets/style.css` and `assets/pauzex-editorial.css` – responsive editorial and glass UI
- `assets/ambient-scene.js` – shared Temple Night background loader
- `assets/templeNightRenderer.js` – ThreeUI Temple Night WebGL renderer (MIT licensed; see `THREEUI-LICENSE.md`)
- `THREEUI-LICENSE.md` – upstream MIT attribution and license
- `assets/app.js` – news feed rendering, source links and category filters
- `aircraft/` – aircraft directory
- `data/news.json` – generated news feed
- `articles/` – generated story pages
- `scripts/fetch_news.py` – RSS collector and attributed brief generator
- `scripts/generate_original_reports.py` – multi-source research and original article drafting
- `originals/` and `data/original-reports.json` – generated original report pages and index
- `.github/workflows/daily-news.yml` – scheduled RSS collection and deployment
- `.github/workflows/ai-newsroom.yml` – AI drafting and human-review PR automation

## Local preview
Run `python -m http.server 8000` from the repository root, then open `http://localhost:8000`.

---

© Aviation by Aarav
