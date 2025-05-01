from flask import Flask, request, jsonify
from transformers import pipeline
from keybert import KeyBERT

app = Flask(__name__)

# Load models
sentiment_pipeline = pipeline("sentiment-analysis")
kw_model = KeyBERT()

def analyze_review(review, negative, neutral, positive, total_keywords):
    sentiment_result = sentiment_pipeline(review)[0]
    sentiment = sentiment_result['label']
    score = sentiment_result['score']

    if score < 0.45:
        sentiment = "NEGATIVE"
        negative += 1
    elif 0.45 <= score <= 0.55:
        sentiment = "NEUTRAL"
        neutral += 1
    else:
        sentiment = "POSITIVE"
        positive += 1

    keywords = kw_model.extract_keywords(review, top_n=5, stop_words='english')
    keywords_only = [kw[0] for kw in keywords]
    total_keywords = total_keywords.union(set(keywords_only))

    return sentiment, score, keywords_only, negative, neutral, positive, total_keywords

def generate_suggestions(description, sentiment_stats, keywords):
    negative, neutral, positive = sentiment_stats
    suggestions = []

    if negative > positive:
        suggestions.append("Improve overall user experience as negative reviews dominate.")
    if "price" in keywords or "expensive" in keywords:
        suggestions.append("Consider revising pricing or adding budget-friendly options.")
    if "support" in keywords or "customer service" in keywords:
        suggestions.append("Enhance customer support response time and friendliness.")
    if "slow" in keywords or "loading" in keywords:
        suggestions.append("Optimize performance and reduce loading times.")
    if positive > negative and positive > neutral:
        suggestions.append("Users are happy! Keep up the great work and continue to improve.")
    if not suggestions:
        suggestions.append("Maintain current performance and consider collecting more user feedback.")

    return suggestions

def first_sentence(text: str) -> str:
    for sep in '.!?':
        idx = text.find(sep)
        if idx != -1:
            return text[:idx + 1].strip()   
    return text.strip() 

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Brand Analyzer NLP API is running!"}), 200

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json

    #print(data)

    if "reviews" not in data or "description" not in data:
        return jsonify({"error": "Missing 'reviews' or 'description' field"}), 400

    uid = data["uid"]
    reviews = data["reviews"]
    title = data["title"]
    icon = data["icon"]
    description = data["description"]
    brandType = data["brandURLType"]

    negative = 0
    neutral = 0
    positive = 0
    total_keywords = set()
    analyzed_reviews = []

    for review in reviews:
        review_text = review.get("review", "")
        user = review.get("user", "anonymous")
        rating = review.get("rating", None)

        sentiment, score, keywords, negative, neutral, positive, total_keywords = analyze_review(
            review_text, negative, neutral, positive, total_keywords
        )

        analyzed_reviews.append({
            "user": user,
            "rating": rating,
            "review": review_text,
            "sentiment": sentiment,
            "confidence": round(score, 4),
            "keywords": keywords
        })

    total = negative + neutral + positive
    negative_pct = round((negative / total) * 100, 2)
    neutral_pct = round((neutral / total) * 100, 2)
    positive_pct = round((positive / total) * 100, 2)

    sentiment_distribution = {
        "negative": negative_pct,
        "neutral": neutral_pct,
        "positive": positive_pct
    }

    suggestions = generate_suggestions(description, (negative_pct, neutral_pct, positive_pct), total_keywords)

    description = first_sentence(description)

    print({
        "uid":uid,
        "title": title,
        "icon": icon,
        "description": description,
        "sentiment_distribution": sentiment_distribution,
        "keywords": list(total_keywords),
        "suggestions": suggestions,
    })

    return jsonify({
        "success": True,
        "uid":uid,
        "title": title,
        "icon": icon,
        "description": description,
        "sentiment_distribution": sentiment_distribution,
        "keywords": list(total_keywords),
        "suggestions": suggestions,
        "analyzed_reviews": analyzed_reviews
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)