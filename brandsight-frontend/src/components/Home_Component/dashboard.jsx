import React from 'react';

const Suggestions = ({ suggestions }) => {
    if (!suggestions || !Array.isArray(suggestions)) {
        return <div className="suggestion">No suggestions available</div>;
    }

    return (
        <div className="suggestions-list">
            {suggestions.map((suggestion, index) => (
                <div key={index} className="suggestion">{suggestion}</div>
            ))}
        </div>
    );
};

const Dashboard = ({
    brandURL = '',
    setBrandURL = () => { },
    reviewNumber = 10,
    setReviewNumber = () => { },
    analyzeBrand = () => { },
    gotResult = false,
    result = null,
    expandReviews = () => { },
    expandNegative = false,
    expandNeutral = false,
    expandPositive = false
}) => {
    return (
        <div className="main-panel">
            <p className="heading">Analyze a Brand's Reputation</p>
            <p className="sub-heading">Get real-time sentiment insights from app or store reviews</p>

            <input
                type="text"
                className="url-field"
                placeholder="Enter URL"
                value={brandURL}
                onChange={(e) => setBrandURL(e.target.value)}
            />

            <div className="range-selection">
                <label>Number of latest reviews to Analyze: </label>
                <input
                    type="number"
                    className="review-number-input"
                    value={reviewNumber}
                    onChange={(e) => setReviewNumber(e.target.value)}
                    min="1"
                    max="100"
                />
            </div>

            <button className="fetch-btn" onClick={analyzeBrand}>
                Fetch & Analyze ➜
            </button>

            {gotResult && result && (
                <div className="result-container">
                    <div className="overview">
                        <p className="over-heading">Overview</p>

                        <div className="about-brand">
                            {result?.icon && (
                                <img src={result.icon} alt="Brand" className="brand-image" />
                            )}
                            <div className="about-brand-content">
                                {result?.title && <p>Title: {result.title}</p>}
                                {result?.description && <p>Description: {result.description}</p>}
                            </div>
                        </div>

                        {result?.sentiment_distribution && (
                            <div className="over-results">
                                <div className="sentiment-category">
                                    Negative: {result.sentiment_distribution.negative ?? 0}%
                                </div>
                                <div className="sentiment-category">
                                    Neutral: {result.sentiment_distribution.neutral ?? 0}%
                                </div>
                                <div className="sentiment-category">
                                    Positive: {result.sentiment_distribution.positive ?? 0}%
                                </div>
                            </div>
                        )}

                        <p className="over-text">Most users had a positive experience overall.</p>
                    </div>

                    <div className="suggestions">
                        <p className="over-heading">Suggestions</p>
                        <Suggestions suggestions={result?.suggestions} />
                    </div>

                    <div className="review-breakdown">
                        <p className="over-heading">Manual Analysis</p>

                        <div className="results">
                            <div className="expand-btns">
                                <div className="sentiment-category-e" onClick={() => expandReviews("neg")}>
                                    Negative &gt;
                                </div>
                                <div className="sentiment-category-e" onClick={() => expandReviews("neu")}>
                                    Neutral &gt;
                                </div>
                                <div className="sentiment-category-e" onClick={() => expandReviews("pos")}>
                                    Positive &gt;
                                </div>
                            </div>

                            <div className="reviews">
                                {expandNegative &&
                                    result?.reviews
                                        ?.filter((review) => review?.sentiment === 'NEGATIVE')
                                        ?.map((review, index) => (
                                            <div key={index} className="review">
                                                {review?.review ?? 'No review text'}
                                            </div>
                                        ))}
                                {expandNeutral &&
                                    result?.reviews
                                        ?.filter((review) => review?.sentiment === 'NEUTRAL')
                                        ?.map((review, index) => (
                                            <div key={index} className="review">
                                                {review?.review ?? 'No review text'}
                                            </div>
                                        ))}
                                {expandPositive &&
                                    result?.reviews
                                        ?.filter((review) => review?.sentiment === 'POSITIVE')
                                        ?.map((review, index) => (
                                            <div key={index} className="review">
                                                {review?.review ?? 'No review text'}
                                            </div>
                                        ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;