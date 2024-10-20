import express from "express";
import { getWallets } from "../controllers/wallets.controller.js";

const router = express.Router();

// GET routes
// GET /api/wallets
router.get("/", getWallets
);



export default router;