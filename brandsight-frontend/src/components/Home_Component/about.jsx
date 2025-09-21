import "./about.css";

const About = ({ description, team }) => {
    return (
        <div id="about-main-panel">
            <h1 className="about-title">About Us</h1>
            <p className="about-description">
                BrandSight is a smart brand analysis platform designed to help businesses understand their online reputation through AI-driven insights. Whether you're listed on the Play Store or Google Maps, BrandSight collects customer reviews, filters out fake feedback, and performs advanced sentiment analysis to generate clear, actionable reports. Our dashboard gives you a visual trend of how your reputation evolves over time, and personalized AI suggestions help you improve customer satisfaction. With optional login, users can save and revisit past analyses anytime. Powered by the MERN stack and advanced NLP models, BrandSight is your go-to tool for brand intelligence made simple.
            </p>
            
            <h1 className="team-title">Our Team</h1>
            
            <div id="team-features-container">
                <div className="team-features">
                    <div className="team-member">
                        <img src="harshwardhan.jpg" alt="Harshwardhan Saini" />
                        <p>Harshwardhan Saini</p>
                    </div>
                    <div className="team-member">
                        <img src="amruta Capstone.jpg" alt="Amruta Saharkar" />
                        <p>Amruta Saharkar</p>
                    </div>
                    <div className="team-member1">
                        <img src="Rakshit_Sawarn.png" alt="Rakshit Sawarn" />
                        <p>Rakshit Sawarn</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;