import React, { useState, useRef, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import axios from "axios";
import './home.css';
import useCurrentUser from "./currentUser";

import Dashboard from "./Home_Component/dashboard";
import History from "./Home_Component/history";
import Report from "./Home_Component/report";
import About from "./Home_Component/about";

const Home = () => {
    const user = useCurrentUser();
    const navigate = useNavigate();

    const [username, setUsername] = useState("User");
    const [profileImageUrl, setProfileImageUrl] = useState("");
    const [brandURL, setBrandURL] = useState("");
    const [reviewNumber, setReviewNumber] = useState(10);

    const [result, setResult] = useState({
        title: "",
        icon: "",
        description: "",
        reviews: [],
        keywords: [],
        sentiment_distribution: {},
        suggestions: []
    });

    const [history, setHistory] = useState([]);
    const [desiredReport, setDesiredReport] = useState([]);

    const [gotResult, setGotResult] = useState(false);

    const [expandNegative, setExpandNegative] = useState(false);
    const [expandNeutral, setExpandNeutral] = useState(false);
    const [expandPositive, setExpandPositive] = useState(false);

    const [toogleSidebar, setToogleSidebar] = useState(false);
    const [viewDashboard, setViewDashboard] = useState(true);
    const [viewHistory, setViewHistory] = useState(false);
    const [viewReport, setViewReport] = useState(false);
    const [viewAbout, setViewAbout] = useState(false);
    const refSidebar = useRef(null);

    useEffect(() => {
        if (user) {

            console.log("Logged in user:", user.email);
            // console.log("User object:", user.uid);

            retrieveUserData();

            // console.log("Photo Url", user.photoURL);

            if (user.photoURL) {
                // console.log("Photo Found");
                setProfileImageUrl(user.photoURL);
            }
            else {
                console.log("Photo not found");
            }

        } else {
            console.log("No user is currently logged in.");

            setProfileImageUrl(null);
        }
    }, [user]);

    const retrieveUserData = async () => {
        try {
            const response = await axios.post("http://localhost:5000/api/users/getUserData", {
                UID: user.uid
            }, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            console.log(`User Name: ${response.data.name}`);
            const firstName = response.data.name.split(" ")[0];
            setUsername(firstName);
        }
        catch (error) {
            console.error("Error Fetching User Data:", error.message);
        }
    };

    const Logout = () => {
        const auth = getAuth();
        signOut(auth)
            .then(() => {
                console.log("User logged out successfully.");

                navigate("/login");
            })
            .catch((error) => {
                console.error("Error during sign out:", error.message);
            });
    };

    const analyzeBrand = async () => {

        setGotResult(false);
        if (!user) {
            console.error("User not logged in. Cannot analyze.");
            return;
        }

        const playStoreRegex = /^https:\/\/play\.google\.com\/store\/apps\/details\?id=[\w\.]+/;
        const mapsRegex = /^https:\/\/www\.google\.[a-z.]+\/maps\/place\/[^\/]+\/@[\d.,z]+\/data=/;

        let brandURLType = "";

        if (playStoreRegex.test(brandURL)) {
            brandURLType = "PlayStoreApp";
        }
        else if (mapsRegex.test(brandURL)) {
            brandURLType = "GoogleMapsPlace";
        }
        else {
            brandURLType = "Unknown Type";
        }

        console.log("Analysis Started");

        try {
            const response = await axios.post("http://localhost:5000/api/nlpApi/analyze", {
                UID: user.uid,
                brandURL,
                brandURLType,
                reviewNumber,
            }, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            console.log("Analysis Report:", response.data);

            setResult({
                title: response.data.title,
                icon: response.data.icon,
                description: response.data.description,
                reviews: response.data.analyzed_reviews,
                keywords: response.data.keywords,
                sentiment_distribution: response.data.sentiment_distribution,
                suggestions: response.data.suggestions
            });

            setGotResult(true);
        }
        catch (error) {
            console.error("Error Fetching User Data:", error.message);
        }
    };

    const expandReviews = (f) => {

        if (f === "neg") {
            setExpandNegative(!expandNegative);
            setExpandNeutral(false);
            setExpandPositive(false);
        }
        else if (f === "neu") {
            setExpandNegative(false);
            setExpandNeutral(!expandNeutral);
            setExpandPositive(false);
        }
        else if (f === "pos") {
            setExpandNegative(false);
            setExpandNeutral(false);
            setExpandPositive(!expandPositive);
        }
    };

    const ToogleSideBar = () => {
        refSidebar.current.style.display = "flex"; // Correct

        setToogleSidebar(!toogleSidebar);
    };

    const ViewDashboard = () => {
        setViewAbout(false);
        setViewReport(false);
        setViewHistory(false);
        setViewDashboard(true);
    }

    const Suggestions = ({ suggestions }) => {
        return (
            <section className="suggestion-section">
                {suggestions.map((s, idx) => {

                    const [rawHeading, ...rest] = s.split(':');
                    const heading = rawHeading.trim();
                    const body = rest.join(':');
                    const points = body.split(/\n-\s*/).filter(Boolean);

                    return (
                        <article key={idx} className="suggestion-block">
                            <h4>{heading}:</h4>
                            <ul>
                                {points.map((p, i) => (
                                    <li key={i}>{p.trim()}</li>
                                ))}
                            </ul>
                        </article>
                    );
                })}
            </section>
        );
    }

    const ViewHistory = async () => {
        setViewAbout(false);
        setViewDashboard(false);
        setViewHistory(true);


        try {
            const historyResponse = await axios.post("http://localhost:5000/api/users/getHistory", {
                UID: user.uid
            }, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            console.log(historyResponse.data["data"]);

            setHistory(historyResponse.data["data"]);

        }
        catch (error) {
            console.error("Error Fetching User Data:", error.message);
        }
    };

    const ViewAbout = () => {
        setViewDashboard(false);
        setViewHistory(false);
        setViewAbout(true);
        setViewReport(false);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const OpenReport = (key) => {

        const selectedReport = history.find(report => report["_id"] === key);

        setDesiredReport(selectedReport);

        setViewHistory(false);
        setViewReport(true);

        console.log(selectedReport);
    }

    const DownloadReport = () => {
        const date = desiredReport["createdAt"];
        const formattedDate = formatDate(date);
        const icon = desiredReport["icon"];
        const title = desiredReport["title"];
        const description = desiredReport["description"];
        const sentiment_distribution = desiredReport["sentiment_distribution"];
        const suggestions = desiredReport["suggestions"];
        const analyzed_reviews = desiredReport["analyzed_reviews"];
    
        const doc = new jsPDF();
        const marginLeft = 20;
        const lineWidth = 170;
        let cursorY = 20;
    
        // Load Icon Image
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = icon;
    
        img.onload = async () => {
            // BrandSight Header
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("BrandSight Report", 105, cursorY, { align: "center" });
            cursorY += 10;
    
            doc.setDrawColor(180);
            doc.line(marginLeft, cursorY, marginLeft + lineWidth, cursorY); // underline
            cursorY += 10;
    
            // Add Brand Icon and Title Side-by-Side
            doc.addImage(img, "PNG", marginLeft, cursorY, 20, 20);
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text(title, marginLeft + 25, cursorY + 8);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Date: ${formattedDate}`, marginLeft + 25, cursorY + 16);
            cursorY += 30;
    
            // Description
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Description", marginLeft, cursorY);
            doc.setDrawColor(220);
            doc.line(marginLeft, cursorY + 2, marginLeft + lineWidth, cursorY + 2);
            cursorY += 8;
    
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            const splitDesc = doc.splitTextToSize(description, lineWidth);
            doc.text(splitDesc, marginLeft, cursorY);
            cursorY += splitDesc.length * 5 + 10;
    
            // Sentiment Distribution
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Sentiment Distribution", marginLeft, cursorY);
            doc.line(marginLeft, cursorY + 2, marginLeft + lineWidth, cursorY + 2);
            cursorY += 8;
    
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Positive: ${sentiment_distribution.positive}%`, marginLeft, cursorY);
            cursorY += 6;
            doc.text(`Neutral: ${sentiment_distribution.neutral}%`, marginLeft, cursorY);
            cursorY += 6;
            doc.text(`Negative: ${sentiment_distribution.negative}%`, marginLeft, cursorY);
            cursorY += 10;
    
            // AI Suggestions
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("AI Suggestions", marginLeft, cursorY);
            doc.line(marginLeft, cursorY + 2, marginLeft + lineWidth, cursorY + 2);
            cursorY += 8;
    
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            suggestions.forEach((sug, idx) => {
                const lines = doc.splitTextToSize(`${idx + 1}. ${sug}`, lineWidth);
                doc.text(lines, marginLeft, cursorY);
                cursorY += lines.length * 5;
            });
            cursorY += 10;
    
            // Analyzed Reviews
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Analyzed Reviews", marginLeft, cursorY);
            doc.line(marginLeft, cursorY + 2, marginLeft + lineWidth, cursorY + 2);
            cursorY += 8;
    
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
    
            analyzed_reviews.forEach((review, idx) => {
                const reviewText = `${idx + 1}. ${review.user} - "${review.review}" [Sentiment: ${review.sentiment}, Rating: ${review.rating}]`;
                const lines = doc.splitTextToSize(reviewText, lineWidth);
    
                if (cursorY + lines.length * 5 > 280) {
                    doc.addPage();
                    cursorY = 20;
                }
    
                doc.text(lines, marginLeft, cursorY);
                cursorY += lines.length * 5;
            });
    
            // Save the PDF
            await doc.save(`${title}_Report.pdf`);
            console.log("PDF Report Downloaded");
        };
    };

    return (
        <>
            <div className="body-division">
                <div className="nav-bar">
                    <div className="menu-button">
                        <img src="/menu-icon.png" alt="Menu" className="icon-image" onClick={ToogleSideBar} />
                        <p className="logo">BrandSight </p>
                    </div>

                    <div className="profile-section">
                        <p className="user-name">{username}</p>
                        <div className="profile-img">
                            <img
                                src={profileImageUrl || "/default-avatar.png"}
                                alt="Profile Image"
                                className="user-image"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    </div>

                </div>

                <div className="sidebar" ref={refSidebar}>
                    <div className="sideBar-left-part">
                        <div className="sidebar-upper">
                            <div className="nav-link-img">
                                <img src="/home-icon.png" alt="Dashboard" className="icon-image" onClick={ViewDashboard} style={{ marginTop: '0px', borderTop: '2px solid black' }} />
                            </div>

                            <div className="nav-link-img">
                                <img src="/history-icon.png" alt="History" className="icon-image" onClick={ViewHistory} />
                            </div>
                            <div className="nav-link-img">
                                <img src="/about.us.png" alt="Analyze" className="icon-image" onClick={ViewAbout} />
                            </div>
                        </div>

                        <div className="sidebar-bottom">
                            <div className="nav-link-img">
                                <img src="/logout-icon1.png" alt="Settings" className="icon-image" onClick={Logout} />
                            </div>
                        </div>
                    </div>

                    <div className="sideBar-right-part">
                        <div className="sidebar-upper">
                            <div className="nav-link-label">
                                {toogleSidebar && <a onClick={ViewDashboard}>Dashboard</a>}
                            </div>
                            <div className="nav-link-label">
                                {toogleSidebar && <a onClick={ViewHistory}>History</a>}
                            </div>
                            <div className="nav-link-label">
                                {toogleSidebar && <a onClick={ViewAbout}>About Us</a>}
                            </div>
                        </div>

                        <div className="sidebar-bottom">
                            <div className="nav-link-label">
                                {toogleSidebar && <a onClick={Logout}>LogOut</a>}
                            </div>
                        </div>
                    </div>
                </div>

                {viewDashboard && (
                    <Dashboard
                        brandURL={brandURL}
                        setBrandURL={setBrandURL}
                        reviewNumber={reviewNumber}
                        setReviewNumber={setReviewNumber}
                        analyzeBrand={analyzeBrand}
                        gotResult={gotResult}
                        result={result}
                        expandReviews={expandReviews}
                        expandNegative={expandNegative}
                        expandNeutral={expandNeutral}
                        expandPositive={expandPositive}
                        DownloadReport={DownloadReport}
                    />
                )}

                {viewHistory && (
                    <History
                        history={history}
                        OpenReport={OpenReport}
                        formatDate={formatDate}
                    />
                )}

                {viewAbout && (
                    <About
                        description="BrandSight is a smart brand analysis platform designed to help businesses understand their online reputation through AI-driven insights. Whether you're listed on the Play Store or Google Maps, BrandSight collects customer reviews, filters out fake feedback, and performs advanced sentiment analysis to generate clear, actionable reports. Our dashboard gives you a visual trend of how your reputation evolves over time, and personalized AI suggestions help you improve customer satisfaction. With optional login, users can save and revisit past analyses anytime. Powered by the MERN stack and advanced NLP models, BrandSight is your go-to tool for brand intelligence made simple."
                        team={[
                            { name: "Harshwardhan Saini", img: "null" },
                            { name: "Amruta Saharkar", img: "amruta Capstone.jpg" },
                            { name: "Rakshit Sawarn", img: "Rakshit Sawarn.png" },
                        ]}
                    />
                )}

                {viewReport && (
                    <Report
                        desiredReport={desiredReport}
                        expandNegative={expandNegative}
                        expandNeutral={expandNeutral}
                        expandPositive={expandPositive}
                        expandReviews={expandReviews}
                        DownloadReport={DownloadReport}
                    />
                )}
            </div>
        </>
    );
};

export default Home;