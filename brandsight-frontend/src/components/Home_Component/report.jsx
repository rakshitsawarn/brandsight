import { useState } from "react";

const Suggestions = ({ suggestions }) => {
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
        return <div className="suggestion">No suggestions available</div>;
    }

    const header = suggestions[0]; // Intro line
    const items = suggestions.slice(1);

    const structured = [];
    let currentMain = null;

    items.forEach((line) => {
        const cleanLine = line.trim().replace(/^\*+\s*/, ""); // Remove leading *s

        const boldMatch = cleanLine.match(/^\*\*(.*?)\*\*(.*)?$/);
        if (boldMatch) {
            if (currentMain) structured.push(currentMain);
            currentMain = {
                title: boldMatch[1].trim(),
                subpoints: boldMatch[2] ? [boldMatch[2].trim()] : []
            };
        } else if (cleanLine.length > 0) {
            if (!currentMain) currentMain = { title: "", subpoints: [] };
            currentMain.subpoints.push(cleanLine);
        }
    });

    if (currentMain) structured.push(currentMain);

    return (
        <div className="suggestions-list">
            <p className="suggestion-header">{header}</p>
            <ul className="suggestion-ul">
                {structured.map((item, idx) => (
                    <li key={`main-${idx}`} className="suggestion-item">
                        {item.title && <strong>{item.title}</strong>}
                        {item.subpoints.length > 0 && (
                            <ul className="suggestion-subul">
                                {item.subpoints.map((sub, subIdx) => (
                                    <li key={`sub-${idx}-${subIdx}`} className="suggestion-subitem">
                                        {sub}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const Report = ({
    desiredReport = null,
    expandReviews = () => { },
    DownloadReport = () => { }
}) => {
    const [expanded, setExpanded] = useState({ neg: false, neu: false, pos: false });

    const toggleExpand = (category) => {
        setExpanded(prev => ({ ...prev, [category]: !prev[category] }));
        expandReviews(category);
    };

    const safeReport = desiredReport || {};
    const icon = safeReport.icon || '';
    const title = safeReport.title || 'Not available';
    const description = safeReport.description || 'Not available';
    const sentimentDistribution = safeReport.sentiment_distribution || {
        negative: 0,
        neutral: 0,
        positive: 0
    };
    const analyzedReviews = Array.isArray(safeReport.analyzed_reviews) ? safeReport.analyzed_reviews : [];
    const suggestions = Array.isArray(safeReport.suggestions) ? safeReport.suggestions : [];

    const negativeReviews = analyzedReviews.filter(r => r?.sentiment === 'NEGATIVE');
    const neutralReviews = analyzedReviews.filter(r => r?.sentiment === 'NEUTRAL');
    const positiveReviews = analyzedReviews.filter(r => r?.sentiment === 'POSITIVE');

    return (
        <div className="reports-panel">
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
                                onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                            />
                        )}
                        <div className="about-brand-content">
                            <p>Title: {title}</p>
                            <p>Description: {description}</p>
                        </div>
                    </div>
                    <div>
                        <div className='sentiment-category'>Negative: {sentimentDistribution.negative}%</div>
                        <div className='sentiment-category'>Neutral: {sentimentDistribution.neutral}%</div>
                        <div className='sentiment-category'>Positive: {sentimentDistribution.positive}%</div>
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
                            {['neg', 'neu', 'pos'].map((cat) => {
                                const label = cat === 'neg' ? 'Negative' : cat === 'neu' ? 'Neutral' : 'Positive';
                                return (
                                    <button
                                        key={cat}
                                        className='sentiment-category-e'
                                        onClick={() => toggleExpand(cat)}
                                        aria-label={`Show ${label.toLowerCase()} reviews`}
                                    >
                                        {label}{" "}
                                        <img
                                            src="https://img.icons8.com/?size=100&id=R52ioYgkCvz6&format=png&color=1A1A1A"
                                            alt="expand-folders"
                                            className={`expand-btn ${expanded[cat] ? 'rotated' : ''}`}
                                        />
                                    </button>
                                );
                            })}
                        </div>

                        <div className="reviews">
                            {expanded.neg && negativeReviews.map((r, idx) => <div key={idx} className='review'>{r?.review || 'No review text available'}</div>)}
                            {expanded.neu && neutralReviews.map((r, idx) => <div key={idx} className='review'>{r?.review || 'No review text available'}</div>)}
                            {expanded.pos && positiveReviews.map((r, idx) => <div key={idx} className='review'>{r?.review || 'No review text available'}</div>)}
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
