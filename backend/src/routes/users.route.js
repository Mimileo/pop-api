// backend/src/routes/users.route.js
import express from "express";
import { getAllUsers } from "../controllers/users.controller.js";

const router = express.Router();

// GET /api/users

// GET /api/getAllUsers
router.get("/getAllUsers", getAllUsers);


export default router;