import express from "express";
import { getPortfolioItems } from "../controllers/portfolioItem.controller.js";

const router = express.Router();

// GET routes
// GET /api/portfolio-item
router.get("/", getPortfolioItems
);



export default router;