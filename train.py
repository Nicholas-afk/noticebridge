"""Reproducible NoticeBridge baseline. All examples are authored synthetic data.

The holdout is separate from the training templates. It is a small smoke benchmark,
not evidence of generalization to real notices or accessibility benefit.
"""
import json
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

ROOT = Path(__file__).parent
data = []
def add(label, lines):
    data.extend({"text": text.strip(), "label": label} for text in lines.strip().splitlines() if text.strip())

add("action", """
Please complete the attached form before Friday.
Return the signed permission slip to your teacher.
Bring a packed lunch and a bottle of water.
Do not bring cash on the day of the visit.
You must register online to reserve your place.
Parents need to sign the consent form.
Pay the fee through the school portal.
Submit your application by 5 October.
Collect your child from the main entrance.
Make sure you arrive ten minutes early.
Wear comfortable shoes for the walk.
Check the timetable before travelling.
Keep this letter for your records.
If you wish to attend, confirm your attendance.
Students should bring their notebooks.
Applications must be received no later than Monday.
The consent form is due on 12 March.
Registration closes at noon on 6 June.
The deadline for responses is 10 October.
Remember to pack a raincoat.
Sign in at reception on arrival.
Do not enter the building before staff arrive.
Take your student card with you.
No payment is required for this activity.
Please let us know about dietary needs.
Choose one workshop on the booking form.
Return the equipment to the library.
Update your emergency contact details.
Download and fill out the application.
Write your name clearly on the envelope.
Please cancel your booking if you cannot attend.
Ask your guardian to approve the request.
Participants are required to attend the induction.
Please read the attached instructions carefully.
Book your appointment through the website.
Wait outside until your name is called.
You do not need to purchase a ticket.
If you need transport, tick the box on the form.
The application has to reach us before 4 pm.
Payment is due by 15 September.
Please do not send money by post.
Renew your library membership this month.
Upload a copy of your student identification.
Only registered volunteers may join the activity.
Please bring proof of address to the appointment.
Parents must collect children at 3 pm.
Let the office know if your child is absent.
All visitors must show their booking confirmation.
Do not share your account password with anyone.
Please return this reply slip even if you cannot attend.
""")
add("event", """
The school trip will take place on 14 October.
The meeting begins at 6 pm in the main hall.
The library is open from 9 am until 5 pm.
The bus leaves the school at 8 am.
Children will return to school at 3 pm.
The workshop is scheduled for Saturday morning.
The event will be held at the community centre.
The office will be closed on Monday.
The session lasts for two hours.
Lunch will be provided at noon.
The venue is the sports centre on Bridge Street.
Doors open at 5 pm.
The coach departs from the east gate.
The activity costs ten dollars per student.
There are twenty places available.
The class meets every Tuesday.
The presentation will start at 10 am.
The fair runs from 12 to 14 June.
The collection point is outside the library.
The parent evening is on 2 November.
Lessons resume on 6 January.
The entrance is on the ground floor.
The information session is free of charge.
The play area is closed for repairs this week.
The visit includes a guided tour of the museum.
The afternoon session starts after lunch.
Transport is included in the cost.
The classroom is located upstairs.
Students will travel by bus.
The service operates during term time.
""")
add("contact", """
For questions, email the school office.
Contact the coordinator if you need help.
Call reception on 555 0123 for further information.
If you have questions, speak to your teacher.
Please contact the office about accessibility needs.
For more details, visit our website.
Questions can be sent to events@example.org.
Our help desk can assist with registration.
The school office can be reached at office@example.org.
Contact Ms Lee to discuss travel arrangements.
You can ask the community team for support.
For enquiries, telephone the library.
The coordinator is available to answer questions.
If you need an interpreter, contact reception.
Further information is available from the centre manager.
Email help@example.org if the form does not work.
Speak to the duty supervisor for assistance.
Get in touch with the volunteers team.
Call us if you are unsure which session to choose.
The contact person for this event is Mr Patel.
Visit the school website for frequently asked questions.
Write to the office if you need a paper copy.
For advice about the timetable, ask the administrator.
If you need help completing the form, call the centre.
Enquiries should be directed to the reception desk.
The bookings team handles questions about places.
Support is available by telephone during office hours.
Reach out to our team for more information.
For transport enquiries contact the trip leader.
Our email address is community@example.org.
""")
add("background", """
We are pleased to announce a new community programme.
Thank you for your continued support.
This project aims to help young people learn together.
We look forward to welcoming everyone.
The school values cooperation and kindness.
This notice contains information about the upcoming term.
We hope you enjoyed the recent festival.
The programme has been running for five years.
Our volunteers make a valuable contribution.
The students have worked hard this term.
We appreciate your patience during the repairs.
This is an opportunity to meet other families.
Learning outside the classroom is important to us.
The event celebrates local culture and history.
We are proud of the achievements of our community.
This letter is for the parents of students in Year Six.
The activity is designed for beginners.
The previous workshop was very well attended.
Our team is committed to improving the service.
This message replaces the earlier announcement.
We apologise for the inconvenience.
The centre received a generous donation.
The club provides a friendly space for young people.
Dear parents and carers.
Best wishes from the school team.
Everyone is welcome at our community events.
The newsletter shares news from the last month.
We encourage families to take an interest in the programme.
The project supports environmental awareness.
The children enjoyed their visit last year.
""")

