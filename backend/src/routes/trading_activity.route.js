import express from "express";
import { getTradingActivity } from "../controllers/trading_activity.controller.js";

const router = express.Router();

// GET routes
// GET /api/trading-activity
router.get("/", getTradingActivity
);



export default router;