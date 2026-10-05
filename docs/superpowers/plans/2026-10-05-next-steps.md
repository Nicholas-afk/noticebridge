# NoticeBridge Next Steps Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. The user has explicitly delegated decisions and execution autonomously.

**Goal:** Turn reviewed excerpts into date-confirmed calendar reminders and source-linked clarification drafts.

**Architecture:** Pure follow-up helpers consume the existing analysis result. The browser controls own ephemeral reader confirmations and drafts. Existing stale detection gates all exports.

**Tech Stack:** Dependency-free JavaScript, HTML/CSS, Node tests; GitHub Pages primary host.

**Spec:** docs/superpowers/specs/2026-10-05-next-steps-design.md

## Global Constraints

- No network transmission of notices, persistence, new dependencies, automatic calendar writes or message sending.
- No inferred year, numeric date order, weekday, time or alarm.
- Save requires a valid date and explicit confirmation; editing withdraws a saved reminder.
- Source edits gate all exports; analysis refresh and Clear discard follow-up state.

## Review Focus

- Invalid leap days and 31 April must not become calendar suggestions or saved events.
- Multiple dates must not silently choose one.
- Text containing CRLF, commas, semicolons and non-ASCII characters must remain data in the calendar file.
- Stale input must block new saves and exports, including already saved reminders.
- Reader-edited question drafts must survive switching views but be removed on refresh and Clear.

### Task 1: Follow-up helpers

**Files:** dist/followup.js, followup.test.mjs, package.json, prepare.mjs

**Interfaces:** `dateSuggestions(card)` returns `{date,source}[]`; `buildCalendar(result, entries, {now, uidPrefix})` returns an ICS string, with entries `{id,date,confirmed}`; `buildQuestions(result)` returns a source-linked draft string.

- [x] Write tests with literal expected dates, calendar properties, byte limits and question excerpts. Run and observe missing-feature failure.
- [x] Implement conservative helpers. Calendar validates entries and serializes escaped, folded text.
- [x] Run follow-up tests and the full existing suite. Add new module fingerprinting to prepare.mjs.
- [x] Commit the helpers and tests.

### Task 2: Next steps interaction

**Files:** dist/app.js, dist/index.html, dist/style.css

**Interfaces:** consume Task 1 helpers; saved entries live in a Map, draft in the visible textarea. `isStale()` gates all mutation and export controls.

- [x] Browser probe current UI: Next steps absent (expected missing feature).
- [x] Add labeled date and confirmation controls, saved counts, calendar download and editable question draft download. Clear/refresh reset the state; changing a reminder date withdraws confirmation.
- [x] Verify browser school-trip date suggestion, explicit confirmation, edit-withdrawal, missing-date blank, source edit gates, view-switch preservation, Clear and refresh. Build and full suite must pass.
- [x] Commit the interface.

### Task 3: Review, release and submission draft

**Files:** README.md, SUBMISSION.md, media/noticebridge-live-demo.jpg; outputs status and source archive

- [x] Obtain an independent whole-change review; fix important findings with regression tests.
- [x] Update accurate capability descriptions and verification limits.
- [x] Integrate verified commits into main; publish dist to gh-pages. Verify build success and live Next steps flow.
- [x] Save a real interface screenshot, update Devpost description and gallery, verify saved draft. Leave final agreement and prize submission for the user.
