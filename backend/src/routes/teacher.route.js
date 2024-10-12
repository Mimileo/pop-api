// backend/src/routes/teacher.route.js
import express from "express";
import { getProfile } from "../controllers/teacher.controller.js";

const router = express.Router();

router.get("/profile", getProfile);


export default router;