import importlib.util
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

MODULE_PATH = Path(__file__).resolve().parents[1] / "scripts" / "generate_original_reports.py"
SPEC = importlib.util.spec_from_file_location("generate_original_reports", MODULE_PATH)
newsroom = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(newsroom)


class NewsroomTests(unittest.TestCase):
    def test_slugify_is_url_safe(self):
        self.assertEqual(newsroom.slugify("Air India: New A350 Fleet!"), "air-india-new-a350-fleet")

    def test_tokens_remove_generic_aviation_words(self):
        result = newsroom.tokens("Air India orders six A350 aircraft")
        self.assertNotIn("air", result)
        self.assertNotIn("aircraft", result)
        self.assertIn("india", result)
        self.assertIn("a350", result)

    def test_every_news_story_gets_its_own_report(self):
        now = datetime.now(timezone.utc).isoformat()
        items = [
            {"title": "Air India orders six A350 aircraft", "published": now, "url": "https://one.example/a"},
            {"title": "Air India to add six Airbus A350 aircraft", "published": now, "url": "https://two.example/b"},
        ]
        enriched = [
            {"title": items[0]["title"], "publisher": "Publisher One", "domain": "one.example", "url": items[0]["url"], "published": now, "summary": "", "page_text": "", "image": "https://img.example/one.jpg"},
            {"title": items[1]["title"], "publisher": "Publisher Two", "domain": "two.example", "url": items[1]["url"], "published": now, "summary": "", "page_text": "", "image": "https://img.example/two.jpg"},
        ]
        with patch.object(newsroom, "enrich", side_effect=enriched):
            groups = newsroom.related_groups(items)
        self.assertEqual(len(groups), len(items))
        self.assertTrue(all(len(group) == 1 for group in groups))
        self.assertEqual({group[0]["url"] for group in groups}, {item["url"] for item in items})

    def test_article_html_escapes_untrusted_text_and_lists_sources(self):
        article = {
            "headline": "Aviation <update>",
            "dek": "A sourced summary.",
            "category": "Aircraft",
            "summary": "Summary",
            "sections": [{"heading": "Details", "body": "Evidence only."}, {"heading": "Context", "body": "Context."}, {"heading": "Next", "body": "No prediction."}],
            "key_facts": ["Fact one", "Fact two"],
            "analysis": "A cautious interpretation.",
            "limitations": "No additional claims verified.",
            "seo_description": "A report",
        }
        sources = [{"publisher": "Publisher", "title": "Original source", "url": "https://publisher.example/story", "published": "2026-11-01"}]
        page = newsroom.render_page(article, sources, "aviation-update", "2026-11-01T00:00:00+00:00")
        self.assertIn("Aviation &lt;update&gt;", page)
        self.assertIn("https://publisher.example/story", page)
        self.assertIn("Sources & further reading", page)

    def test_report_page_renders_source_image(self):
        article = {
            "headline": "Aviation update", "dek": "A sourced summary.", "category": "Aircraft",
            "summary": "Summary", "sections": [{"heading": "Details", "body": "Evidence."}] * 3,
            "key_facts": ["Fact one", "Fact two"], "analysis": "Interpretation.",
            "limitations": "Limits.", "seo_description": "A report",
        }
        sources = [{"publisher": "Publisher", "title": "Source", "url": "https://publisher.example/story",
                    "published": "2026-11-01", "image": "https://publisher.example/plane.jpg"}]
        page = newsroom.render_page(article, sources, "aviation-update", "2026-11-01T00:00:00+00:00")
        self.assertIn('src="https://publisher.example/plane.jpg"', page)
        self.assertIn('meta property="og:image"', page)


if __name__ == "__main__":
    unittest.main()
