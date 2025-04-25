from flask import Flask, request, jsonify
from transformers import pipeline
from keybert import KeyBERT
import re
from collections import Counter
import spacy
import numpy as np
from datetime import datetime

app = Flask(__name__)

# Load required models
sentiment_pipeline = pipeline("sentiment-analysis")
kw_model = KeyBERT()
try:
    nlp = spacy.load("en_core_web_sm")
except:
    # Fallback if the model isn't available
    nlp = None

def is_fake_review(review_text, rating=None, timestamp=None, user=None):
    """
    Enhanced fake review detection with multiple heuristics:
    1. Rating-sentiment mismatch detection
    2. Excessive use of superlatives
    3. Overly generic language
    4. Repeated phrases and patterns
    5. Bot-like text patterns
    6. Promotional/sponsored content indicators
    7. Temporal patterns (if timestamp data available)
    8. User pattern analysis (if user data available)
    """
    review_text = str(review_text).lower()
    
    # 1. Check for very short or empty reviews
    if len(review_text.strip()) < 5 or len(review_text.split()) < 3:
        return True, "Too short"
    
    # 2. Check rating-sentiment mismatch (if rating is provided)
    if rating is not None:
        try:
            rating = float(rating)
            sentiment_result = sentiment_pipeline(review_text)[0]
            sentiment_score = sentiment_result['score']
            sentiment_label = sentiment_result['label']
            
            # Mismatch detection: High rating with negative sentiment or vice versa
            if (rating >= 4 and sentiment_label == "NEGATIVE" and sentiment_score > 0.7) or \
               (rating <= 2 and sentiment_label == "POSITIVE" and sentiment_score > 0.7):
                return True, "Rating-sentiment mismatch"
        except:
            pass
    
    # 3. Check for excessive use of superlatives and extreme language
    superlatives = ["amazing", "incredible", "perfect", "best", "worst", "awful", "horrible", 
                   "excellent", "outstanding", "exceptional", "terrible", "superb", "awesome",
                   "greatest", "finest", "magnificent", "dreadful", "appalling"]
    superlative_count = sum(review_text.count(word) for word in superlatives)
    if superlative_count > 2 and superlative_count / len(review_text.split()) > 0.15:
        return True, "Excessive superlatives"
    
    # 4. Check for repeated words or phrases (common in bot reviews)
    words = review_text.lower().split()
    word_counts = Counter(words)
    
    # Get bigrams (word pairs) to detect phrase repetition
    bigrams = [" ".join(words[i:i+2]) for i in range(len(words)-1)]
    bigram_counts = Counter(bigrams)
    
    if any(count > 3 for word, count in word_counts.items() if len(word) > 3):
        return True, "Word repetition"
        
    if any(count > 2 for bigram, count in bigram_counts.items()):
        return True, "Phrase repetition"
    
    # 5. Check for overly generic language without specifics
    generic_phrases = ["great product", "highly recommend", "works well", "very good", "very bad",
                      "love it", "awesome product", "best ever", "worst ever", "changed my life",
                      "must buy", "waste of money", "don't buy", "changed everything",
                      "you won't regret", "best purchase", "worst purchase"]
    
    generic_phrase_count = sum(review_text.count(phrase) for phrase in generic_phrases)
    if generic_phrase_count > 1:
        return True, "Generic language"
    
    # 6. Check for unnatural patterns (all caps, excessive punctuation)
    orig_review = str(review_text)
    if (orig_review.upper() == orig_review and len(orig_review) > 15) or \
       (review_text.count('!') > 3 or review_text.count('?') > 3 or review_text.count('!!!') > 0):
        return True, "Unnatural formatting"
    
    # 7. Check for promotional/sponsored content indicators
    promo_indicators = ["sponsored", "received for free", "in exchange for", "for my honest review", 
                        "was provided", "company sent", "promotional", "ambassador", "received complimentary",
                        "received product", "sample", "hashtag", "#ad", "#sponsored", "#partner", "influencer"]
    
    for indicator in promo_indicators:
        if indicator in review_text:
            return True, "Promotional content"
    
    # 8. Check for bot-like grammatical patterns using spaCy if available
    if nlp:
        try:
            doc = nlp(review_text)
            
            # No sentence structure at all (unusual in human writing)
            if len(list(doc.sents)) == 0:
                return True, "No sentence structure"
            
            # Check for excessively simple or complex sentences
            sentence_lengths = [len(sent) for sent in doc.sents]
            if len(sentence_lengths) > 0:
                avg_sentence_length = sum(sentence_lengths) / len(sentence_lengths)
                if avg_sentence_length > 50 or avg_sentence_length < 3:
                    return True, "Unusual sentence length"
            
            # Check for lack of pronouns (common in bot-generated text)
            pronoun_count = len([token for token in doc if token.pos_ == "PRON"])
            if len(doc) > 20 and pronoun_count == 0:
                return True, "No pronouns used"
        except:
            pass
    
    # 9. Temporal pattern check (if timestamp available)
    if timestamp:
        try:
            # Logic for detecting reviews posted at unusual times or in batches
            # This is a placeholder - real implementation would need a database of timestamps
            pass
        except:
            pass
    
    # 10. User pattern analysis (if user data available)
    if user:
        # Check for suspicious usernames (often random characters, numbers)
        try:
            username = str(user).lower()
            random_pattern = re.compile(r'^[a-z0-9]{8,}$')
            if random_pattern.match(username):
                return True, "Suspicious username pattern"
        except:
            pass
    
    return False, None

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
    if "price" in keywords or "expensive" in keywords or "cost" in keywords:
        suggestions.append("Consider revising pricing or adding budget-friendly options.")
    if "support" in keywords or "customer service" in keywords or "help" in keywords:
        suggestions.append("Enhance customer support response time and friendliness.")
    if "slow" in keywords or "loading" in keywords or "speed" in keywords or "performance" in keywords:
        suggestions.append("Optimize performance and reduce loading times.")
    if "bug" in keywords or "error" in keywords or "crash" in keywords or "glitch" in keywords:
        suggestions.append("Address technical issues and bugs that users are reporting.")
    if "difficult" in keywords or "complex" in keywords or "confusing" in keywords or "usability" in keywords:
        suggestions.append("Improve user interface and make the product more intuitive.")
    if "update" in keywords or "outdated" in keywords or "old" in keywords:
        suggestions.append("Consider releasing more frequent updates and adding new features.")
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

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json

    if "reviews" not in data or "description" not in data:
        return jsonify({"error": "Missing 'reviews' or 'description' field"}), 400

    uid = data["uid"]
    reviews = data["reviews"]
    title = data["title"]
    icon = data["icon"]
    description = data["description"]
    brandType = data.get("brandURLType", "")

    negative = 0
    neutral = 0
    positive = 0
    total_keywords = set()
    analyzed_reviews = []
    fake_reviews = 0
    fake_reasons = {}

    for review in reviews:
        review_text = review.get("review", "")
        user = review.get("user", "anonymous")
        rating = review.get("rating", None)
        timestamp = review.get("timestamp", None)

        # Check if review is fake
        is_fake, reason = is_fake_review(review_text, rating, timestamp, user)
        
        if is_fake:
            fake_reviews += 1
            fake_reasons[reason] = fake_reasons.get(reason, 0) + 1
            
            # We can either skip fake reviews or include them with a flag
            analyzed_reviews.append({
                "user": user,
                "rating": rating,
                "review": review_text,
                "sentiment": "UNKNOWN",
                "confidence": 0.0,
                "keywords": [],
                "is_fake": True,
                "fake_reason": reason
            })
            continue

        sentiment, score, keywords, negative, neutral, positive, total_keywords = analyze_review(
            review_text, negative, neutral, positive, total_keywords
        )

        analyzed_reviews.append({
            "user": user,
            "rating": rating,
            "review": review_text,
            "sentiment": sentiment,
            "confidence": round(score, 4),
            "keywords": keywords,
            "is_fake": False
        })

    # Calculate percentage distribution of sentiments
    total = negative + neutral + positive
    if total > 0:  # Avoid division by zero
        negative_pct = round((negative / total) * 100, 2)
        neutral_pct = round((neutral / total) * 100, 2)
        positive_pct = round((positive / total) * 100, 2)
    else:
        negative_pct = neutral_pct = positive_pct = 0.0

    sentiment_distribution = {
        "negative": negative_pct,
        "neutral": neutral_pct,
        "positive": positive_pct
    }

    suggestions = generate_suggestions(description, (negative_pct, neutral_pct, positive_pct), total_keywords)

    description = first_sentence(description)

    print({
        "uid": uid,
        "title": title,
        "icon": icon,
        "description": description,
        "sentiment_distribution": sentiment_distribution,
        "keywords": list(total_keywords),
        "suggestions": suggestions,
        "fake_reviews_removed": fake_reviews,
        "fake_review_reasons": fake_reasons
    })

    return jsonify({
        "success": True,
        "uid": uid,
        "title": title,
        "icon": icon,
        "description": description,
        "sentiment_distribution": sentiment_distribution,
        "keywords": list(total_keywords),
        "suggestions": suggestions,
        "analyzed_reviews": analyzed_reviews,
        "fake_reviews_detected": fake_reviews,
        "fake_review_reasons": fake_reasons,
        "total_reviews_analyzed": len(analyzed_reviews) - fake_reviews
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)