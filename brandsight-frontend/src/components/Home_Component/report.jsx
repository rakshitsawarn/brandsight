import React from 'react';

// Improved Suggestions component with error handling
const Suggestions = ({ suggestions }) => {
    if (!Array.isArray(suggestions)) {
        return <div className="suggestion">No suggestions available</div>;
    }

    return (
        <div className="suggestions-list">
            {suggestions.map((suggestion, index) => (
                <div key={`suggestion-${index}`} className="suggestion">
                    {suggestion || 'No suggestion text'}
                </div>
            ))}
        </div>
    );
};

const Report = ({
    desiredReport = null,
    expandNegative = false,
    expandNeutral = false,
    expandPositive = false,
    expandReviews = () => { },
    DownloadReport = () => { }
}) => {
    // Safe data extraction with defaults
    const safeReport = desiredReport || {};
    const icon = safeReport.icon || '';
    const title = safeReport.title || 'Not available';
    const description = safeReport.description || 'Not available';
    const sentimentDistribution = safeReport.sentiment_distribution || {
        negative: 0,
        neutral: 0,
        positive: 0
    };
    const analyzedReviews = Array.isArray(safeReport.analyzed_reviews)
        ? safeReport.analyzed_reviews
        : [];
    const suggestions = Array.isArray(safeReport.suggestions)
        ? safeReport.suggestions
        : [];

    // Filter reviews safely
    const negativeReviews = analyzedReviews.filter(
        review => review?.sentiment === 'NEGATIVE'
    );
    const neutralReviews = analyzedReviews.filter(
        review => review?.sentiment === 'NEUTRAL'
    );
    const positiveReviews = analyzedReviews.filter(
        review => review?.sentiment === 'POSITIVE'
    );

    return (
        <div className="main-panel">
            <div className="result-container">
                {/* Overview Section */}
                <div className="overview" style={{ marginTop: '0px', marginRight: '5px' }}>
                    <p className='over-heading'>Overview</p>

                    <div className="about-brand">
                        {icon && (
                            <img
                                src={icon}
                                alt="Brand"
                                className="brand-image"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                }}
                            />
                        )}
                        <div className="about-brand-content">
                            <p>Title: {title}</p>
                            <p>Description: {description}</p>
                        </div>
                    </div>

                    <div className='over-results'>
                        <div className='sentiment-category'>
                            Negative: {sentimentDistribution.negative}%
                        </div>
                        <div className='sentiment-category'>
                            Neutral: {sentimentDistribution.neutral}%
                        </div>
                        <div className='sentiment-category'>
                            Positive: {sentimentDistribution.positive}%
                        </div>
                    </div>

                    <p className='over-text'>Most users had a positive experience overall.</p>
                </div>

                {/* Suggestions Section */}
                <div className="suggestions" style={{ marginTop: '20px', marginBottom: '0px', marginRight: '5px' }}>
                    <p className='over-heading'>Suggestions</p>
                    <Suggestions suggestions={suggestions} />
                </div>

                {/* Review Breakdown Section */}
                <div className="review-breakdown" style={{ marginTop: '20px', marginBottom: '20px', marginRight: '5px' }}>
                    <p className='over-heading'>Manual Analysis</p>

                    <div className='results'>
                        <div className="expand-btns">
                            <button
                                className='sentiment-category-e'
                                onClick={() => expandReviews("neg")}
                                aria-label="Show negative reviews"
                            >
                                Negative &gt;
                            </button>
                            <button
                                className='sentiment-category-e'
                                onClick={() => expandReviews("neu")}
                                aria-label="Show neutral reviews"
                            >
                                Neutral &gt;
                            </button>
                            <button
                                className='sentiment-category-e'
                                onClick={() => expandReviews("pos")}
                                aria-label="Show positive reviews"
                            >
                                Positive &gt;
                            </button>
                        </div>

                        <div className="reviews">
                            {expandNegative && negativeReviews.map((review, index) => (
                                <div key={`neg-review-${index}`} className='review'>
                                    {review?.review || 'No review text available'}
                                </div>
                            ))}

                            {expandNeutral && neutralReviews.map((review, index) => (
                                <div key={`neu-review-${index}`} className='review'>
                                    {review?.review || 'No review text available'}
                                </div>
                            ))}

                            {expandPositive && positiveReviews.map((review, index) => (
                                <div key={`pos-review-${index}`} className='review'>
                                    {review?.review || 'No review text available'}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className='download-btn-container'>
                    <button onClick={DownloadReport} className="download-btn">Download Report</button>
                </div> 
            </div>
        </div>
    );
};

export default Report;