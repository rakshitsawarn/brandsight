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
    # Convert to string and lowercase for consistent processing
    review_text = str(review_text).lower() if review_text else ""
    
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
            # More aggressive threshold for detection
            if (rating >= 4 and sentiment_label == "NEGATIVE" and sentiment_score > 0.6) or \
               (rating <= 2 and sentiment_label == "POSITIVE" and sentiment_score > 0.6):
                return True, "Rating-sentiment mismatch"
        except Exception as e:
            # Print exception for debugging
            print(f"Error in rating-sentiment check: {str(e)}")
    
    # 3. Check for excessive use of superlatives and extreme language
    superlatives = ["amazing", "incredible", "perfect", "best", "worst", "awful", "horrible", 
                   "excellent", "outstanding", "exceptional", "terrible", "superb", "awesome",
                   "greatest", "finest", "magnificent", "dreadful", "appalling"]
    superlative_count = sum(review_text.count(word) for word in superlatives)
    word_count = len(review_text.split())
    if word_count > 0 and superlative_count > 2 and (superlative_count / word_count) > 0.12:
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
    
    # 5. Check for overly generic language without specifics - lower threshold
    generic_phrases = ["great product", "highly recommend", "works well", "very good", "very bad",
                      "love it", "awesome product", "best ever", "worst ever", "changed my life",
                      "must buy", "waste of money", "don't buy", "changed everything",
                      "you won't regret", "best purchase", "worst purchase"]
    
    generic_phrase_count = sum(1 for phrase in generic_phrases if phrase in review_text)
    if generic_phrase_count > 0 and word_count < 15:  # Short review with generic phrases
        return True, "Generic language"
    
    # 6. Check for unnatural patterns (all caps, excessive punctuation)
    orig_review = str(review_text)
    if (orig_review.upper() == orig_review and len(orig_review) > 15) or \
       (review_text.count('!') > 3 or review_text.count('?') > 3 or review_text.count('!!!') > 0):
        return True, "Unnatural formatting"
    
    # 7. Check for promotional/sponsored content indicators
    promo_indicators = ["sponsored", "received for free", "in exchange for", "for my honest review", 
                        "was provided", "company sent", "promotional", "ambassador", "received complimentary",
                        "received product", "sample", "hashtag", "#ad", "#sponsored", "#partner", "influencer", "promo","For promotional purposes", "For promo only"]
    
    for indicator in promo_indicators:
        if indicator in review_text:
            return True, "Promotional content"
    
    # 8. Check for bot-like grammatical patterns using spaCy if available
    if nlp and len(review_text.strip()) > 0:
        try:
            doc = nlp(review_text)
            
            # No sentence structure at all (unusual in human writing)
            sentences = list(doc.sents)
            if len(sentences) == 0:
                return True, "No sentence structure"
            
            # Check for excessively simple or complex sentences
            sentence_lengths = [len(sent) for sent in sentences]
            if len(sentence_lengths) > 0:
                avg_sentence_length = sum(sentence_lengths) / len(sentence_lengths)
                if avg_sentence_length > 50 or avg_sentence_length < 3:
                    return True, "Unusual sentence length"
            
            # Check for lack of pronouns (common in bot-generated text)
            pronoun_count = len([token for token in doc if token.pos_ == "PRON"])
            if len(doc) > 20 and pronoun_count == 0:
                return True, "No pronouns used"
        except Exception as e:
            print(f"Error in spaCy analysis: {str(e)}")
    
    # 9. Check for extremely positive language with no specifics
    extreme_positive_words = ["amazing", "awesome", "fantastic", "incredible", "excellent", "wonderful"]
    positive_count = sum(review_text.count(word) for word in extreme_positive_words)
    if positive_count >= 2 and word_count < 20 and "because" not in review_text and "which" not in review_text:
        return True, "Vague positive language"
    
    # 10. Check for suspiciously formatted usernames
    if user:
        try:
            username = str(user).lower()
            # Look for patterns like "user123", "john2020", etc.
            random_pattern = re.compile(r'^[a-z]+[0-9]{2,}$')
            if random_pattern.match(username):
                return True, "Suspicious username pattern"
        except Exception as e:
            print(f"Error in username analysis: {str(e)}")
    
    return False, None

def analyze_review(review_text, negative, neutral, positive, total_keywords):
    """Analyze a single review for sentiment and keywords"""
    try:
        # More robust error handling
        if not review_text or len(str(review_text).strip()) == 0:
            return "NEUTRAL", 0.5, [], negative, neutral + 1, positive, total_keywords
        
        sentiment_result = sentiment_pipeline(review_text)[0]
        initial_sentiment = sentiment_result['label']
        score = sentiment_result['score']

        # More balanced thresholds for sentiment classification
        # This will make neutral and negative classifications more likely
        if initial_sentiment == "NEGATIVE" and score > 0.7:
            sentiment = "NEGATIVE"
            negative += 1
        elif initial_sentiment == "POSITIVE" and score > 0.7:
            sentiment = "POSITIVE"
            positive += 1
        elif initial_sentiment == "NEGATIVE" and 0.55 < score <= 0.7:
            sentiment = "NEGATIVE"
            negative += 1
        elif initial_sentiment == "POSITIVE" and 0.55 < score <= 0.7:
            sentiment = "POSITIVE"
            positive += 1
        else:
            # More cases will fall into neutral now
            sentiment = "NEUTRAL"
            neutral += 1

        # Extract keywords only if we have meaningful text
        if len(str(review_text).split()) >= 5:
            keywords = kw_model.extract_keywords(review_text, top_n=5, stop_words='english')
            keywords_only = [kw[0] for kw in keywords]
            total_keywords = total_keywords.union(set(keywords_only))
        else:
            keywords_only = []

        return sentiment, score, keywords_only, negative, neutral, positive, total_keywords
    except Exception as e:
        print(f"Error in analyze_review: {str(e)}")
        # Default to neutral in case of errors
        return "NEUTRAL", 0.5, [], negative, neutral + 1, positive, total_keywords

