import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import './getStarted.css';

const GetStarted = () => {

    const navigate = useNavigate();

    return (
        <div className="body-content">
            <div className="nav-bar-s">
            <Link to={"/"} className="logo-s"><div>BrandSight</div></Link> 
                <div className="nav-links">
                    <a href="#">Home</a>
                    <a href="#features">Features</a>
                    <a href="#contact">Contact</a>
                </div>
                <div className="nav-links-r">
                    <button className="login-btn" onClick={() => navigate("/login")}>Login</button>
                    {/* <Link  to="/login" >Login</Link> */}
                    <button className="signUp-btn" onClick={() => navigate("/signup")}>SignUp</button>
                </div>
            </div>

            <div className="about">
                <div className="about-container">
                    <div className="about-content">
                        <p className="heading-1">Understand What People Really Think About Your Brand</p>
                        <p className="subHeading-1">Analyze reviews from Google Play and Maps in seconds.</p>
                        <p className="subHeading-1">Get instant insights with sentiment analysis, keyword trends, and growth suggestions.</p>
                    </div>
                    <div className="about-img">
                        <img src="brandsight_logo.png" alt="About Image" />
                    </div>
                </div>
                <button className="startAnalyzing" onClick={() => navigate("/home")} >Start Analyzing ➜</button>

            </div>

            <div className="features-container" id="features">
                <p className="features-container-p">Features</p>
                <div className="features">
                    <div className="feature">
                        <img src="sentiment_analysis.png" alt="Feature 1" />
                        <p>Sentiment Analysis</p>
                    </div>
                    <div className="feature">
                        <img src="fake_Review.png" alt="Feature 2" className="definiti" />
                        <p>Fake Reiew Detection</p>
                    </div>
                    <div className="feature">
                        <img src="smart_suggestions.png" alt="Feature 3" className="feature_2" />
                        <p>Smart Suggestions</p>
                    </div>
                    
                </div>
            </div>

            {/* <div className="working">
            <p>How It Works</p>
            <div className="steps">
                <div className="step">Enter brand URL</div>⇨
                <div className="step">Fetch reviews</div>⇨
                <div className="step">Sentiment Analysis</div>⇨
                <div className="step">Get insights and suggestions</div>
            </div>
        </div>  */}

            <div className="contact" id="contact">
                <p>Contact</p>
                <div className="contact-content">
                    <div className="contactInfo">
                        <div className="map-container">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3524.0610440999817!2d76.3988908742977!3d27.961416676037828!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396db6d381bd8a09%3A0x5cd01de55b1d2c65!2sNIIT%20University!5e0!3m2!1sen!2sin!4v1745913730673!5m2!1sen!2sin"
                                title="NIIT University"
                                style={{ border: "0", width: "100%", height: "100%" }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>
                    </div>

                    <div className="contact-container">
                        <div className="contact-details">
                            <p>Contact Us</p>
                        </div>

                        <form>
                            <div className="label-input1">
                                <label>Email</label>
                                <input type="text" />
                            </div>
                            <div className="label-input1">
                                <label>Message</label>
                                <textarea rows="5"></textarea>
                            </div>
                            <button type="submit" className="send-btn">Send Message</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GetStarted;
