# NoticeBridge

Evidence-linked next steps for school and community notices.

NoticeBridge helps readers find what they need to do, when it is due and which details need clarification. Paste a notice, review the locally generated cards, and select **Check source** to highlight the exact original sentence. The browser never sends pasted text to cloud AI.

## Try it

**[Open the public demo](https://nicholas-afk.github.io/noticebridge/)** · **[Devpost project](https://devpost.com/software/noticebridge)**

Choose **School trip** for a complete example. You can also serve the `dist` directory locally:

```sh
python3 -m http.server 48137 --bind 127.0.0.1 --directory dist
```

Visit `http://127.0.0.1:48137`. Choose **School trip** for the complete workflow or **An unclear deadline** for uncertainty handling. All examples are fictional. This is a static application, with no API key, account, backend or paid inference service.

## What it does

- Runs a trained TF–IDF + logistic regression classifier on each sentence in the browser.
- Groups instructions, event details, contacts and background text.
- Extracts dates, times and currency amounts without inventing missing information.
- Preserves negative instructions such as “Do not bring cash.”
- Highlights uncertain categories, missing years, ambiguous numeric dates and unsupported relative deadlines.
- Resolves only “today” and “tomorrow”, and only against an explicitly supplied notice issue date.
- Keeps every sentence accessible, including those assigned to background.
- Offers a checklist and local text-file export. It does not save a history.
- Exposes optional WebMCP tools that use the same local action pipeline as the interface.

This is extractive information organization, not generative rewriting. Generic card headings are assigned by explicit rules; full instructions remain verbatim. Details from another sentence are not silently attached to an instruction.

## Model and reproducibility

The training corpus contains **245 authored synthetic English sentences**, including training-only template augmentation. The separate holdout contains **48 authored sentences** (12 per class). No real school notices, personal records or third-party training corpus are included.

| Metric | Result |
| --- | --- |
| Sentence category accuracy | 44/48 = 91.7% |
| Macro F1 | 0.917 |
| Instruction precision | 1.000 |
| Instruction recall | 10/12 = 83.3% |

These are results on a small synthetic benchmark, not estimates of accuracy on real notices. The holdout does not reuse exact training sentences or training augmentation templates, but comes from the same author and domain. Four errors and all scores are retained in `evaluation.json`. Scores are not calibrated reliability estimates.

Training uses unigrams and bigrams, sublinear term frequency, IDF weighting, L2 normalization, balanced class weights and logistic regression (`C=4.0`, seed 23). The trained vocabulary, IDF, coefficients and intercepts are exported to `dist/model.json`. `dist/engine.js` implements the same arithmetic without dependencies.

```sh
python3 -m pip install -r requirements.txt
python3 train.py
node test.mjs
```

`dataset.json` includes both splits and their provenance. `test.mjs` checks label and score parity between Python and JavaScript on every holdout sentence, source-span integrity, relative dates, numeric ambiguity, preserved negation, invalid dates and input limits.

## Architecture

```text
Pasted notice (tab memory only)
  -> sentence spans (exact start/end positions)
  -> local TF–IDF features + logistic regression
  -> category uncertainty and instruction-cue review gate
  -> exact date/time/amount extraction + ambiguity checks
  -> evidence-linked action cards + complete original notice
  -> optional local checklist / text export
```

Only local assets are requested by the application. The hosting provider receives ordinary page requests; pasted notices are not included in them. The app does not cache itself for offline startup, but inference can continue without network access after its assets load. Exported plans contain the original notice, so readers should choose where to save them.

## Accessibility and design

The interface uses visible labels, semantic headings, keyboard-accessible controls, a skip link, live result announcements, source highlighting, a single-column small-screen layout and reduced complexity. The direction is informed by [W3C cognitive accessibility guidance on clear step-by-step instructions](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o4p07-step-instructions/).

No accessibility certification or user study is claimed. Browser functional checks passed; automated screenshot capture and responsive viewport override were unavailable in the Codex browser session, so visual/mobile QA remains unverified.

## Limitations and next work

- English text only; no OCR, translation, document uploads or automatic web scraping.
- The small model can miss or misclassify unfamiliar wording.
- Sentence splitting is conservative and imperfect for unusual punctuation.
- Instructions that depend on another paragraph still require the reader to check the source.
- Dates are quoted; weekday references, missing years and numeric date formats remain unresolved.
- Intended for everyday notices, not legal, medical or emergency interpretation.
- No observed reduction in missed deadlines or reading effort is claimed.

Next steps are consented testing with readers and community staff, independently annotated real notices with identifying information removed, a larger held-out benchmark, confidence calibration, and accessibility testing on mobile devices and screen readers.

## Build disclosure

Created for the ML Empowerment Build Challenge 3.0 under the entrant's `ncywtanner` account. OpenAI Codex assisted with ideation, code, synthetic data, testing, diagrams and documentation. The submission does not imply a manually coded build or completed user research. No sponsor tool usage is claimed.

MIT licensed. See `LICENSE`.
