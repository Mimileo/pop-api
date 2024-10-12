// backend/src/routes/classes.route.js
import express from "express";
import { addClass, getAllClasses, getClasses, getClassesForTeacher } from "../controllers/classes.controller.js";

// GET /api/classes
const router = express.Router();

router.get("/getAllClasses", getAllClasses);

router.get("/", getClasses);

router.get('/teacher', getClassesForTeacher);

router.post("/addClass", addClass);



export default router;