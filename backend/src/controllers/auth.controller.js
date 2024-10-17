// backend/src/controllers/auth.controller.js
import prisma from "../db/prisma.js";
import bcryptjs from "bcryptjs";
import generateToken from "../utils/generateToken.js";

export const login = async (req, res) => {
   try {
    const { email, password } = req.body;
    const user = await prisma.users.findUnique({ where: { email } });

    if(!user) {
        return res.status(404).json({ error: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcryptjs.compare(password, user.password);

    if(!isPasswordCorrect) {
        return res.status(404).json({ error: "Invalid credentials" });
    }

    generateToken(user.id, res);

    res.status(200).json({ 
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        is_teacher: user.is_teacher,
     });


   } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ error: "Internal server error" });
   }
};

export const logout = (req, res) => {
    try {
        // clear the cookie by setting maxAge to 0 to expire the cookie immediately
       res.cookie("jwt", "", { maxAge: 0 });

       res.status(200).json({ message: "Logout successful" });

    } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const register = async(req, res) => {
    
    try {
        const { firstName, lastName, email, confirmPassword, password, is_teacher, roles} = req.body;
        
        if(!firstName || !lastName || !email || !confirmPassword || !password  || !roles) {
            return res.status(400).json({ error: "All fields are required" });
        }

        if(password !== confirmPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }

        const user = await prisma.users.findUnique({ where: { email } });

        if(user) {
            return res.status(400).json({ error: "User already exists" });
        }

        // create the salt first to be able to hash the password
        const salt = await bcryptjs.genSalt(10);
        // Hash the password
       const hashedPassword = await bcryptjs.hash(password, salt);

       const newUser = await prisma.users.create({
        data: {
            firstName,
            lastName,
            email,
            //last_initial: last_name[0],
            roles,
            password: hashedPassword,
           // is_teacher: is_teacher !== undefined ? is_teacher : false, // Default to false 
        },
    });

    /*
    if (is_teacher) {
        await prisma.teacher.create({
            data: {
                userId: newUser.id, // Connect the teacher to the user
              
            },
        });
    }
        */

       if (newUser) {
        // generate JWT token
        generateToken(newUser.id, res);

        res.status(201).json({ 
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            is_teacher: newUser.is_teacher,
            roles: newUser.roles
         });
       } else{
            res.status(400).json({ error: "Failed to create user" });
    }

    } catch (error) {
        console.log("Error in register: controller", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}
export const getStatus = async(req, res) => {
    try {
        const user = await prisma.users.findUnique({ where: { id: req.user.id } });
        
        if(!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ 
            id: user.id,
            first_name: user.firstName,
            last_name: user.lastName,
            email: user.email,
            is_teacher: user.is_teacher,
            status: "is logged in",
           
         });

    } catch (error) {
        console.log("Error in getStatus controller", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}