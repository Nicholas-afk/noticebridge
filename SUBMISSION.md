## Inspiration

A school letter can contain a trip date, a consent deadline, a payment instruction and an exception in one dense paragraph. Finding the next step can be difficult when a reader is tired, unfamiliar with the language or managing several family responsibilities. W3C cognitive accessibility guidance recommends clear, step-by-step instructions. NoticeBridge explores how machine learning can help surface those steps while keeping the original words easy to check.

We chose a focused challenge: make everyday notices easier to act on without replacing them with an untraceable AI summary.

## What it does

Paste an English school or community notice. NoticeBridge organizes its sentences into instructions, event details, contacts and background. A numbered checklist puts instructions first, shows dates, times and amounts exactly as written, and highlights questions the reader should confirm. Every item has a **Check source** button that highlights the exact sentence in the complete original notice, with a direct return to the checklist.

The fictional school-trip demo surfaces a consent form, a $12 payment, a lunch requirement and “Do not bring cash.” The unclear-deadline demo shows why “tomorrow” needs the notice's issue date and why `08/10` should not be silently interpreted. Readers can mark excerpts reviewed and request a local text-file download. If the input changes, marking and downloading pause until the checklist is refreshed, preventing an old plan from being used for an edited notice.

No account or API key is required. The model runs in the browser, and pasted notices are not sent to cloud AI or saved in a history.

The **Next steps** view turns that review into something useful outside the app. Readers can choose all-day reminders and download a calendar file with the exact source sentence attached. Full dates from the same sentence can be suggested, but every date must be checked and confirmed by the reader. Ambiguous dates, missing years and competing unresolved date references leave the field blank. Editing a saved date withdraws the reminder until it is confirmed again. The app also prepares an editable draft of questions from the review notes, quoting the relevant original sentences. Nothing is sent to the sender or written into a calendar account.

## How we built it

The machine-learning pipeline uses Python and scikit-learn to train a four-class logistic regression model over unigram and bigram TF–IDF features. We authored 245 synthetic training sentences and 48 separate holdout sentences, retaining both splits and every evaluation prediction in the repository. Training-only template augmentation does not appear in the holdout.

The vocabulary, IDF values, coefficients and intercepts are exported as JSON. A dependency-free JavaScript inference engine reproduces the Python model in the browser. Source spans are tracked from sentence splitting through rendering, so each card can be verified against the exact original substring.

Rules supplement the model with conservative checks for instruction cues, relative dates, missing years, numeric date ambiguity, missing instruction dates and invalid ISO dates. These checks are visible review prompts, not inferred facts. Negative instructions are preserved. All background sentences remain accessible.

The interface is built with HTML, CSS and JavaScript. Its document workspace uses flat reading groups, clear labels, keyboard-accessible controls, source highlighting and review progress. Instructions have the strongest hierarchy; uncertainty appears beside the relevant sentence. Optional WebMCP tools let an agent run the same visible analysis workflow and read back its results.

Calendar serialization is a separate, dependency-free module. It validates confirmed dates, uses all-day events with exclusive next-day ends, escapes notice text and folds long lines by UTF-8 bytes. The question draft uses explicit templates keyed to visible review flags rather than generated answers. Both workflows share the same stale-input protection as the checklist, and Clear or refreshed analysis removes their state. The public application and source are hosted on the entrant's GitHub account, `Nicholas-afk`.

## Challenges we ran into

The model's first holdout evaluation missed two of twelve instructions. That result exposed the danger of treating a classifier as a complete reading substitute. We kept the entire source, added an instruction-cue review gate, displayed uncertainty and documented the limitations.

Dates were another challenge. A weekday or “tomorrow” is not a reliable deadline without context, and numeric formats can conflict. We resolve only “today” and “tomorrow” when the reader supplies the notice's issue date; other uncertain dates remain questions to ask the sender. We also avoid attaching a date from another sentence without evidence.

## Accomplishments

- A working application with local model inference and no paid AI service requirement.
- Exact source-linked cards, with no generated paraphrases or invented deadlines.
- **44/48 correct sentence categories (91.7%)** on the separate synthetic holdout; instruction recall **10/12 (83.3%)**. This is a small prototype benchmark, not real-world validation.
- JavaScript/Python prediction and score parity on all 48 holdout sentences.
- Passing checks for source-span integrity, ambiguous and relative dates, preserved negation, invalid dates and input bounds.
- Browser checks of review progress, exact source highlighting, returning to the checklist, uncertainty handling, stale-plan protection and WebMCP valid/invalid-input behavior.
- Calendar checks for invalid dates, leap-day and year rollover, text escaping, UTF-8 folding and rejection of unconfirmed reminders.
- Browser checks of explicit date confirmation, date-edit withdrawal, blank ambiguous-date suggestions, editable-draft preservation and follow-up reset/stale protection.

## What we learned

A compact, task-specific model can make a useful interaction possible without transmitting private notices to an AI service. The more important design lesson is that a reader needs visible evidence and a way to spot missing information. A confident-looking summary would hide those gaps; an evidence-linked plan makes checking part of the experience.

## What's next

We want to test the workflow with consenting readers and community staff, collect independently annotated notices with personal information removed, evaluate on a larger real-world holdout, calibrate model confidence and verify mobile and screen-reader accessibility. No user study, accessibility certification or measured reduction in missed deadlines is claimed for this prototype.

## Target users and intended impact

Parents and carers reading school letters, students organizing club notices, and community members preparing for workshops or appointments. The intended benefit is less effort finding instructions and fewer guesses about dates or exceptions. That benefit remains a hypothesis to test with users.

## AI assistance and team

Solo entry under `ncywtanner`. OpenAI Codex assisted with concept development, implementation, authored synthetic data, testing, diagrams and documentation. No sponsor API or sponsor-credit use is claimed. The project remains an English-language prototype for everyday notices, not legal, medical or emergency interpretation.
