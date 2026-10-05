# Evaluation report

Reproduced 6 October 2026 for application 1.4.2 / model 1.1.0. This presentation release changes no model weights, extraction rules or serializer. `node audit.mjs` reproduced the committed comparison with no artifact difference.

## Conditions and baselines

The original 1.0.0 model (245 authored synthetic training sentences) is preserved in `docs/model-audit/baseline/`. Current 1.1.0 uses 329 authored synthetic sentences: action 146, event 67, contact 62, background 54. Both use the same four-class TF–IDF/logistic architecture, with the 0.55 score threshold and minimum two known features retained. The comparison uses the preserved baseline engine versus the current engine: the latter adds Unicode-aware token boundaries, own-property vocabulary lookup and a review gate when fewer than half of distinct words are familiar. Training and these pipeline changes are evaluated together; the result does not isolate a training-only effect. A separate deliberately simple anchored-instruction rule is also measured; it is not a general-purpose competitor or exhaustive rule system.

The 48 legacy examples were previously inspected and authored by the same developer as training. No exact or normalized duplicates were found, but close paraphrases/domain overlap exist (original maximum TF–IDF cosine 0.754). This is a development check, not an untouched holdout.

The 40 authored challenge inputs were frozen in commit `c9c99cf` before retraining. Observed failure patterns informed 84 added training examples. No check examples were copied into training, but this is still development evidence, not independent validation. Five attributed public instruction excerpts from three organizations were selected by the developer; the instruction-only convenience sample cannot estimate precision or representative accuracy. Provenance and individual predictions are in the audit artifacts and model card.

## Results, including regressions

| Condition | Original | Current |
| --- | ---: | ---: |
| Legacy category matches | 44/48 | 45/48 |
| Legacy raw instruction recall | 10/12 | 11/12 |
| Legacy instructions listed | 6/12 | 8/12 |
| Legacy category-review inputs | 19/48 | 13/48 |
| Authored challenge category matches | 30/40 | 35/40 |
| Authored raw instruction recall | 14/20 | 18/20 |
| Authored false raw instruction predictions | 1 | 3 |
| Authored raw instruction precision | 14/15 = 93.3% | 18/21 = 85.7% |
| Authored instructions listed | 2/20 | 10/20 |
| Authored category-review inputs | 31/40 | 19/40 |
| Public instruction labels | 4/5 | 5/5 |
| Public instructions listed | 2/5 | 3/5 |

The anchored rule finds 5/12 legacy instructions, 2/20 authored instructions and 2/5 public instructions, with no false instruction predictions in these samples. That narrow rule misses varied wording; its lower recall alone does not establish superiority over larger real tools.

Raw category matches are distinct from workflow placement. A score below 0.55, fewer than two known features or vocabulary coverage below 50% can keep a raw action prediction in **Review**. There is no separate category-margin gate. All three current authored false raw action predictions remain Review; none is confidently listed. No audited expected instruction is hidden in background after the review gates. A reader must still inspect the full source. Reminder confirmation is entirely separate and user-controlled.

**Unfavorable results:** raw action precision worsened; two previously correct legacy event/contact categories regress after retraining and now require Review. The legacy booking-required case remains wrong in Review. Optional registration and a jacket sentence have wrong raw labels. A passive signed-consent case remains Review despite a correct raw action prediction. Every error is retained in [MODEL_CARD.md](MODEL_CARD.md), not removed from the reported denominator. No claim of calibrated confidence, representative real-world accuracy, reduced reading effort or prevented missed deadlines follows from this evidence.

## Reproduce and inspect

```sh
npm ci
python3 -m pip install -r requirements.txt
python3 audit-python.py
node audit.mjs
npm test
npm run build
```

`audit-python.py` verifies exported models against exact re-fitted scikit-learn parameters and writes hashes/overlap evidence to `docs/model-audit/python-audit.json`. `audit.mjs` writes baseline/current predictions, rule baseline and workflow counts to `docs/model-audit/comparison.json`. JavaScript/Python labels and scores agree on all 93 check inputs plus eight accent/mixed-script probes within 1e-10. Files `audit-cases.json` and `training-additions.json` preserve challenge conditions and supplement provenance.

Regression tests cover spans, negation, conservative dates, input bounds, clarification drafts, calendar safety, 100 date cases, eight model tests and ten real-runtime workflow tests. Browser checks separately exercise actual controls, downloads, stale state and responsive layout; automated semantic checks do not verify screen-reader speech. See [release evidence](NOTICEBRIDGE_STATE.md) and [accessibility/export audit](docs/accessibility-export-audit.md).

The next consequential evaluation requires independently annotated, de-identified notices, annotation disagreement, unseen language and consented reader studies. None has been performed. More synthetic examples are not a substitute.
