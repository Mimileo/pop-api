import express from "express";
import { getOrders } from "../controllers/orders.controller.js";

const router = express.Router();

// GET routes
// GET /api/orders
router.get("/", getOrders
);



export default router;