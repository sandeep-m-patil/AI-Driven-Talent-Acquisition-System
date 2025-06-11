import spacy

nlp = spacy.load("en_core_web_sm")

def extract_skills(text):
    doc = nlp(text.lower())
    ents = [ent.text for ent in doc.ents if ent.label_ in ["ORG", "PRODUCT", "WORK_OF_ART"]]
    noun_chunks = [chunk.text.strip() for chunk in doc.noun_chunks]
    skills = set(ents + noun_chunks)
    skills = {skill for skill in skills if len(skill.split()) <= 4 and len(skill) > 2}
    return skills

def process_resume_vs_jd(resume_text: str, job_description: str):
    resume_text = resume_text.lower()
    jd_text = job_description.lower()

    resume_skills = extract_skills(resume_text)
    jd_skills = extract_skills(jd_text)

    matched_skills = resume_skills.intersection(jd_skills)
    missing_skills = jd_skills.difference(resume_skills)

    score = round(len(matched_skills) / len(jd_skills) * 100, 2) if jd_skills else 0.0

    return {
        "score": score,
        "matched_skills": list(matched_skills),
        "missing_skills": list(missing_skills),
    }
