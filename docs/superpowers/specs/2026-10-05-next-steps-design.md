# NoticeBridge next steps

The entrant explicitly delegates idea selection, execution, hosting and draft updates. This design is selected autonomously under that instruction. The purpose remains helping readers act on English school and community notices while checking the original wording.

## Selected approach

Add a Next steps view beside Checklist and Source. It offers all-day calendar reminders and an editable question draft. This adds useful follow-through without cloud processing or hiding uncertainty. Automatic calendar-account writes would add authentication and unverifiable date assumptions; generative message writing would weaken source traceability. Neither is needed.

## Calendar reminders

Readers choose reminders for instruction, uncertain or event excerpts. Suggest a date only from that same sentence: valid ISO, named month with a four-digit year, or an already resolved today/tomorrow reference. Missing-year dates, numeric day/month formats and weekdays receive no suggestion. Multiple distinct candidates leave the date blank. Every saved reminder requires a valid date and an explicit reader confirmation. Editing the date withdraws the saved reminder until reconfirmed.

Export only saved, confirmed reminders as an RFC 5545 .ics file. Each entry is all-day, has an exclusive next-day end, has no invented time or alarm, and preserves its complete sentence and review flags in the description. Escape calendar text and fold lines by UTF-8 bytes. A file export does not write to a calendar account; readers import it themselves. Reject invalid dates, unknown excerpt IDs, unconfirmed entries and empty exports.

## Questions

Build a local, editable draft from the existing review flags. Each question includes the exact sentence. Frame uncertain classification as a request to confirm whether action is required, and missing/ambiguous dates as requests for clarification. The draft is never sent by the app. Offer a local .txt export; include a note that the reader must review it. Changing the notice disables reminder, question and plan exports until analysis is refreshed. Refresh and Clear remove reminders and drafts. Keep state in tab memory only.

## Interface and verification

Use the existing restrained document style, flat rows, visible labels and semantic controls. Keep the initial checklist uncluttered. At narrow widths tabs wrap and reminder inputs stack. Existing full-source links and review progress remain intact.

Test independent date fixtures, leap-day/month/year rollover, malicious calendar newlines, UTF-8 folding, rejection paths and exact sentence inclusion. Verify the real browser workflow, stale protection, reset and published GitHub Pages version. Retain the existing model and its honest synthetic benchmark. Update README, Devpost story and actual screenshots. Final prize entry and binding acceptance remain a user handoff.
