import express from "express";
import { getFiles } from "../controllers/files.controller.js";
const router = express.Router();

// files routes
router.post("/files", getFiles
);



export default router;