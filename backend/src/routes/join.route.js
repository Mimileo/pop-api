// backend/src/routes/students.route.js
import express from "express";
import { joinClass } from "../controllers/join.controller.js";

const router = express.Router();


// GET routes
// GET /api/popstock
// * Pagination, Sorting, and Filtering: Handle query parameters for pagination

router.post("/join", joinClass);





export default router;
