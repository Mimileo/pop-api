// backend/src/middleware/protect.route.js
import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";


const protectRoute = async(req, res, next) => {
    try {
        const token = req.cookies.jwt;

        if(!token) {
            return res.status(401).json({ error: "Unauthorized - No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return res.status(401).json({ error: "Unauthorized - Invalid token" });
        }


        // find the user from the database with the decoded id and remove the password from the response
        // select will return only the id, first_name, last_name and email fields
        const user = await prisma.users.findUnique({
            where: {
                id: decoded.userId,
            }, select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
            
                
            }
        });

        if(!user) {
            return res.status(401).json({ error: "User not found" });
        }

        // add the user to the request object
        req.user = user;
        // make the user available to the next middleware
        next();
        
    } catch (error) {
        console.log("Error in protectRoute middleware", error.message);
        res.status(500).json({ error: "Internal server error" });
        
    }
}


export default protectRoute;
