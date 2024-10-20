import expresss from "express";
import { getNews } from "../controllers/news.controller.js";

const router = expresss.Router();

router.get("/", getNews);



export default router;