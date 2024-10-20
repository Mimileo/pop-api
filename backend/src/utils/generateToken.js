// backend/src/utils/generateToken.js
import jwt from "jsonwebtoken";

const generateToken = (userId, res) => {

    // generate token with userId and JWT_SECRET    by signing the userId with JWT_SECRET
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
		expiresIn: "15d",
	});

    // from the response send the token in a cookie with a maxAge of 15 days
    
    res.cookie("jwt", token, {
        maxAge: 15*24*60*60*1000, // Max age of the cookie in milliseconds
        httpOnly: true, //Javascript cannot access the cookie and prevent XSS cross-site scripting
        sameSite: "strict", // prevent CSRF attacks cross-site request forgery
        secure: process.env.NODE_ENV !== "development", // cookie only works in HTTPS or only development for testing
    })  

	return token;
};




export default generateToken;