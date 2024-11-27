// backend/src/routes/teacher.route.js
import express from "express";
import { getAllTeachers, getProfile, updateProfile } from "../controllers/teacher.controller.js";

const router = express.Router();

// Fetch all teachers (if needed for other purposes)
router.get("/getAllTeachers", getAllTeachers);

// Fetch a teacher's profile
router.get("/profile", getProfile);

// Update a teacher's profile
router.put("/profile", updateProfile);

export default router;
