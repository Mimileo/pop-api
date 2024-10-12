// backend/src/routes/students.route.js
import express from "express";
import {getStudents, getAllStudents, getStudentClasses, addFunds} from "../controllers/students.controller.js";

const router = express.Router();


// GET routes
// GET /api/students
// * Pagination, Sorting, and Filtering: Handle query parameters for pagination

// * Calculate Profit, Loss, and Portfolio Value: Compute financial metrics for students based on transactions or stock history data.
// * Return Paginated List: Ensure that the list of students with details

// Fetch all students with pagination, sorting, and filtering
router.get("/", getStudents);


// Fetch portfolio value, profit, and loss for a specific student
//router.get("/:studentId/portfolio", getStudentPortfolio);

// Fetch classes for a specific student
//
// Get the class names associated with each student.
router.get("/:studentId/classes", getStudentClasses);



// Fetch transaction history for a specific student
//router.get("/:studentId/transaction-history", getStudentTransactionHistory);

// * Fetch student data  Query the users table for students (is_teacher = false).
router.get("/getAllStudents", getAllStudents);

//router.post("/:studentId/add-funds", addFunds);

// Route to add funds to a student's account
router.post('/:studentId/add-funds', addFunds);



export default router;

