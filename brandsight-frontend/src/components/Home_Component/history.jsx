const History = ({ history, OpenReport, formatDate }) => {
    return (
         <div className="history-panel" style={{ justifyContent: "flex-start" }}>

            {history.map((report) => (
                <div className="reports-container" key={report._id} onClick={() => OpenReport(report._id)}>
                    <div className="report">
                        <img src={report["icon"]} alt="Brand Image" className="brand-image" />
                        <div className="about-brand-content">
                            <p>Title: {report["title"]}</p>
                            <p>Reviews Analyzed: {report["analyzed_reviews"].length}</p>
                            <p>{formatDate(report["createdAt"])}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default History;