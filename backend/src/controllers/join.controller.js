// backend/src/controllers/join.controller.js
import prisma from "../db/prisma.js"; 
import bcryptjs from "bcryptjs";
import { sendEmail } from '../config/sendgrid.js'; 



const generateRandomPassword = (length = 8) => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return password;
};


export const joinClass = async (req, res) => {
    const { first_name, last_initial, email, downloadCode } = req.body;

    try {
        // Ensure all required fields are provided
        if (!first_name || !last_initial || !email || !downloadCode) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Check if the download code matches an existing class
        const classData = await prisma.classes.findUnique({
            where: { download_code: downloadCode }
        });

        if (!classData) {
            return res.status(400).json({ error: "Invalid download code" });
        }

        // Check if the user already exists
        let newUser;
        const existingUser = await prisma.users.findUnique({ where: { email } });


        let randomPassword;

        if (!existingUser) {
            // Generate and hash a random password
            randomPassword = generateRandomPassword();
            const hashedPassword = await bcryptjs.hash(randomPassword, 10);

            // Create the new student user with the random password
           
            newUser = await prisma.users.create({
                data: {
                    first_name,
                    firstName: first_name,
                    last_initial,
                    email,
                    password: hashedPassword,
                    roles: "student",
                    is_teacher: false
                }
            });

            //newUser.firstName = first_name;

            // send the random password to the student's email
            sendEmail(email, "Your new account password", `Your temporary password is: ${randomPassword}`);

             // Send email with the random password
             await sendEmail(
                email,
                "Welcome to Popstock",
                `Your temporary password is: ${randomPassword}`,
                `<strong>Your temporary password is: ${randomPassword}</strong>`
            );

        } else {
            newUser = existingUser;
        }

        // Check if the student is already associated with the class
        const studentClassExists = await prisma.student_classes.findUnique({
            where: {
                student_id_class_id: { student_id: newUser.id, class_id: classData.id }
            }
        });

        if (studentClassExists) {
            return res.status(400).json({ error: "Student is already registered in this class" });
        }

        // Associate the student with the class
        await prisma.student_classes.create({
            data: {
                student_id: newUser.id,
                class_id: classData.id
            }
        });

        res.status(200).json({
            message:  `${first_name} has been added to ${classData.name}.`,
            student: { id: newUser.id, first_name, last_initial, email , randomPassword}
        });
    } catch (error) {
        console.error("Error in student registration:", error);
        res.status(500).json({ error: "An error occurred while registering the student" });
    }
};

/*
export const joinClass = async (req, res) => {
    const { downloadCode, first_name, last_initial } = req.body;

    // check if all fields are filled
    if (!downloadCode || !first_name || !last_initial) {
        return res.status(400).json({ error: "All fields (downloadCode, first_name, last_initial) are required." });
    }

    try {
        //check if there is a class wiht the download code provided in the request
        const classToJoin = await prisma.class.findUnique({
            where: { download_code: downloadCode },
            include: {
                teacher: true,  // Include teacher data 
            },
        });

        if (!classToJoin) {
            return res.status(404).json({ error: "Class with this download code was not found." });
        }

        // Check if the student already exists
        let student = await prisma.user.findFirst({
            where: {
                first_name: {
                    equals: first_name,
                    mode: 'insensitive'
                },
                last_initial: {
                    equals: last_initial,
                    mode: 'insensitive'
                },

            },
        });

        // If student does not exist, create user
        if (!student) {
            student = await prisma.user.create({
                data: {
                    first_name,
                    last_initial,
                    is_teacher: false, // make the user a student
                    email: null, 
                },
            });
        }

        // Check if student is already in the class
        const isStudentInClass = await prisma.studentClass.findUnique({
            where: {
                student_id_class_id: {
                    student_id: student.id,
                    class_id: classToJoin.id,
                },
            },
        });

        // if student is already in the class, return error
        if (isStudentInClass) {
            return res.status(400).json({ error: "Student is already registered in this class." });
        }

        // add student to the class
        await prisma.studentClass.create({
            data: {
                student_id: student.id,
                class_id: existingClass.id,
            },
        });

        // Return success response
        return res.status(200).json({ message: "Student successfully joined the class." });

    } catch (error) {
        console.error("Error joining class: ", error.message);
        return res.status(500).json({ error: "Internal server error." });
    }
};
*/