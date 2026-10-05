# NoticeBridge classifier 1.1.0

Audited 6 October 2026. Current app release 1.4.2; model weights and extraction rules are unchanged from 1.4.0. This is an English text organizer for everyday notices, with exact source extracts and human review. It does not establish whether an instruction applies to a particular reader, understand an entire document, or confirm a reminder.

## What the model contributes

The trained four-class TF–IDF/logistic classifier groups text into action, event, contact and background. This is a modest supervised ML baseline, not a new ML architecture or a language model. Date extraction, headings and reminders use explicit rules. The reader supplies and confirms reminder dates; edited question drafts and review marks remain authoritative while the source is unchanged. Inference is local after assets load, with no API key or transmission of pasted notices.

An action includes explicit instructions, conditions, restrictions and exemptions. Contact means a route for questions or help; a required operational notification belongs to action. Event includes logistics, cost and availability. Background includes historical actions and courtesy text. Conditional instructions are quoted whole, not turned into unconditional demands. These labels were assigned by the developer without independent adjudication; some boundaries are debatable.

## Audit of the original 44/48 claim

The preserved baseline is model 1.0.0 from stable app 1.3.0, source commit `b07d1d2bc6410934cff8a0caf9a295082b10a6ad`. The original `train.py` regenerated `model.json`, `dataset.json` and `evaluation.json` byte for byte with Python 3.14 and scikit-learn 1.9.0. Baseline source, engine and artifacts are retained in `docs/model-audit/baseline/`; hashes are in `docs/model-audit/python-audit.json`.

Its 245 authored training examples contain 110 action, 55 event, 50 contact and 30 background examples, including many repeated training templates. Its 48 authored test examples contain 12 of each class. The result was 44/48 categories, macro F1 0.917, action recall 10/12, action precision 10/10. The four errors were:

- `Tell reception if you require a large print letter.` — action predicted contact, score 0.572.
- `Bookings are required by 17 November at 4 pm.` — action predicted event, 0.457.
- `The scheme builds connections between neighbours.` — background predicted event, 0.618.
- `Kind regards from the library team.` — background predicted event, 0.346.

There is no exact or ASCII-word-normalized training/evaluation intersection. This does **not** prove independent evaluation: the same developer authored both splits; the domain and phrasing overlap. The nearest original pair has cosine 0.754: “The meal is included in the price.” / “Transport is included in the cost.” The full nearest-neighbour lists are retained, rather than treating exact deduplication as protection against all leakage. The original set has now been inspected and used during development; it is a **legacy development check**, not a fresh blind holdout.

## Chosen improvement and comparison conditions

The consequential weakness was sparse language coverage and excessive category review, not a shortage of features. We added **84 synthetic training examples** covering passive requirements, conditional requests, operational notifications, exemptions and past-tense distractors. There are now 329 training examples: action 146, event 67, contact 62, background 54. No evaluation text or public excerpt was copied into training. General failure patterns informed the supplement, so the challenge results remain development evidence.

`audit-cases.json` was committed before retraining at `c9c99cf`. It contains 40 authored challenges and five short, attributed public excerpts from three organizations. All five public examples are instructions, mostly library language: they cannot measure category precision or generalize to real notices. The developer selected and labeled them; this is a convenience check, not an independent field evaluation. Two authored contact inputs contain a question plus a support sentence. Raw category metrics classify each complete input; the workflow metrics run actual sentence splitting and count an input as requiring category review if any of its spans does. No claim about representative prevalence follows from these counts.

Both models use identical features, `C=4.0`, balanced class weights, seed 23, and max 1,500 iterations. The existing score threshold 0.55 and minimum two known features were retained. We also tested the original anchored instruction cue as a simple **binary** rule baseline; it does not classify the other three categories. Comparisons use the preserved old engine for the baseline and current engine for the candidate.

| Check | Original model | Current model |
| --- | ---: | ---: |
| Legacy categories | 44/48 | 45/48 |
| Legacy raw action recall | 10/12 | 11/12 |
| Legacy category-review inputs | 19/48 | 13/48 |
| Authored challenge categories | 30/40 | 35/40 |
| Authored raw action recall | 14/20 | 18/20 |
| Authored raw action precision | 14/15 (93.3%) | 18/21 (85.7%) |
| Authored instructions listed in Instructions | 2/20 | 10/20 |
| Authored category-review inputs | 31/40 | 19/40 |
| Public raw action labels | 4/5 | 5/5 |
| Public instructions listed in Instructions | 2/5 | 3/5 |