# Training-only template augmentation. Evaluation does not reuse these templates.
for item in ["consent form", "reply slip", "application", "registration form", "payment", "booking request"]:
    for date in ["9 October", "12 March", "Friday", "tomorrow", "next week"]:
        add("action", f"Please submit your {item} by {date}.\nThe {item} must arrive before {date}.")
for item in ["workshop", "parent meeting", "club session", "school visit", "community fair"]:
    for place in ["main hall", "library", "community centre", "sports building"]:
        add("event", f"The {item} takes place at the {place}.\nThe {item} begins at 10 am.")
for person in ["teacher", "coordinator", "receptionist", "club leader", "office team"]:
    for topic in ["booking", "transport", "forms", "accessibility"]:
        add("contact", f"For questions about {topic}, contact the {person}.")

# Separate, manually authored holdout. Labels are reviewed before fitting.
holdout = []
def test(label, lines):
    holdout.extend({"text": text.strip(), "label": label} for text in lines.strip().splitlines() if text.strip())
test("action", """
Hand your completed reply to the front desk by Thursday.
Reserve a seat using the online booking page.
You will need to carry a refillable water bottle.
Do not pay the driver directly.
Make your selection before the end of the week.
The final date to send your response is 23 August.
Tell reception if you require a large print letter.
Ensure that the consent section has been signed.
Everyone attending must bring their membership card.
Bookings are required by 17 November at 4 pm.
If your child is participating, return the enclosed slip.
You do not have to buy any materials.
""")
test("event", """
The outing is scheduled for 21 October at 9 am.
Our doors will reopen on 3 February.
Families will meet in the assembly room.
The minibus returns at half past four.
The morning session is ninety minutes long.
Tickets cost eight pounds each.
The centre shuts at 7 pm on weekdays.
The rehearsal happens in the theatre.
The annual celebration takes place in the park.
The appointment is at 2 pm on Wednesday.
The meal is included in the price.
The venue has a step free entrance.
""")
test("contact", """
If anything is unclear, speak with the head of year.
For assistance with your booking, ring the help line.
Address any questions to the programme organiser.
The duty librarian can answer your questions.
Email trips@example.org to discuss individual needs.
The accessibility team can help arrange an interpreter.
You can find additional details on our information page.
If you are unsure, call the front desk.
Please ask the supervisor about alternative travel options.
For queries about the fee, contact accounts.
Our team answers enquiries by email.
The support office is available to explain the process.
""")
test("background", """
We are delighted by the success of last year's activities.
The scheme builds connections between neighbours.
Many thanks for helping our school community.
Our mission is to make learning accessible to everyone.
This circular outlines the arrangements for the new term.
The organisers are grateful for the support of families.
We hope the children have an enjoyable experience.
The new initiative encourages creative thinking.
We have received positive feedback from residents.
Dear members of the community.
Kind regards from the library team.
The programme was established in 2021.
""")

# Deduplicate training sentences, preserving labels.
data = list({x["text"]: x for x in data}.values())
assert not set(x["text"] for x in data) & set(x["text"] for x in holdout)
vectorizer = TfidfVectorizer(ngram_range=(1, 2), token_pattern=r"(?u)\b[a-zA-Z][a-zA-Z]+\b", sublinear_tf=True)
X = vectorizer.fit_transform(x["text"] for x in data)
model = LogisticRegression(C=4.0, class_weight="balanced", max_iter=1500, random_state=23)
model.fit(X, [x["label"] for x in data])
predictions = model.predict(vectorizer.transform(x["text"] for x in holdout))
probs = model.predict_proba(vectorizer.transform(x["text"] for x in holdout))
report = {
    "training_examples": len(data), "holdout_examples": len(holdout),
    "accuracy": accuracy_score([x["label"] for x in holdout], predictions),
    "classes": model.classes_.tolist(),
    "classification_report": classification_report([x["label"] for x in holdout], predictions, output_dict=True, zero_division=0),
    "confusion_matrix": confusion_matrix([x["label"] for x in holdout], predictions, labels=model.classes_).tolist(),
    "limitations": "Authored synthetic examples only; one small held-out benchmark; no real-world user study, no calibrated confidence, English only.",
    "predictions": [{**row, "prediction": str(pred), "score": float(max(prob))} for row, pred, prob in zip(holdout, predictions, probs)]
}
artifact = {"version": "1.0.0", "classes": model.classes_.tolist(), "vocabulary": vectorizer.vocabulary_, "idf": vectorizer.idf_.tolist(), "weights": model.coef_.tolist(), "bias": model.intercept_.tolist(), "training_examples": len(data), "holdout_examples": len(holdout), "accuracy": report["accuracy"], "tokenizer": "ASCII words of at least two letters; lowercase; unigram + bigram; sublinear TF; L2 normalization"}
(ROOT / "dist" / "model.json").write_text(json.dumps(artifact, separators=(",", ":")))
(ROOT / "evaluation.json").write_text(json.dumps(report, indent=2))
(ROOT / "dataset.json").write_text(json.dumps({"provenance": "Author-created synthetic school and community notice sentences; no personal data.", "train": data, "holdout": holdout}, indent=2))
print(json.dumps({k: report[k] for k in ["training_examples", "holdout_examples", "accuracy", "classification_report"]}, indent=2))
