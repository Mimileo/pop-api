// backend/src/controllers/join.controller.js
import prisma from "../db/prisma.js"; 

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