The instruction-only rule detects 5/12 legacy, 2/20 authored and 2/5 public instructions, with zero false positives in these samples. This is a limited comparison against our own cue, not a benchmark against commercial tools. Neither app version hid an action in Background in these checks. “Listed” means an instruction category, **not** a confirmed date or an absence of date warnings. Category-review counts exclude unrelated date/amount warnings.

## Unfavorable results and decision

The new model loses two previously correct legacy categories: `Families will meet in the assembly room.` and `Address any questions to the programme organiser.` become background predictions. Their low scores still route them to Review. `Bookings are required by 17 November at 4 pm.` remains wrongly predicted event and remains Review.

On the authored challenge, false raw action predictions increase from one to three: a historical learning statement, an assistance route, and a ticket-admission fact. All three remain Review; none is confidently listed as an instruction. `Families can register if they wish.` and the waterproof-jacket requirement still have wrong raw categories. The signed-consent requirement remains Review despite a correct raw action label. An initial regression expectation that every tested passive requirement would become confident was too strong; the confidence threshold was preserved, and that sentence is explicitly tested as uncertain.

We retain the candidate because it lists eight more real instructions in the authored check while all additional false raw action predictions are stopped by the unchanged uncertainty threshold. This tradeoff is specific to these checks. It does not establish production superiority. The vocabulary safeguard adds one category-review input to the legacy check and one to the authored check compared with retraining alone; this extra review is an intentional conservative cost.

## Uncertainty and implementation fixes

Scores are uncalibrated category scores. They are not probabilities that an instruction is correct or complete. A sentence with fewer than half of its distinct ASCII words in the training vocabulary now gets an explicit unfamiliar-wording note even when a few familiar words produce a high score. The 50% threshold is a heuristic, not a fitted calibration boundary. It can flag proper names and technical terms unnecessarily and can miss unfamiliar meanings expressed with familiar words. It does not validate mixed-language input.

An inherited-object-property lookup bug also made the ordinary word `constructor` corrupt JavaScript scores. Vocabulary lookups now require an own property. Independent review also found Python/JavaScript token-boundary differences beside accented names: the browser incorrectly extracted `no` from `Noël` and `am`/`lie` from `Amélie`. Unicode-aware browser boundaries now match the existing Python ASCII-token contract without transliteration or retraining. Eight additional accent/mixed-script probes check parity; they establish consistency, not multilingual understanding. Regression tests verify finite scores and source-preserving review of unfamiliar text. Warnings flow through the existing cards, reminder notes, question draft and export; calendar confirmation is unchanged.

## Reproduction and evidence

```sh
python3 -m pip install -r requirements.txt
python3 train.py
npm run audit
npm run build
npm ci
npm test
```

`train.py` writes the model, training split and legacy evaluation. `audit-python.py` re-fits both saved splits and verifies their exported vocabulary, IDF, weights and intercepts exactly. It records environment, hashes, normalized overlap, nearest neighbours and Python predictions. `audit.mjs` records all 93 predictions, errors, confusion matrices and downstream counts for both versions plus the rule baseline. The browser engine matches Python labels/scores on all 93 inputs within 1e-10. The original 100 date regressions, source integrity and follow-up checks remain required. Browser evidence is saved under `docs/verification/`.

No real-world accuracy, calibrated confidence, reading-effort reduction, deadline reduction, user study or accessibility certification is claimed. The next evidence that could change the deployment decision is an independently annotated, de-identified notice set plus consented reader testing. Freeze that set before future model tuning, include non-actions and diverse sources, measure missed instructions and unnecessary review, and report disagreement and regressions.

## Current release presentation

Application 1.4.2 clarifies that Reviewed means wording checked rather than task completed, and labels repeat analysis Review checklist. Model 1.1.0 and extraction/serialization are unchanged. The fresh comparison is in [EVALUATION.md](EVALUATION.md); data boundaries and user authority are in [ARCHITECTURE.md](ARCHITECTURE.md). [DEMO.md](DEMO.md) uses actual fictional-notice captures and makes no accuracy or reader-impact claim.
