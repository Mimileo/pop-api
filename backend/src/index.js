import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/users.route.js";
import studentdentRoutes from "./routes/students.route.js";
import teacherRoutes from "./routes/teachers.route.js";
import classesRoutes from "./routes/classes.route.js";
import joinRoutes from "./routes/popstock.route.js";
import dealsRoutes from "./routes/deals.route.js";
import walletRoutes from "./routes/wallets.route.js";
import filesRoutes from "./routes/files.route.js";
import orderRoutes from "./routes/order.route.js";
import portfolioItemsRoutes from "./routes/portfolioItem.route.js";
import stockRoutes from "./routes/stocks.route.js";
import newsRoutes from "./routes/news.route.js";
import protectRoute from "./middleware/protect.route.js";

dotenv.config();

const app = express();

app.use(cookieParser()); // allows us to use cookies
app.use(express.json()); // allows us to use json

app.use("/api/auth", authRoutes);

// protect this route, should only be accessible if the user is logged and authenticated in
app.use("/api/users",protectRoute, userRoutes);

// protect as suggetsion from code review
// cases where thes should be view by public?
app.use("/api/teacher", protectRoute, teacherRoutes);

app.use("/api/students", protectRoute,studentdentRoutes);

app.use("/api/classes", protectRoute,classesRoutes);

app.use("/api/news", protectRoute, newsRoutes);


app.use("/api/deals", protectRoute,dealsRoutes);

app.use("/api/wallets", protectRoute, walletRoutes);

app.use("/api/files", protectRoute, filesRoutes);

app.use("/api/orders",protectRoute, orderRoutes);

app.use("/api/portfolio_items", protectRoute,portfolioItemsRoutes);

app.use("/api/popstock", protectRoute, joinRoutes);

app.use("/api/stocks", protectRoute, stockRoutes);



// TODO: Get clarification on this
// if this handles user registration than doesn't this handle login what fields will be required
// will email or a password be required?

/*
Description: Create an API endpoint to allow students to register using the code provided by their teacher.

Tasks:

Implement a POST /api/popstock/join endpoint to handle student registration.

Validate the download code and ensure it matches an existing class in the classes table.

Validate that the first_name and last_initial fields are provided.

Create a new student record in the users table if it doesn’t exist.

Insert a record in the student_classes table to associate the student with the class.
*/





app.use("/api/popstock", joinRoutes);

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