// backend/src/routes/students.route.js
import express from "express";
import {getStudents, getAllStudents, getStudentClasses, addFunds, getStudentBalance, getStudentActivity} from "../controllers/students.controller.js";

const router = express.Router();


// GET routes
// GET /api/students
// * Pagination, Sorting, and Filtering: Handle query parameters for pagination

// * Calculate Profit, Loss, and Portfolio Value: Compute financial metrics for students based on transactions or stock history data.
// * Return Paginated List: Ensure that the list of students with //details

// Fetch all students with pagination, sorting, and filtering

// https://popstock.atlassian.net/browse/TP-8
router.get("/", getStudents);





// Fetch portfolio value, profit, and loss for a specific student
//router.get("/:studentId/portfolio", getStudentPortfolio);

/* TP-6 - TP-23

https://popstock.atlassian.net/browse/TP-23?atlOrigin=eyJpIjoiMjdjODJiNmY1OTg5NDNiZWIzOTQ5ODI1MzcxMDkyNzkiLCJwIjoiaiJ9
Description: Implement the GET /api/students/:studentId endpoint to return detailed student information.

Tasks:

Fetch student data including full name, class, and performance metrics.

Calculate diversification, Sharpe Ratio, and portfolio value over time.

Fetch and return the transaction history.

*/



router.get("/:studentId", getStudentClasses);


/*
TP6 - TP32
https://popstock.atlassian.net/browse/TP-32
Description: Extend the /api/students/:studentId endpoint to provide the student's current funds balance.

Tasks:

Fetch the balance from the users or student_funds table.

Return the balance information in the API response.
// pactice separation of concerns so the endpoint for  /api/students/:studentId should be 
// ralted to StudentBalance so it should be /api/students/:studentId/balance
// this allows  separation of concerns and modularity


*/
router.get("/:studentId/balance", getStudentBalance);

// Fetch transaction history for a specific student
//router.get("/:studentId/transaction-history", getStudentTransactionHistory);

// * Fetch student data  Query the users table for students (is_teacher = false).
router.get("/getAllStudents", getAllStudents);

//router.post("/:studentId/add-funds", addFunds);


// https://popstock.atlassian.net/browse/TP-8
// Route to add funds to a student's account
/*
TP-6 TP8
POST /api/students/:studentId/add-funds

Validate studentId and amount

Find student in users

Update portfolioValue (or dedicated funds field)

Optionally log the transaction

Return success/error response


*/





router.post('/:studentId/add-funds', addFunds);

/* TP6-TP30
Description - Calculate Student Activity Level

Description: Implement logic to calculate the student's activity level based on the number of trades made compared to the previous day.

Tasks:

Fetch the total number of trades made by the student on the current day and the previous day from the transactions table.

Calculate the activity level as a percentage, ensuring it does not exceed 100%.

Update the /api/students/:studentId endpoint to include this activity level.
*/

router.get('/:studentId/activity', getStudentActivity);




export default router;