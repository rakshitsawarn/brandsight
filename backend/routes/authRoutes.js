import express from "express";
import { signup, login, googleSignIn, currentUser, refresh, logout } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.post("/google", googleSignIn);

router.post("/logout", logout);

router.post("/currentUser", currentUser);
router.post("/refresh", refresh);

export default router;  // <-- default export
