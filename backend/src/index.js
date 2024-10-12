import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/users.route.js";
import studentdentRoutes from "./routes/students.route.js";
import teacherRoutes from "./routes/teacher.route.js";
import classesRoutes from "./routes/classes.route.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cookieParser()); // allows us to use cookies
app.use(express.json()); // allows us to use json

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/students", studentdentRoutes);

app.use("/api/teacher", teacherRoutes);

app.use("/api/classes", classesRoutes);



app.get("/", (req, res) => {
    res.send("Hello World!");
    
});

app.listen(5000, () => {
    console.log("Listening on port 5000");
    console.log(process.env.DATABASE_URL);
    console.log(process.env.NODE_ENV);
});