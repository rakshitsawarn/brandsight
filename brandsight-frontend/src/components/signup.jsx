import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { auth } from "../firebase.js";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

import axios from "axios";

import './loginSignUp.css'

const SignUp = () => {
    const navigate = useNavigate();

    const auth = getAuth();
    const provider = new GoogleAuthProvider();

    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const confirmPasswordRef = useRef(null);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [passwordRule, setPasswordRules] = useState({
        length: false,
        letter: false,
        number: false,
        specialChar: false
    });

    const [emailIsValid, setEmailIsValid] = useState(false);
    const [passwordNotMatched, setPasswordNotMatched] = useState(true);

    const [allValid, setAllValid] = useState(false);

    const [isEmailFocused, setIsEmailFocused] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);

    const [allFieldsFIlled, setAllFieldsFIlled] = useState(true);
    const [signupSuccess, setSignupSuccess] = useState(true);

    const checkAndSetEmail = (e) => {
        const emailToCheck = e.target.value;
        setEmail(emailToCheck);

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

    const checkAndSetPassword = (e) => {
        setPassword(e.target.value);

        const passToCheck = e.target.value;

        const newRules = {
            length: passToCheck.length >= 8,
            letter: /[A-Za-z]/.test(passToCheck),
            number: /\d/.test(passToCheck),
            specialChar: /[@_!#$%^&*.,?]/.test(passToCheck)
        };

        setPasswordRules(newRules);

        setAllValid(Object.values(newRules).every(Boolean))

        if (allValid || passToCheck.length === 0) {
            passwordRef.current.style.borderColor = "black";
        } else {
            passwordRef.current.style.borderColor = "red";
        }
    };

    const checkAndSetConfirmPassword = (e) => {
        setConfirmPassword(e.target.value);

        const passTomatch = e.target.value;

        if (password === passTomatch) {
            setPasswordNotMatched(false);
            confirmPasswordRef.current.style.borderColor = "black";
        }
        else {
            setPasswordNotMatched(true);
            confirmPasswordRef.current.style.borderColor = passTomatch.length > 0 ? "red" : "black";
        }
    };

    const handleEmailSignUp = async (e) => {
        e.preventDefault();

        if (name === "" || email === "" || password === "" || confirmPassword === "") {
            console.log("fields are empty");
            return setAllFieldsFIlled(false);
        }
        else {
            setAllFieldsFIlled(true);
        }

        if (emailIsValid || allValid){
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
    
                const avatarUrl =  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&length=1&background=random&font-size=0.7`;
                await updateProfile(user, {
                    // displayName: name,
                    photoURL: avatarUrl,
                });
    
                await axios.post("http://localhost:5000//api/auth/signup", {
                    UID: user.uid,
                    name,
                    email,
                    password,
                }, {
                    headers: {
                        "Content-Type": "application/json",   
                    },
                });
    
                // const res = await axios.post(`http://localhost:5000/api/auth/login`, { email, password }, { withCredentials: true });

                console.log("User created as:", userCredential.user.email, userCredential.user.photoURL);
    
                setSignupSuccess(true);
    
                navigate("/login");
            }
            catch (error) {
                setSignupSuccess(false);
    
                console.error("SignUp error:", error.message);
            }
        }
        else{
            setSignupSuccess(false);
        }
    };

    const handleGoogleSignIn = async (e) => {
        e.preventDefault();

        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // console.log("User Details: ", user);

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

            console.log("Google user created/logged in:", user.displayName, user.email, user.photoURL);

            
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

                    <p className="ls-text">SignUp</p>

                    <p className="sub-text">Welcome!</p>

                    <form onSubmit={handleEmailSignUp}>
                        <div className="label-input">
                            <label>Name</label>
                            <input
                                className="name-section"
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>

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

                        {isEmailFocused && email.length > 0 && !emailIsValid && <p className="error-text">Enter Valid Email Address</p>}

                        <div className="label-input">
                            <label>Password</label>
                            <input
                                className="password-section"
                                type="password"
                                value={password}
                                ref={passwordRef}
                                onChange={(e) => checkAndSetPassword(e)}
                                onFocus={() => setIsPasswordFocused(true)}
                                onBlur={() => setIsPasswordFocused(false)}
                            />
                        </div>

                        {isPasswordFocused && password.length > 0 && (
                            !passwordRule.length && <p className="error-text">At least 8 characters</p> ||
                            !passwordRule.letter && <p className="error-text">Includes a letter</p> ||
                            !passwordRule.number && <p className="error-text">Includes a number</p> ||
                            !passwordRule.specialChar && <p className="error-text">Includes a special character</p>
                        )}

                        <div className="label-input">
                            <label>Confirm Password</label>
                            <input
                                className="password-section"
                                type="password"
                                value={confirmPassword}
                                ref={confirmPasswordRef}
                                onChange={(e) => checkAndSetConfirmPassword(e)}
                                onFocus={() => setIsConfirmPasswordFocused(true)}
                                onBlur={() => setIsConfirmPasswordFocused(false)}
                            />
                        </div>

                        {isConfirmPasswordFocused && confirmPassword.length > 0 && passwordNotMatched && <p className="error-text">Passwords don't match</p>}

                        {name.length === 0 && email.length === 0 && password.length === 0 && confirmPassword.length === 0 && !allFieldsFIlled && <p className="error-text">Please fill all fields</p>}

                        {!signupSuccess && <p className="error-text">SignUp Failed!</p>}

                        <button className="submit-btn" type="submit">Create Account</button>

                        <div className="line"><span className="or-text">Or</span></div>

                        <button className="google-btn" onClick={handleGoogleSignIn}><img src="https://img.icons8.com/?size=40&id=17949&format=png&color=000000" alt="Google Signin" />SignIn with Google</button>
                    </form>

                    <p className="question">Already have an account? <Link to="/login">Login</Link></p>
                </div>
            </div>
        </div>
    );
};

export default SignUp;