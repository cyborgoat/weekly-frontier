"""Build publication feeds from committed reader pages; never publish raw archives."""
import argparse
import datetime as dt
from email.utils import format_datetime
from html import escape
from pathlib import Path
import re
import subprocess
from urllib.parse import urljoin
import uuid
import xml.etree.ElementTree as ET
import markdown

ROOT = Path(__file__).resolve().parents[1]
REPO = 'https://github.com/cyborgoat/weekly-frontier'
BASE = 'https://www.cyborgoat.com/weekly-frontier/'
TOPICS = ['ai', 'technology', 'politics', 'finance', 'science', 'business']
ATOM = 'http://www.w3.org/2005/Atom'
ET.register_namespace('atom', ATOM)


def timestamps(root, path):
    result = subprocess.run(['git', 'log', '--follow', '--format=%cI', '--', path.relative_to(root).as_posix()], cwd=root, capture_output=True, text=True, check=True)
    dates = [dt.datetime.fromisoformat(line) for line in result.stdout.splitlines()]
    if not dates:
        raise ValueError(f'Feed entries must be committed: {path.relative_to(root)}')
    return min(dates), max(dates)


def rendered(root, path):
    text = path.read_text()
    # Compatibility with older editions; diagnostics never enter feeds.
    text = text.split('\nCollection reports:')[0]
    text = re.sub(r'^Generated:.*\n', '', text, flags=re.M)
    def absolute(match):
        label, href = match.groups()
        if href.startswith(('https://', 'http://', '#')):
            return match[0]
        target = (path.parent / href).resolve()
        relative = target.relative_to(root.resolve()).as_posix()
        return f'[{label}]({REPO}/blob/main/{relative})'
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', absolute, text)
    return markdown.markdown(text)


def entries(root, topic=None):
    directory = root/'topics'/topic if topic else root/'weekly'
    result = []
    for path in sorted(directory.glob('*/week-of-*.md'), reverse=True)[:52]:
        week = dt.date.fromisoformat(path.stem.removeprefix('week-of-'))
        if week.weekday() != 0: raise ValueError(f'Invalid reporting week: {path}')
        published, updated = timestamps(root, path)
        relative = path.relative_to(root).as_posix()
        title = ('AI' if topic == 'ai' else topic.title()) if topic else 'Weekly Frontier'
        content = rendered(root, path)
        if not topic:
            # Include topic briefings so the main feed is readable without leaving the reader.
            for name in TOPICS:
                briefing = root/'topics'/name/str(week.year)/path.name
                if briefing.exists():
                    content += '<hr>' + rendered(root, briefing)
                    _, changed = timestamps(root, briefing)
                    updated = max(updated, changed)
        result.append(dict(id='urn:uuid:'+str(uuid.uuid5(uuid.NAMESPACE_URL, REPO+'/'+relative)),
                           title=f'{title} · Week of {week:%B} {week.day}, {week.year}',
                           url=REPO+'/blob/main/'+relative, content=content,
                           published=published, updated=updated))
    return result


def element(parent, tag, text=None, **attrs):
    child = ET.SubElement(parent, tag, attrs)
    if text is not None: child.text = text
    return child


def write_feeds(output, stem, title, items, base):
    atom_url = urljoin(base, stem+'.xml')
    feed = ET.Element(f'{{{ATOM}}}feed')
    for tag, value in [('id',atom_url), ('title',title), ('updated',max((x['updated'] for x in items), default=dt.datetime(2026,1,1,tzinfo=dt.timezone.utc)).isoformat())]:
        element(feed,f'{{{ATOM}}}{tag}',value)
    element(feed,f'{{{ATOM}}}link',href=atom_url,rel='self',type='application/atom+xml')
    element(feed,f'{{{ATOM}}}link',href=REPO,rel='alternate')
    author=element(feed,f'{{{ATOM}}}author');element(author,f'{{{ATOM}}}name','Weekly Frontier')
    channel=element(ET.Element('rss',version='2.0'),'channel')
    for tag,value in [('title',title),('link',REPO),('description','Weekly briefings with original source links.'),('language','en')]: element(channel,tag,value)
    element(channel,f'{{{ATOM}}}link',href=urljoin(base,stem+'.rss.xml'),rel='self',type='application/rss+xml')
    for item in items:
        entry=element(feed,f'{{{ATOM}}}entry')
        for tag in ['id','title']: element(entry,f'{{{ATOM}}}{tag}',item[tag])
        for tag in ['published','updated']: element(entry,f'{{{ATOM}}}{tag}',item[tag].isoformat())
        element(entry,f'{{{ATOM}}}link',href=item['url'])
        element(entry,f'{{{ATOM}}}content',item['content'],type='html')
        rss_item=element(channel,'item')
        for tag,value in [('title',item['title']),('link',item['url']),('pubDate',format_datetime(item['published'])),('description',item['content'])]: element(rss_item,tag,value)
        element(rss_item,'guid',item['id'],isPermaLink='false')
    rss=ET.Element('rss',version='2.0');rss.append(channel)
    for name,tree in [(stem+'.xml',feed),(stem+'.rss.xml',rss)]:
        path=output/name;path.parent.mkdir(parents=True,exist_ok=True)
        ET.ElementTree(tree).write(path,encoding='utf-8',xml_declaration=True)


def build(root=ROOT, output=None, base=BASE):
    output=output or root/'.cache/feed-site'
    if not base.startswith('https://') or not base.endswith('/'): raise ValueError('Base URL must be HTTPS and end with /')
    links=[]
    for topic in [None,*TOPICS]:
        title='Weekly Frontier' + (f' — {"AI" if topic=="ai" else topic.title()}' if topic else '')
        stem=f'feeds/{topic}' if topic else 'feed'
        write_feeds(output,stem,title,entries(root,topic),base)
        links.append(f'<li>{escape(title)}: <a href="{stem}.xml">Atom</a> · <a href="{stem}.rss.xml">RSS</a></li>')
    (output/'index.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>Subscribe to Weekly Frontier</title><h1>Subscribe to Weekly Frontier</h1><p>Copy a feed link into your feed reader. New editions appear after publication.</p><ul>'+''.join(links)+f'</ul><p><a href="{REPO}">Read the archive</a></p></html>')
    (output/'.nojekyll').touch()
    print(f'Built 14 feeds in {output}')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path);parser.add_argument('--base-url',default=BASE)
    args=parser.parse_args();build(output=args.output,base=args.base_url)
