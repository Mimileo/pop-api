// backend/src/routes/classes.route.js
import express from "express";
import { addClass, getAllClasses, getClasses, getClassesForTeacher } from "../controllers/classes.controller.js";

// GET /api/classes
const router = express.Router();

// test only for small size database
router.get("/getAllClasses", getAllClasses);

/*
TP6-TP24
https://popstock.atlassian.net/browse/TP-24
GET /api/classes to fetch classes for the logged-in teacher.

Tasks:
Fetch class data and aggregate information such as student count, portfolio values, and performance trends.

*/

router.get("/", getClasses);

router.get('/teacher', getClassesForTeacher);


/*

TP6-TP24
https://popstock.atlassian.net/browse/TP-24
POST /api/classes to add a new class.

Tasks:

Validate the incoming class data and generate a unique download code.

Insert new class into the classes table and return relevant details.
*/
router.post("/addClass", addClass);





export default router;