import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { auth } from "../firebase.js";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

import axios from "axios";

import './loginSignUp.css';

const Login = () => {
    const navigate = useNavigate();

    const auth = getAuth();
    const provider = new GoogleAuthProvider();

    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [emailIsValid, setEmailIsValid] = useState(false);
    const [isEmailFocused, setIsEmailFocused] = useState(false);

    const [allFieldsFIlled, setAllFieldsFIlled] = useState(true);
    const [loginSuccess, setLoginSuccess] = useState(true);

    const checkAndSetEmail = (e) => {
        const emailToCheck = e.target.value;

        setEmail(emailToCheck);

        setAllFieldsFIlled(true);
        setLoginSuccess(true);

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const testEmail = emailPattern.test(emailToCheck);

        setEmailIsValid(testEmail);

        if (testEmail) {
            emailRef.current.style.borderColor = "black";
        }
        else {
            emailRef.current.style.borderColor = emailToCheck.length > 0 ? "red" : "black";
        }
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();

        setEmailIsValid(false);
        if (email === "" || password === "") {
            console.log("fields are empty");
            return setAllFieldsFIlled(false);
        }
        else {
            setAllFieldsFIlled(true);
        }
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            console.log("Logged in as:", userCredential.user.email);

            setLoginSuccess(true);

            navigate("/home");
        } catch (error) {
            console.error("Login error:", error.message);

            setLoginSuccess(false);
        }
    }

    const handleGoogleSignIn = async (e) => {
        e.preventDefault();

        setAllFieldsFIlled(true);
        setLoginSuccess(true);

        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            await axios.post("http://localhost:5000/api/users/registerUser", {
                UID: user.uid,
                name: user.displayName,
                email: user.email,
                password: null,
            }, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            console.log("Google user created/logged in:", user.uid, user.displayName, user.email, user.photoURL);

            navigate("/home");
        } catch (error) {
            console.error("Google Sign-Up error:", error.message);
        }
    };

    return (
        <div className="page">
            <div className="left-logo">
                <div className="logo-box">
                    <p className="logo-name">BrandSight </p>
                </div>
            </div>

            <div className="right-container">

                <div className="back-link-container">
                    <Link className="back-link" to="/">&lt; Back</Link>
                </div>

                <div className="content-container">

                    <p className="ls-text">Login</p>

                    <p className="sub-text">Welcome Back!</p>

                    <form onSubmit={handleEmailLogin}>
                        <div className="label-input">
                            <label>Email Address</label>
                            <input
                                className="email-section"
                                type="text"
                                value={email}
                                ref={emailRef}
                                onChange={(e) => checkAndSetEmail(e)}
                                onFocus={() => setIsEmailFocused(true)}
                                onBlur={() => setIsEmailFocused(false)}
                            />
                        </div>

                        {isEmailFocused && email.length > 0 && !emailIsValid && <p className="error-text">Enter Valid Email</p>}

                        <div className="label-input">
                            <label>Password</label>
                            <input
                                className="password-section"
                                type="password"
                                value={password}
                                ref={passwordRef}
                                onChange={(e) => {
                                    setPassword(e.target.value);

                                    setAllFieldsFIlled(true);
                                    setLoginSuccess(true);
                                }}
                            />
                        </div>

                        {!allFieldsFIlled && <p className="error-text">Please fill all fields</p>}

                        {!loginSuccess && <p className="error-text">Email or Password is wrong</p>}

                        <button className="submit-btn" type="submit">Login</button>

                        <div className="line"><span className="or-text">Or</span></div>

                        <button className="google-btn" onClick={handleGoogleSignIn}><img src="https://img.icons8.com/?size=40&id=17949&format=png&color=000000" alt="Google Signin" />SignIn with Google</button>
                    </form>

                    <p className="question">Don't have an account? <Link to="/signup">SignUp</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login;