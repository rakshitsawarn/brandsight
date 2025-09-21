import os
import json
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import re

load_dotenv()

app = FastAPI()
groqClient = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ---------------- Schema ----------------
class AnalyzeRequest(BaseModel):
    uid: str
    title: str
    icon: str
    description: str
    brandURLType: str
    reviews: list

# ---------------- Helpers ----------------
def first_sentence(text: str) -> str:
    for sep in '.!?':
        idx = text.find(sep)
        if idx != -1:
            return text[:idx + 1].strip()
    return text.strip()

async def analyze_reviews_batch(reviews, model="llama-3.1-8b-instant"):
    """Batch reviews into Groq request, return sentiment + keywords per review"""
    reviews_text = "\n".join([f"{i+1}. {r.get('review','')}" for i, r in enumerate(reviews)])

    prompt = f"""
        Analyze these product reviews. For EACH review, return a JSON object:
        - "review": the review text
        - "sentiment": "POSITIVE", "NEUTRAL", or "NEGATIVE"
        - "confidence": float between 0 and 1
        - "keywords": up to 5 important keywords (lowercase, single words)

        Reviews:
        {reviews_text}

        Respond ONLY in a valid JSON array, one object per review.
        """

    response = groqClient.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are an NLP assistant that analyzes reviews precisely."},
            {"role": "user", "content": prompt}
        ]
    )

    print("Response: ", response)
    content = response.choices[0].message.content.strip()
    
    # Remove code block markers
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\n?", "", content)
        content = re.sub(r"\n?```$", "", content)

    # Extract only the first JSON array from the response
    match = re.search(r"\[\s*{[\s\S]*}\s*\]", content)
    if match:
        json_str = match.group(0)
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            print("JSON parse error:", e, "\nRaw JSON candidate:", json_str)
            return []
    else:
        print("No JSON array found in response:", content)
        return []

async def generate_suggestions_from_reviews(description, reviews_batch, model="gemma2-9b-it"):
    """Generate actionable brand improvement suggestions based on actual reviews"""
    reviews_text = "\n".join([f"- {r['review']}" for r in reviews_batch])
    prompt = f"""
        You are an app/brand review analyst. Based on these reviews, generate actionable suggestions:

        Product description: "{description}"

        Reviews:
        {reviews_text}

        Rules:
        - Identify recurring problems or pain points.
        - Suggest concrete improvements (e.g., if review says 'app crashes on launch', suggest 'Fix app crash on launch by checking logs').
        - Keep suggestions concise, clear, and actionable.
        - Return a list of bullet points.
        """

    response = groqClient.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You generate actionable brand improvement suggestions."},
            {"role": "user", "content": prompt}
        ]
    )

    # Split into bullet points
    suggestions_text = response.choices[0].message.content.strip().split("\n")
    return [s.strip("- ").strip() for s in suggestions_text if s.strip()]

# ---------------- Routes ----------------
@app.get("/")
async def root():
    return {"message": "Brand Analyzer NLP API is running!"}

@app.post("/analyze")
async def analyze(request: Request):
    data = await request.json()

    for rev in data["reviews"]:
        print("\n Raw Reviews: ", rev)

    required_fields = ["reviews", "description", "uid", "title", "icon", "brandURLType"]
    if not all(f in data for f in required_fields):
        return JSONResponse({"error": "Missing required field"}, status_code=400)

    uid = data["uid"]
    reviews = data["reviews"]
    title = data["title"]
    icon = data["icon"]
    description = data["description"]
    brandType = data["brandURLType"]

    # ---------------- Analyze Reviews ----------------
    analyzed_reviews = await analyze_reviews_batch(reviews)
    print("\n Analyzed Reviews: ", analyzed_reviews)

    negative, neutral, positive = 0, 0, 0
    total_keywords = set()

    for i, r in enumerate(analyzed_reviews):
        sentiment = r.get("sentiment", "NEUTRAL").upper()
        score = float(r.get("confidence", 0.5))
        keywords = r.get("keywords", [])
        user = reviews[i].get("user", "anonymous")
        rating = reviews[i].get("rating", None)

        if sentiment == "NEGATIVE":
            negative += 1
        elif sentiment == "NEUTRAL":
            neutral += 1
        else:
            positive += 1

        total_keywords.update(keywords)

        # Keep same structure as Flask version
        r.update({
            "user": user,
            "rating": rating,
            "review": r.get("review", reviews[i].get("review","")),
            "sentiment": sentiment,
            "confidence": round(score, 4),
            "keywords": keywords
        })

    total = max(1, negative + neutral + positive)
    sentiment_distribution = {
        "negative": round((negative / total) * 100, 2),
        "neutral": round((neutral / total) * 100, 2),
        "positive": round((positive / total) * 100, 2)
    }
    print("\nDistributions: ", sentiment_distribution)

    # ---------------- Generate Suggestions ----------------
    suggestions = await generate_suggestions_from_reviews(description, analyzed_reviews)
    print("\nSuggestions: ", suggestions)

    description_short = first_sentence(description)

    return JSONResponse({
        "success": True,
        "uid": uid,
        "title": title,
        "icon": icon,
        "description": description_short,
        "sentiment_distribution": sentiment_distribution,
        "keywords": list(total_keywords),
        "suggestions": suggestions,
        "analyzed_reviews": analyzed_reviews
    })
