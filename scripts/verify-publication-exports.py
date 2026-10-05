"""Parse actual 1.4.2 fictional-notice downloads. Requires icalendar==6.3.2."""
from pathlib import Path
from datetime import date
import hashlib
import json
import icalendar

root = Path(__file__).resolve().parents[1]
fixtures = root / 'docs/verification/publication-exports'
report = json.loads((root / 'docs/verification/2026-10-06-publication-downloads.json').read_text())
for name, expected in report['files'].items():
    assert hashlib.sha256((fixtures / name).read_bytes()).hexdigest() == expected
raw = (fixtures / 'school-trip.ics').read_bytes()
assert raw.endswith(b'\r\n') and b'\n' not in raw.replace(b'\r\n', b'')
assert all(len(line) <= 75 for line in raw.split(b'\r\n'))
calendar = icalendar.Calendar.from_ical(raw)
assert not calendar.errors
entries = calendar.walk('VEVENT')
assert len(entries) == 1
entry = entries[0]
assert not entry.errors
assert type(entry.decoded('DTSTART')) is date
assert entry.decoded('DTSTART') == date(2026, 10, 9)
assert entry.decoded('DTEND') == date(2026, 10, 10)
assert entry['DTSTART'].params['VALUE'] == 'DATE'
assert 'TZID' not in entry['DTSTART'].params and not entry.walk('VALARM')
quote = 'Please return the signed consent form to your teacher by 9 October 2026.'
assert quote in str(entry['DESCRIPTION'])
plan = (fixtures / 'school-trip-plan.txt').read_text()
assert '[x] 1. ' + quote in plan and 'ORIGINAL NOTICE' in plan and '2026-10-09' in plan
questions = (fixtures / 'edited-questions.txt').read_text()
assert questions == ('Hello,\nThe notice says: Please choose a session on 9 or 12 October 2026.\n'
                     'Which session date should I choose?\nCan I bring a support person?\nThank you.')
print('1.4.2 export fixture hashes, quotations, reader state and all-day calendar parse verified.')

# Recheck the separate public-visitor artifacts without using a calendar account.
live = root / 'docs/verification/publication-live-exports'
live_report = json.loads((root / 'docs/verification/2026-10-06-publication-live-downloads.json').read_text())
for name, expected in live_report['files'].items():
    assert hashlib.sha256((live / name).read_bytes()).hexdigest() == expected
live_raw = (live / 'school-trip.ics').read_bytes()
assert live_raw.endswith(b'\r\n') and b'\n' not in live_raw.replace(b'\r\n', b'')
assert all(len(line) <= 75 for line in live_raw.split(b'\r\n'))
live_calendar = icalendar.Calendar.from_ical(live_raw)
assert not live_calendar.errors
live_entries = live_calendar.walk('VEVENT')
assert len(live_entries) == 1
live_entry = live_entries[0]
assert not live_entry.errors and type(live_entry.decoded('DTSTART')) is date
assert live_entry.decoded('DTSTART') == date(2026, 10, 9)
assert live_entry.decoded('DTEND') == date(2026, 10, 10)
assert 'TZID' not in live_entry['DTSTART'].params and not live_entry.walk('VALARM')
assert quote in str(live_entry['DESCRIPTION'])
assert (live / 'school-trip-plan.txt').read_text() == plan
assert (live / 'edited-questions.txt').read_text() == ('Please confirm that the form deadline is 9 October.\n'
                                                     'Can I bring a support person?')
print('Public-visitor exports also verified; calendar-client import remains unverified.')
