const About = ({ description, team }) => {
    return (
        <div className="main-panel" style={{ justifyContent: "flex-start" }}>
            <h1>About us</h1>
            <p className="para">BrandSight is a smart brand analysis platform designed to help businesses understand their online reputation through AI-driven insights. Whether you're listed on the Play Store or Google Maps, BrandSight collects customer reviews, filters out fake feedback, and performs advanced sentiment analysis to generate clear, actionable reports. Our dashboard gives you a visual trend of how your reputation evolves over time, and personalized AI suggestions help you improve customer satisfaction. With optional login, users can save and revisit past analyses anytime. Powered by the MERN stack and advanced NLP models, BrandSight is your go-to tool for brand intelligence made simple.</p>
            <h1>Our Team</h1>
            <div className="features-container" id="features">
                <div className="features">
                    <div className="feature">
                        <img src="null" alt="Feature 1" />
                        <p>Harshwardhan Saini</p>
                    </div>
                    <div className="feature">
                        <img src="amruta Capstone.jpg" alt="Feature 2" className="definiti" />
                        <p>Amruta Saharkar</p>
                    </div>
                    <div className="feature">
                        <img src="Rakshit Sawarn.png" alt="Feature 3" className="feature_2" />
                        <p>Rakshit Sawarn</p>
                    </div>

                </div>
            </div>


        </div>
    );
};

export default About;