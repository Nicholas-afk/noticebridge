"""Independent parser checks for actual fictional-notice browser downloads.

Run with Python and icalendar==6.3.2. No browser or calendar account is used.
"""
from pathlib import Path
from datetime import date
import hashlib
import json
import icalendar

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / 'docs/verification/accessibility-exports'
events_by_file = {}
calendars = []
for name, expected in [
    ('school-trip.ics', [(date(2026, 10, 9), date(2026, 10, 10))]),
    ('school-trip-repeat.ics', [(date(2026, 10, 9), date(2026, 10, 10))]),
    ('escaping-boundaries.ics', [(date(2026, 12, 31), date(2027, 1, 1)),
                               (date(2028, 2, 29), date(2028, 3, 1))]),
    ('server-stopped.ics', [(date(2026, 10, 9), date(2026, 10, 10))]),
]:
    raw = (FIXTURES / name).read_bytes()
    assert raw.endswith(b'\r\n') and b'\n' not in raw.replace(b'\r\n', b'')
    assert all(len(line) <= 75 for line in raw.split(b'\r\n'))
    calendar = icalendar.Calendar.from_ical(raw)
    assert not calendar.errors
    events = calendar.walk('VEVENT')
    assert len(events) == len(expected)
    for event, (start, end) in zip(events, expected):
        assert not event.errors
        assert type(event.decoded('DTSTART')) is date
        assert event.decoded('DTSTART') == start
        assert event.decoded('DTEND') == end
        assert event['DTSTART'].params['VALUE'] == 'DATE'
        assert 'TZID' not in event['DTSTART'].params
        assert not event.walk('VALARM')
        assert event.decoded('DTSTAMP').utcoffset().total_seconds() == 0
        assert 'Original sentence' in str(event['DESCRIPTION'])
        assert 'not an inferred event time' in str(event['DESCRIPTION'])
    events_by_file[name] = events
    calendars.append({'fixture': name, 'bytes': len(raw),
                      'sha256': hashlib.sha256(raw).hexdigest(),
                      'dates': [[str(a), str(b)] for a, b in expected],
                      'parse_errors': [], 'all_day': True, 'alarm': False,
                      'TZID': False, 'max_line_bytes': max(map(len, raw.split(b'\r\n')))})

assert events_by_file['school-trip.ics'][0]['UID'] == events_by_file['school-trip-repeat.ics'][0]['UID']
journeys = [json.loads(line) for line in (ROOT / 'docs/verification/2026-10-06-accessibility-journey.jsonl').read_text().splitlines()]
boundary = next(row for row in journeys if row['stage'] == 'calendar-boundary-files-downloaded')
for event, row in zip(events_by_file['escaping-boundaries.ics'], boundary['dates']):
    assert row['source'] in str(event['DESCRIPTION'])
    assert row['confirmed'] is True
    assert row['date'] == str(event.decoded('DTSTART'))
assert (FIXTURES / 'escaping-questions.txt').read_text() == boundary['questions']
assert boundary['source'] in (FIXTURES / 'escaping-plan.txt').read_text()
assert (FIXTURES / 'school-trip-questions.txt').read_text() == 'Reader edited: is the venue accessible?\nPlease confirm, thank you.'
plan = (FIXTURES / 'school-trip-plan.txt').read_text()
assert '[x] 1. Please return the signed consent form' in plan and '2026-10-09' in plan and 'ORIGINAL NOTICE' in plan

report = {'parser': 'icalendar ' + icalendar.__version__, 'calendars': calendars,
          'source_round_trip_with_punctuation_and_unicode': True,
          'questions_byte_equal_to_reader_edits': True,
          'checklist_retains_original_notice_and_review_progress': True,
          'repeated_export_uid_equal': True,
          'calendar_client_import': 'not performed; parser compatibility only'}
output = ROOT / 'docs/verification/2026-10-06-accessibility-export-parser.json'
output.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
