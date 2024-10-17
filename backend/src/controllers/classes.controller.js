// backend/src/controllers/classes.controller.js
import { PrismaClient } from '@prisma/client';

import  { aggregateClassData }  from '../utils/classes/aggregate.utils.js';



const prisma = new PrismaClient();

function generateDownloadCode() {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const randomDigits = Math.random().toString(36).substring(2, 8).toUpperCase(); // Shorter alphanumeric

    return `${month}-${year}-${randomDigits}`;
}


export const getClassesForTeacher = async (req, res) => {
    try {
        const { teacherId } = req.body;
        const classes = await prisma.class.findMany({
            where: { teacher_id: teacherId },
        });
        res.status(200).json(classes);
    } catch (error) {
        console.error("Error retrieving classes:", error);
        res.status(500).json({ error: "An error occurred while retrieving classes" });
    }
};


export const getAllClasses = async (req, res) => {
    try {
        // Fetch all classes with basic data
        const classes = await prisma.class.findMany({
            select: {
                id: true,
                name: true,
                download_code: true,
                created_at: true,
                updated_at: true,
                teacher: {
                    select: {
                        user: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                        district: true,
                        school: true,
                    },
                },
            },
        });

        // Return the retrieved classes
        res.status(200).json({
            message: "Classes retrieved successfully",
            classes,
        });
    } catch (error) {
        console.error("Error retrieving classes:", error);
        res.status(500).json({ error: "An error occurred while retrieving classes" });
    }
};

export const getClasses = async (req, res) => {
    try {
        // Fetch all classes with related teacher and student data
        const classes = await prisma.class.findMany({
            include: {
                teacher: {
                    include: {
                        user: true, // Include user details associated with the teacher
                    },
                },
                studentClasses: {
                    include: {
                        student: {
                            include: {
                                transactions: true, // Include transactions for portfolio calculations
                            },
                        },
                    },
                },
            },
        });

        // Aggregate data per class
        const classData = aggregateClassData(classes);

        // Return success response with the aggregated data
        res.status(200).json({
            message: "Classes retrieved successfully",
            classes: classData,
        });
    } catch (error) {
        console.error("Error fetching classes:", error);
        res.status(500).json({ error: "An error occurred while fetching classes" });
    }
};



/*
POST /api/classes
Description: Create a new class and generate a unique download code.
Implementation:
Validate the class name and other input data.
Generate a unique download code using the format MM-YY-XXXXXX (Month-Year-6 random digits).
Insert the new class into the classes table with the generated download code.

classes
id (SERIAL PRIMARY KEY)
teacher_id (INTEGER REFERENCES teachers(id) ON DELETE CASCADE)
name (VARCHAR NOT NULL)
download_code (VARCHAR UNIQUE NOT NULL, used by students to join the class)
created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)


*/
export const addClass = async (req, res) => {
    const {  className } = req.body;
    // add other inputs: teacher_id

    // Validate class name
    if (!className || !teacher_id) {
        return res.status(400).json({ error: "Teacher ID and Class name is required" });
    }



    try {
        // Function to generate download code
       /* const generateDownloadCode = () => {
            const currentMonthYear = dayjs().format("MM-YY"); // Get MM-YY format
            const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase(); // Random alphanumeric string
            return `${currentMonthYear}-${randomPart}`;
        };*/

        let downloadCode = generateDownloadCode();
        
        // Ensure the download code is unique
        let isUnique = false;
        while (!isUnique) {
            const existingClass = await prisma.class.findUnique({
                where: {
                    download_code: downloadCode,
                },
            });

            if (!existingClass) {
                isUnique = true;
            } else {
                downloadCode = generateDownloadCode(); // Regenerate if not unique
            }
        }

        // Insert the new class with the unique download code
        const newClass = await prisma.class.create({
            data: {
                name: className,
                download_code: downloadCode,
                teacher_id: teacher_id, 
            },
            include: {
                teacher: {
                    include: {
                        user: true, // Include the user info related to the teacher
                    },
                },
            },
        });

        const teacher = await prisma.teacher.findUnique({
            where: {
                id: teacher_id,
            },
            include: {
                user: true, // Include the user info related to the teacher
            },
        })

        if (!teacher) {
            return res.status(404).json({ error: "Teacher not found" });
        }

        // Return success response with class details and download code
        res.status(201).json({
            
            message: "Class created successfully",
            class: newClass,
            teacher_id: teacher_id,
            downloadCode: downloadCode, 
            // TODO: Add more fields for details
        });
    } catch (error) {
        console.error("Error adding class:", error);
        res.status(500).json({ error: "An error occurred while adding the class" });
    }
};


