import datetime as dt
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import feedparser
from scripts import publish_feeds as feeds

class PublicationFeeds(unittest.TestCase):
    def test_content_ids_and_topics(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory); week='week-of-2026-11-09.md'
            weekly=root/'weekly/2026'/week; weekly.parent.mkdir(parents=True)
            weekly.write_text('# Weekly edition\n\n[AI](../../topics/ai/2026/'+week+')\n\nCollection reports:\n\n```json\n{"entries":2}\n```')
            ai=root/'topics/ai/2026'/week;ai.parent.mkdir(parents=True)
            ai.write_text('# AI\n\n## Research & tools\n\nA **useful** result. [Source](https://example.org/paper)')
            dates=(dt.datetime(2026,11,14,tzinfo=dt.timezone.utc),dt.datetime(2026,11,15,tzinfo=dt.timezone.utc))
            with patch.object(feeds,'timestamps',return_value=dates):
                output=root/'output';feeds.build(root,output)
                self.assertEqual(len(list(output.rglob('*.xml'))),14)
                atom=feedparser.parse((output/'feed.xml').read_bytes())
                rss=feedparser.parse((output/'feed.rss.xml').read_bytes())
                self.assertFalse(atom.bozo);self.assertFalse(rss.bozo)
                self.assertEqual(len(atom.entries),1)
                entry=atom.entries[0]
                self.assertIn('<strong>useful</strong>',entry.content[0].value)
                self.assertNotIn('Collection reports',entry.content[0].value)
                self.assertIn(feeds.REPO+'/blob/main/topics/ai/2026/',entry.content[0].value)
                self.assertEqual(entry.link, feeds.REPO + '/blob/main/weekly/2026/week-of-2026-11-09.md')
                self.assertEqual(entry.id,rss.entries[0].id)
                self.assertEqual(entry.published_parsed.tm_mday,14)
                self.assertEqual(entry.updated_parsed.tm_mday,15)
                original=entry.id
                ai.write_text('# AI\n\nCorrected research summary.')
                feeds.build(root,output)
                self.assertEqual(feedparser.parse((output/'feed.xml').read_bytes()).entries[0].id,original)
                self.assertEqual(len(feedparser.parse((output/'feeds/ai.xml').read_bytes()).entries),1)
                self.assertEqual(
                    feedparser.parse((output/'feeds/ai.xml').read_bytes()).entries[0].link,
                    feeds.BASE + 'topic/ai/week-of-2026-11-09/',
                )
                self.assertEqual(len(feedparser.parse((output/'feeds/science.xml').read_bytes()).entries),0)
                self.assertFalse((output/'data').exists())
                self.assertTrue((output/'index.html').exists())

    def test_preserves_existing_index(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory); week='week-of-2026-11-09.md'
            weekly=root/'weekly/2026'/week; weekly.parent.mkdir(parents=True)
            weekly.write_text('# Weekly edition\n')
            dates=(dt.datetime(2026,11,14,tzinfo=dt.timezone.utc),dt.datetime(2026,11,15,tzinfo=dt.timezone.utc))
            output=root/'output';output.mkdir()
            marker='<!doctype html><title>Magazine</title>'
            (output/'index.html').write_text(marker)
            with patch.object(feeds,'timestamps',return_value=dates):
                feeds.build(root,output)
            self.assertEqual((output/'index.html').read_text(), marker)
            self.assertTrue((output/'feed.xml').exists())
            self.assertTrue((output/'.nojekyll').exists())
