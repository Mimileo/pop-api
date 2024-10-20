import expresss from "express";
import { getStocks } from "../controllers/stocks.controller.js";

const router = expresss.Router();

// GET routes
// GET /api/stocks
router.get("/", getStocks);



export default router;