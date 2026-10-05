## One notice, four instructions

**[Try NoticeBridge](https://nicholas-afk.github.io/noticebridge/)** · **[Watch the 52-second walkthrough](https://nicholas-afk.github.io/noticebridge/media/noticebridge-demo.mp4)** · [Source and reproducible release](https://github.com/Nicholas-afk/noticebridge/releases/tag/v1.4.2)

Choose **School trip** to load and analyze a fictional notice containing:

> Please return the signed consent form to your teacher by 9 October 2026. Pay the $12 trip fee through the school portal by 9 October 2026. Bring a packed lunch and a bottle of water. Do not bring cash on the day of the visit.

The application lists these four sentences as four instructions, without rewriting them. **Check source** highlights the selected sentence in the complete original notice. A reader can check the consent deadline, preserve the “Do not bring cash” restriction, and ask about missing information before choosing a reminder.

## Problem, users and intended value

A school or community notice mixes instructions, event details, contacts and exceptions. Parents and carers, students organizing club activities, and community members preparing for workshops may need to find several next steps in one paragraph. NoticeBridge explores a focused response: a local, source-linked reading checklist that makes checking part of the workflow.

The intended benefit is less effort finding instructions and fewer guesses about dates. This remains a hypothesis: no reader study, user testimonial, measured time saving or reduction in missed deadlines is claimed. It is an English-language prototype for everyday notices.

## How the reader stays in control

1. **Paste the complete notice or load an example.** A compact classifier groups instructions, details, contacts and background. Every sentence remains available, including ones the model does not promote.
2. **Review exact wording.** Each card links to its original sentence. “Reviewed” means wording checked, not task completed. Read the full source too: classification can miss instructions.
3. **Resolve uncertainty before reminders.** A valid full date in the same sentence may be suggested, but confirmation starts unchecked. “9 & 12 October” is a list, “9 or 12 October” alternatives, “9 and/or 12 October” one or both, and “9 through 12 October” a range. Each stays unresolved with a matching review note and question; the app does not choose an endpoint. Invalid dates such as “31 November 2026” also remain unresolved. An optional issue date supports only “today” and “tomorrow”.
4. **Take away a checked plan.** Download a text checklist, an editable clarification draft, or reader-confirmed all-day calendar entries with source quotations. Nothing is sent to the sender or written to a calendar account. Editing or unchecking a saved date withdraws that reminder until confirmed again.

Identical-source analysis preserves review marks, edited questions and reminders. Changed source text or issue date pauses old work and all exports; successful updated analysis resets it. Exact source reversion restores the matching checklist. Clear or reload discards tab progress. Files already downloaded or imported cannot be withdrawn.

## Technical contribution and challenges

Python/scikit-learn trains a four-class logistic regression model on unigram and bigram TF–IDF features. Model 1.1.0 uses **329 authored synthetic sentences**. Vocabulary, IDF values, coefficients and intercepts are exported as JSON; dependency-free JavaScript reproduces inference locally. Labels and scores agree with Python on 93 audited inputs plus eight token-boundary probes within 1e-10. Source offsets survive sentence splitting and rendering, so cards point to exact original substrings.

Rules add visible review prompts for unfamiliar vocabulary, instruction cues and uncertain dates. Model scores are uncalibrated, and lexical classification cannot reliably understand cross-sentence dependencies. The audit exposed weak language coverage and corrupted vocabulary lookup; diversified training, Unicode-aware boundaries, safer feature lookup and a vocabulary-coverage review gate improved the existing task. The reported comparison measures these pipeline changes together, not retraining alone.

A separate calendar module validates confirmed dates, uses all-day starts with exclusive next-day ends, escapes text and folds lines by UTF-8 bytes. Clarification questions are explicit templates tied to visible review flags. Reader edits and confirmations remain authoritative. [Architecture and data boundaries](https://github.com/Nicholas-afk/noticebridge/blob/main/ARCHITECTURE.md).

The implementation uses HTML, CSS, JavaScript, Python and scikit-learn, hosted on GitHub Pages. No account, API key or cloud inference is required. Notice text and progress stay in tab memory; there is no notice upload, analytics or saved history. The host receives ordinary page/asset requests. Offline startup is unsupported.

## Evaluation: gains and unfavorable results

The original **44/48** synthetic result was reproduced and audited. No exact or normalized training/check duplicates were found, but same-author paraphrase and domain overlap exists. The 40-input authored challenge was frozen before retraining; its observed errors informed added training examples. These are development checks, not independent real-world accuracy.

| Check | Original pipeline | Current pipeline |
| --- | --- | --- |
| Legacy sentence categories | 44/48 | 45/48 |
| Authored challenge categories | 30/40 | 35/40 |
| Authored raw instruction recall | 14/20 | 18/20 |
| Authored raw instruction precision | 14/15 (93.3%) | 18/21 (85.7%) |
| Authored instructions confidently listed | 2/20 | 10/20 |

**Precision worsened:** false raw instruction predictions increased from one to three. All three current false positives remain in Review, rather than the confidently listed Instructions group. Two previously correct legacy event/contact labels also regressed and now need Review. Every error remains in the denominator and [model card](https://github.com/Nicholas-afk/noticebridge/blob/main/MODEL_CARD.md).

Five developer-selected public instruction excerpts improved from 4/5 to 5/5 raw instruction labels; only three are confidently listed. This instruction-only convenience sample cannot estimate precision or representative accuracy. A deliberately narrow anchored-rule baseline finds 2/20 authored instructions with no false positives in that sample; this is not a comparison against commercial assistants. [Full conditions, artifacts and reproduction](https://github.com/Nicholas-afk/noticebridge/blob/main/EVALUATION.md).

## Demonstrated behavior and differentiation

The verified 1.4.2 release has exact source navigation, explicit reminder confirmation, editable question drafts, stale-source protection and repeat-analysis preservation. Regression checks include 100 grouped/range/invalid-date cases. Actual browser journeys exercise downloads and source changes; independent calendar parsing checks dates, escaping and all-day assumptions.

Browser reflow, keyboard, labels, focus and result-announcement semantics were checked. Ten fresh automated accessibility runs across nine width/view combinations reported zero violations or incomplete results. **Actual screen-reader speech, physical phones, native zoom and calendar-client imports remain unverified.** These checks are partial evidence, not accessibility certification.

Task extraction and source citations already exist in other tools. NoticeBridge's focused approach combines account-free local processing of pasted notices, verbatim evidence, visible uncertainty and reader-controlled exports. No head-to-head superiority or novel ML research is claimed. [Competition and tool assessment](https://github.com/Nicholas-afk/noticebridge/blob/main/docs/competition-assessment.md).

The walkthrough is silent and captioned, using six actual application captures with fictional notices. It shows source-linked instructions, a confirmed reminder, unresolved alternatives and a reader-edited question draft. It is a sequence of captured states, not continuous screen recording. [Manual demo and capture provenance](https://github.com/Nicholas-afk/noticebridge/blob/main/DEMO.md).

## Limitations, learning and next steps

A useful classifier still needs visible evidence and a way to catch mistakes. English synthetic training, unfamiliar wording and sentence boundaries limit generalization. There is no OCR, translation, automatic conflict resolution, persistent history, timed reminder or alarm. One all-day reminder per excerpt requires the reader's chosen date; ask the sender which revised or conflicting notice applies. The prototype is not intended for legal, medical or emergency interpretation.

The strongest remaining weakness is independent validation. Next work should prioritize de-identified, independently annotated real notices, annotation disagreements, calibrated uncertainty, consented reader studies and actual assistive-technology/device checks. More features or synthetic examples would not establish reader benefit.

## Team and AI-assistance disclosure

Solo entry under **ncywtanner**. OpenAI Codex performed concept exploration, implementation, synthetic-data authoring, debugging, verification, demo assembly and documentation under the entrant's direction. No independent user feedback or human-only development is claimed. No sponsor API or sponsor-credit use is claimed. Public code is MIT licensed; demonstration fonts retain their OFL licenses.
