// backend/src/routes/auth.route.js
import express from "express";
//import { protectRoute } from "../middleware/auth.middleware.js";
import { login, logout, register, getStatus } from "../controllers/auth.controller.js";
import protectRoute from "../middleware/protect.route.js";

const router = express.Router();

// public routes
router.post("/login", login);

router.post("/logout", logout);

router.post("/register", register);

router.get("/status", protectRoute, getStatus);






//router.post("/refresh-token", refreshToken);
//router.get("/profile", protectRoute, getProfile);


export default router;