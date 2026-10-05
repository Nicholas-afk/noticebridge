"""Re-fit the saved training split; verify export and audit overlap without training on checks."""
import hashlib
import json
import platform
import re
from pathlib import Path
import sklearn
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics.pairwise import cosine_similarity

ROOT = Path(__file__).parent
load = lambda path: json.loads((ROOT / path).read_text())
cases = load("audit-cases.json")
sets = {"legacy": load("docs/model-audit/baseline/dataset.json")["holdout"], "authored": cases["authored"], "public": cases["public"]}
normalize = lambda text: " ".join(re.findall(r"[a-z]+", text.lower()))
report = {"runtime": {"python": platform.python_version(), "scikit_learn": sklearn.__version__}, "overlap": {}, "candidate_predictions": []}
for name, path in [("baseline", "docs/model-audit/baseline/"), ("candidate", "")]:
    data = load(path + "dataset.json")["train"]
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), token_pattern=r"(?u)\b[a-zA-Z][a-zA-Z]+\b", sublinear_tf=True)
    X = vectorizer.fit_transform(row["text"] for row in data)
    model = LogisticRegression(C=4.0, class_weight="balanced", max_iter=1500, random_state=23).fit(X, [row["label"] for row in data])
    saved = load(path + "model.json" if path else "dist/model.json")
    assert vectorizer.vocabulary_ == saved["vocabulary"]
    assert vectorizer.idf_.tolist() == saved["idf"]
    assert model.coef_.tolist() == saved["weights"]
    assert model.intercept_.tolist() == saved["bias"]
    report["overlap"][name] = {}
    for split, rows in sets.items():
        exact = [row["text"] for row in rows if row["text"] in {x["text"] for x in data}]
        normalized = [row["text"] for row in rows if normalize(row["text"]) in {normalize(x["text"]) for x in data}]
        similarity = cosine_similarity(vectorizer.transform(row["text"] for row in rows), X)
        nearest = [{"check": row["text"], "training": data[int(scores.argmax())]["text"], "cosine": float(scores.max())} for row, scores in zip(rows, similarity)]
        report["overlap"][name][split] = {"exact": exact, "normalized": normalized, "nearest": sorted(nearest, key=lambda x: -x["cosine"])}
        assert not exact and not normalized, (name, split)
        if name == "candidate":
            predicted = model.predict(vectorizer.transform(row["text"] for row in rows))
            probabilities = model.predict_proba(vectorizer.transform(row["text"] for row in rows))
            report["candidate_predictions"].extend({**row, "split": split, "prediction": str(pred), "score": float(max(prob))} for row, pred, prob in zip(rows, predicted, probabilities))
    if name == "candidate":
        probes = ["Please bring lunch水 for Friday.", "Ask Noël for advice.", "Please notify Amélie.", "Please contact Noël.", "Noël will bring lunch.", "Please bring José's notebook.", "Please bring lunch中文.", "Please bring 中文lunch."]
        predicted = model.predict(vectorizer.transform(probes))
        probabilities = model.predict_proba(vectorizer.transform(probes))
        report["tokenizer_probes"] = [{"text": text, "prediction": str(pred), "score": float(max(prob))} for text, pred, prob in zip(probes, predicted, probabilities)]
report["sha256"] = {path: hashlib.sha256((ROOT / path).read_bytes()).hexdigest() for path in ["audit-cases.json", "training-additions.json", "dataset.json", "evaluation.json", "dist/model.json", "docs/model-audit/baseline/model.json", "docs/model-audit/baseline/dataset.json", "docs/model-audit/baseline/evaluation.json", "docs/model-audit/baseline/engine.js", "dist/engine.js", "train.py", "audit.mjs", "audit-python.py"]}
(ROOT / "docs/model-audit/python-audit.json").write_text(json.dumps(report, indent=2) + "\n")
print("Both exports exactly match re-fitted scikit-learn parameters; zero exact/normalized overlap in all six comparisons.")
for name, splits in report["overlap"].items():
    for split, rows in splits.items():
        print(name, split, "highest cosine", round(rows["nearest"][0]["cosine"], 3))
