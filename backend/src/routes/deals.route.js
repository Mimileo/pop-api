import express from "express";
//import { protectRoute } from "../middleware/auth.middleware.js";
import protectRoute from "../middleware/protect.route.js";
import { getDeals } from "../controllers/deals.controller.js";

const router = express.Router();

// deals routes
router.post("/deals", getDeals
);



export default router;