def generate_suggestions(description, sentiment_stats, keywords):
    """Generate actionable suggestions based on review analysis"""
    negative_pct, neutral_pct, positive_pct = sentiment_stats
    suggestions = []

    # More specific and targeted suggestions
    if negative_pct > 30:
        suggestions.append("Significant negative sentiment detected. Prioritize addressing user concerns.")
        
    if negative_pct > positive_pct:
        suggestions.append("Negative reviews dominate - conduct focused user research to identify key problems.")
        
    common_complaint_words = ["price", "expensive", "cost", "support", "customer service", 
                             "help", "slow", "loading", "speed", "performance", "bug", 
                             "error", "crash", "glitch", "difficult", "complex", 
                             "confusing", "usability", "update", "outdated"]
                             
    detected_issues = [word for word in common_complaint_words if word in keywords]
    
    if "price" in detected_issues or "expensive" in detected_issues or "cost" in detected_issues:
        suggestions.append("Price concerns noted in reviews. Consider revising pricing strategy or communicating value better.")
        
    if "support" in detected_issues or "customer service" in detected_issues or "help" in detected_issues:
        suggestions.append("Customer support issues detected. Improve response times and service quality.")
        
    if "slow" in detected_issues or "loading" in detected_issues or "speed" in detected_issues or "performance" in detected_issues:
        suggestions.append("Performance concerns identified. Optimize application speed and responsiveness.")
        
    if "bug" in detected_issues or "error" in detected_issues or "crash" in detected_issues or "glitch" in detected_issues:
        suggestions.append("Technical issues reported frequently. Prioritize bug fixes and stability improvements.")
        
    if "difficult" in detected_issues or "complex" in detected_issues or "confusing" in detected_issues or "usability" in detected_issues:
        suggestions.append("Usability problems detected. Simplify user interface and improve user experience.")
        
    if "update" in detected_issues or "outdated" in detected_issues:
        suggestions.append("Users mentioning outdated features. Consider releasing updates with new functionality.")
    
    if neutral_pct > 50:
        suggestions.append("High percentage of neutral reviews indicates ambivalence. Work on creating more positive user experiences.")
        
    if positive_pct > 70:
        suggestions.append("Very positive sentiment overall. Continue current strategy while addressing any minor concerns.")
    
    # Ensure we always provide at least one suggestion
    if not suggestions:
        if len(keywords) > 0:
            suggestions.append(f"Focus on areas related to these keywords: {', '.join(list(keywords)[:5])}")
        else:
            suggestions.append("Collect more detailed user feedback to identify specific improvement areas.")

    return suggestions

def first_sentence(text: str) -> str:
    """Extract the first sentence from a text"""
    if not text:
        return ""
        
    text = str(text)
    for sep in '.!?':
        idx = text.find(sep)
        if idx != -1:
            return text[:idx + 1].strip()   
    return text.strip() 

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Brand Analyzer API is running."}), 200

@app.route("/analyze", methods=["POST"])
def analyze():
    """Main endpoint for analyzing reviews"""
    try:
        data = request.json

        if "reviews" not in data or "description" not in data:
            return jsonify({"error": "Missing 'reviews' or 'description' field"}), 400

        uid = data.get("uid", "unknown")
        reviews = data.get("reviews", [])
        title = data.get("title", "")
        icon = data.get("icon", "")
        description = data.get("description", "")
        brandType = data.get("brandURLType", "")

        # Initialize counters and collections
        negative = 0
        neutral = 0
        positive = 0
        total_keywords = set()
        analyzed_reviews = []
        fake_reviews = 0
        fake_reasons = {}

        # Process each review
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
                
                # Add to analyzed reviews but mark as fake
                analyzed_reviews.append({
                    "user": user,
                    "rating": rating,
                    "review": review_text,
                    "sentiment": "NEUTRAL",  # Default sentiment for fake reviews
                    "confidence": 0.0,
                    "keywords": [],
                    "is_fake": True,
                    "fake_reason": reason
                })
                continue

            # Analyze genuine review
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

        # Generate recommendations
        suggestions = generate_suggestions(
            description, 
            (negative_pct, neutral_pct, positive_pct), 
            total_keywords
        )

        short_description = first_sentence(description)

        # Create response
        response = {
            "success": True,
            "uid": uid,
            "title": title,
            "icon": icon,
            "description": short_description,
            "sentiment_distribution": sentiment_distribution,
            "keywords": list(total_keywords),
            "suggestions": suggestions,
            "analyzed_reviews": analyzed_reviews,
            "fake_reviews_detected": fake_reviews,
            "fake_review_reasons": fake_reasons,
            "total_reviews_analyzed": len(analyzed_reviews),
            "genuine_reviews_count": len(analyzed_reviews) - fake_reviews
        }
        
        # Debug information
        print(f"Analysis complete for {uid}")
        print(f"Sentiment distribution: {sentiment_distribution}")
        print(f"Fake reviews detected: {fake_reviews} out of {len(reviews)}")
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Error processing request: {str(e)}"
        }), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)