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

    def test_related_story_requires_two_independent_domains(self):
        now = datetime.now(timezone.utc).isoformat()
        items = [
            {"title": "Air India orders six A350 aircraft", "published": now},
            {"title": "Air India to add six Airbus A350 aircraft", "published": now},
        ]
        enriched = [
            {"title": items[0]["title"], "publisher": "Publisher One", "domain": "one.example", "url": "https://one.example/a", "published": now, "summary": "", "page_text": "", "tokens": newsroom.tokens(items[0]["title"])},
            {"title": items[1]["title"], "publisher": "Publisher Two", "domain": "two.example", "url": "https://two.example/b", "published": now, "summary": "", "page_text": "", "tokens": newsroom.tokens(items[1]["title"])},
        ]
        with patch.object(newsroom, "enrich", side_effect=enriched):
            groups = newsroom.related_groups(items)
        self.assertEqual(len(groups), 1)
        self.assertEqual({item["domain"] for item in groups[0]}, {"one.example", "two.example"})

    def test_same_domain_is_not_independent_confirmation(self):
        now = datetime.now(timezone.utc).isoformat()
        items = [
            {"title": "Air India orders six A350 aircraft", "published": now},
            {"title": "Air India to add six Airbus A350 aircraft", "published": now},
        ]
        enriched = [
            {"title": items[0]["title"], "publisher": "Publisher One", "domain": "same.example", "url": "https://same.example/a", "published": now, "summary": "", "page_text": "", "tokens": newsroom.tokens(items[0]["title"])},
            {"title": items[1]["title"], "publisher": "Publisher One", "domain": "same.example", "url": "https://same.example/b", "published": now, "summary": "", "page_text": "", "tokens": newsroom.tokens(items[1]["title"])},
        ]
        with patch.object(newsroom, "enrich", side_effect=enriched):
            self.assertEqual(newsroom.related_groups(items), [])

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


if __name__ == "__main__":
    unittest.main()
