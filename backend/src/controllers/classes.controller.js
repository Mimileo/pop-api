// backend/src/controllers/classes.controller.js
import prisma from "../db/prisma.js";
import  { aggregateClassData }  from '../utils/classes/aggregate.utils.js';





function generateDownloadCode() {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const randomDigits = Math.random().toString(36).substring(2, 8).toUpperCase(); 
    return `${month}-${year}-${randomDigits}`;
}


export const getClassesForTeacher = async (req, res) => {
    try {
        const { teacherId } = req.body;

        if (!teacherId) {
            return res.status(400).json({ error: "Teacher ID is required" });
        }

        const  teacher = await prisma.teachers.findUnique({
            where: { id: teacherId },
        });

        if (!teacher) {
            return res.status(404).json({ error: "Teacher not found" });
        }

        const classes = await prisma.classes.findMany({
            where: { teacher_id: teacherId },
        });

        if (classes.length === 0) {
            return res.status(404).json({ error: "No classes found for this teacher" });
        }

        res.status(200).json(classes);
    } catch (error) {
        console.error("Error retrieving classes:", error);
        res.status(500).json({ error: "An error occurred while retrieving classes" });
    }
};


export const getStudentsForClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const req_class = await prisma.classes.findUnique({
            where: { id: classId }, 
            include: {
                student_classes: {
                    include: {
                        users: {  // students
                            select: {  // selct what will be returned
                                first_name: true,
                                last_initial: true,
                                email: true, 
                                is_teacher: false,// return only users with is_teacher set to false
                            },
                        },
                    },
                },
            },
        });

        if (!req_class) {
            return res.status(404).json({ error: "Requested Class not found" });
        }

        if (req_class.student_classes.length === 0) {
            return res.status(200).json({
                 classId: req_class.id, 
                 className: req_class.name,
                 students: [], 
                 message: "No students registered for this class." });
        } 

        const students = req_class.student_classes.map(sc => ({
            ...sc.users, // Spread the user details
            student_class_id: sc.id, // If you want to include the join table id
        }));

        return res.status(200).json({ 
            classId: req_class.id, 
            className: req_class.name,
             students 
        });
    

    } catch (error) {
        console.error("Error retrieving class:", error);
        res.status(500).json({ error: "An error occurred while retrieving classes" });
    }
};


export const getAllClasses = async (req, res) => {
    try {
        // Fetch all classes with basic data
        const classes = await prisma.classes.findMany({
            select: {
                id: true,
                name: true,
                download_code: true,
                created_at: true,
                updated_at: true,
                
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
        const classes = await prisma.classes.findMany({
            include: {
               teachers: true,
               student_classes: {
                    include: {
                        users: {
                            include: {
                                transactions: true, // Include transactions for portfolio calculations
                            },
                        },
                    },
                },
            },
        });

        // Aggregate data per class

        if (!classes || classes.length === 0) {
            return res.status(404).json({ error: "No classes found" });
        }
        //const classData = aggregateClassData(classes);

        // Return success response with the aggregated data
        res.status(200).json({
            message: "Classes retrieved successfully",
            classes: classes,
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
    const { className, teacher_id } = req.body;

    if (!className || !teacher_id) {
        return res.status(400).json({ error: "Class name and teacher ID are required" });
    }

    try {
        // Ensure the teacher exists
        const teacher = await prisma.teachers.findUnique({
            where: { id: teacher_id },
        });
        if (!teacher) {
            return res.status(404).json({ error: "Teacher not found" });
        }

        // Generate unique download code with attempts limit
        let downloadCode;
        let attempts = 0;
        do {
            downloadCode = generateDownloadCode();
            const existingClass = await prisma.classes.findUnique({
                where: { download_code: downloadCode },
            });
            if (!existingClass) break;
        } while (++attempts < 10);

        if (attempts >= 10) {
            throw new Error("Failed to generate a unique download code");
        }

        // Create new class
        const newClass = await prisma.classes.create({
            data: {
                name: className,
                download_code: downloadCode,
                teacher_id,
            },
        });

         if (!newClass) {
            return res.status(500).json({ error: "Failed to create class" });
        }

        res.status(201).json({
            message: "Class created successfully",
            class: newClass,
        });
    } catch (error) {
        console.error("Error adding class:", error);
        res.status(500).json({ error: "An error occurred while adding the class" });
    }
};


export const calculateClassConsistency = async (classId, studentActivityLevel) => {
    try {
        // Fetch each student's trades over today and yesterday (based on EST), grouped by student
        const classStudents = await prisma.transactions.groupBy({
            by: ['student_id'],
            where: { class_id: classId },
            _count: true,
        });

        // Define EST day range helper function (you can import this if it's defined elsewhere)
        const getESTDayRange = (utcDate) => {
            const estOffset = -5 * 60;
            const start = new Date(utcDate);
            start.setUTCMinutes(start.getUTCMinutes() + estOffset);
            start.setUTCHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setUTCHours(23, 59, 59, 999);
            return { start, end };
        };

        const now = new Date();
        const { start: todayStart, end: todayEnd } = getESTDayRange(now);
        const yesterdayDate = new Date(now);
        yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
        const { start: yesterdayStart, end: yesterdayEnd } = getESTDayRange(yesterdayDate);

        // Calculate activity level for each student in the class
        const activityLevels = await Promise.all(classStudents.map(async (student) => {
            const tradesToday = await prisma.transactions.count({
                where: {
                    student_id: student.student_id,
                    timestamp: { gte: todayStart, lt: todayEnd },
                },
            });

            const tradesYesterday = await prisma.transactions.count({
                where: {
                    student_id: student.student_id,
                    timestamp: { gte: yesterdayStart, lt: yesterdayEnd },
                },
            });

            return tradesYesterday === 0 ? 0 : Math.min(Math.ceil((tradesToday / tradesYesterday) * 100), 100);
        }));

        // Calculate average activity level across all students in the class
        const averageActivityLevel = activityLevels.reduce((sum, level) => sum + level, 0) / activityLevels.length;

        // Calculate the consistency metric
        const consistencyMetric = (studentActivityLevel / averageActivityLevel) * 100;

        res.status(200).json({
            consistencyMetric,
            message: "Class consistency calculated successfully"
        });
    } catch (error) {
        console.error("Error calculating class consistency:", error);
        res.status(500).json({
            error: "An error occurred while calculating class consistency."
        });
    }
};
