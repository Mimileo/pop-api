// backend/src/routes/teacher.route.js
import express from "express";
import { getProfile } from "../controllers/teacher.controller.js";


const router = express.Router();


/*

Description TP-6 - TP -25

Description: Implement the following endpoints:

GET /api/teacher/profile to fetch the teacher's profile details.

*/




router.get("/profile", getProfile);

/*
Description TP-6 - TP -25
PUT /api/teacher/profile to update the teacher's profile.

Tasks:

Create a form handler for updating teacher details like name, email, district, and school.

*/

router.get("/profile", getProfile);


export default router;