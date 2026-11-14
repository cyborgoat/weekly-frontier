import unittest
from scripts.frontier import monday, TZ
import datetime as dt
class Dates(unittest.TestCase):
    def test_monday(self):
        self.assertEqual(str(monday('2026-11-09')), '2026-11-09')
        with self.assertRaises(ValueError): monday('2026-11-10')
    def test_dst(self):
        self.assertNotEqual(dt.datetime(2026,7,1,tzinfo=TZ).utcoffset(),dt.datetime(2026,12,1,tzinfo=TZ).utcoffset())

from unittest.mock import patch, Mock
import tempfile
from pathlib import Path
from scripts import frontier
class Collection(unittest.TestCase):
    def test_feed_archive_and_dedup(self):
        xml=b'<rss version="2.0"><channel><title>Test</title><item><title>Story</title><link>https://example.org/a</link><pubDate>Mon, 09 Nov 2026 12:00:00 GMT</pubDate><description>News excerpt</description></item></channel></rss>'
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory); (root/'data/articles').mkdir(parents=True)
            with patch.object(frontier,'ROOT',root), patch.object(frontier,'SOURCES',[{'id':'test','topic':'science','url':'https://example.org/rss'}]), patch.object(frontier,'request',return_value=Mock(content=xml)):
                frontier.collect(); frontier.collect()
                self.assertEqual(len(frontier.records()),1)
    def test_all_sources_fail_prevents_generation(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(frontier,'ROOT',Path(directory)):
                with self.assertRaisesRegex(ValueError,'No successful collection'):
                    frontier.generate(monday('2026-11-09'))

class Completions(unittest.TestCase):
    def test_string_and_blocks(self):
        for content in ['{"stories":[]}', [{'type':'text','text':'{"stories":[]}'}]]:
            self.assertEqual(frontier.completion_text({'choices':[{'message':{'content':content},'finish_reason':'stop'}]}),'{"stories":[]}')
    def test_reasoning_is_not_final_answer(self):
        with self.assertRaisesRegex(ValueError,'no final answer'):
            frontier.completion_text({'choices':[{'message':{'reasoning_content':'private reasoning'},'finish_reason':'stop'}]})
    def test_token_exhaustion(self):
        with self.assertRaisesRegex(ValueError,'token budget'):
            frontier.completion_text({'choices':[{'message':{},'finish_reason':'length'}]})
    def test_missing_choices(self):
        with self.assertRaisesRegex(ValueError,'no choices'):
            frontier.completion_text({'error':{'message':'do not print'}})

class CandidateSelection(unittest.TestCase):
    def test_volume_does_not_crowd_out_sources(self):
        rows=[dict(source='arxiv',url=f'https://example.org/{i}',published='2026-11-13') for i in range(100)]
        rows.append(dict(source='lab',url='https://example.org/lab',published='2026-11-12'))
        selected=frontier.select_candidates(rows,4)
        self.assertEqual(len(selected),4)
        self.assertIn('lab',[r['source'] for r in selected])
    def test_duplicate_urls_not_selected_twice(self):
        row=dict(source='lab',url='https://example.org/a',published='2026-11-12')
        self.assertEqual(frontier.select_candidates([row,row]),[row])

class ReportingDates(unittest.TestCase):
    def test_invalid_and_extreme_dates_are_excluded(self):
        start=monday('2026-11-09'); end=start+dt.timedelta(days=7)
        for value in ['0001-01-01T00:00:00+00:00','invalid',None,'2026-11-10T00:00:00']:
            self.assertFalse(frontier.in_reporting_week(value,start,end))
        self.assertTrue(frontier.in_reporting_week('2026-11-10T00:00:00+00:00',start,end))
