import { PrismaClient } from '@prisma/client';
import { calculateSharpeRatio, calculateDiversification } from '../utils/students/portfolio.metrics.js';

const prisma = new PrismaClient();

const fetchStudents = async (where, pagination) => {
    return await prisma.user.findMany({
        where,
        include: {
            studentClasses: {
                include: {
                    class: true,
                },
            },
            transactions: true,
        },
        orderBy: pagination.orderBy,
        skip: pagination.skip,
        take: pagination.take,
    });
};


export const getStudents = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sort = 'first_name',
            order = 'asc',
            first_name,
            last_initial,
            class_name,
            classCount
        } = req.query;

        const parsedPage = Math.max(1, parseInt(page));
        const parsedLimit = Math.min(Math.max(1, parseInt(limit)), 100);
        const offset = (parsedPage - 1) * parsedLimit;

        const where = {
            is_teacher: false,
        };

        if (first_name) {
            where.first_name = { contains: first_name, mode: 'insensitive' };
        }

        if (last_initial) {
            where.last_initial = { equals: last_initial, mode: 'insensitive' };
        }

        if (class_name) {
            where.studentClasses = {
                some: {
                    class: {
                        name: {
                            contains: class_name,
                            mode: 'insensitive',
                        },
                    },
                },
            };
        }

        // Fetch students with their class information
        const allStudents = await prisma.users.findMany({
            where,
            include: {
                studentClasses: {
                    include: {
                        class: true,
                    },
                },
            },
            orderBy: {
                [sort]: order,
            },
        });

        // Apply class count filtering
        const filteredStudents = allStudents.filter(student => {
            const classTotal = student.studentClasses.length;
            if (classCount && classCount.includes('-')) {
                const [min, max] = classCount.split('-').map(Number);
                return classTotal >= min && classTotal <= max;
            } else if (classCount) {
                return classTotal === parseInt(classCount);
            }
            return true;
        }).map(student => ({
            //...student,
            studentId: student.id,
            first_name: student.first_name,
            last_initial: student.last_initial,
            is_teacher: student.is_teacher,
            //transactionCount: student.transactions.length,
            classCount: student.studentClasses.length, 
            classNames: student.studentClasses.map(sc => sc.class.name), // class names for each student
        }));


        // Apply pagination after filtering
        const paginatedStudents = filteredStudents.slice(offset, offset + parsedLimit);

        // Total count of filtered students
        const totalFilteredStudents = filteredStudents.length;

        res.status(200).json({
            data: paginatedStudents,
            meta: {
                total: totalFilteredStudents,
                page: parsedPage,
                limit: parsedLimit,
            },
        });

    } catch (error) {
        console.error("Error fetching students: ", error);
        res.status(500).json({
            error: 'An error occurred while fetching students',
            details: error.message,
        });
    }
};


export const getStudentClasses = async (req, res) => {
    const { studentId } = req.params;

    try {
        // Find the student and include their classes

        // Convert studentId to an integer
        const id = parseInt(studentId, 10);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid student ID' });
        }
        const studentWithClasses = await prisma.user.findUnique({
            where: { id: id },
            include: {
                studentClasses: {
                    include: {
                        class: true, // Join with class to get class details
                    },
                },
            },
        });

        // Check if student exists
        if (!studentWithClasses || studentWithClasses.is_teacher) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // get class names from the rsponse
        const classNames = studentWithClasses.studentClasses.map(sc => sc.class.name);

        // Return success response with student id and their class names
        res.status(200).json({
            studentId: id,
            classNames: classNames,
        });

    } catch (error) {
        console.error("Error fetching student classes: ", error);
        res.status(500).json({ error: 'An error occurred while fetching student classes' });
    }
};


export const getAllStudents = async (req, res) => {
    try {
        const where = { is_teacher: false };  // Fetch only students
        const students = await fetchStudents(where, { skip: 0, take: 1000, orderBy: { first_name: 'asc' } });  

        console.log(`Total number of students: ${students.length}`);
        res.status(200).json({ data: students });
    } catch (error) {
        console.error("Error fetching all students: ", error);
        res.status(500).json({ error: 'An error occurred while fetching all students' });
    }
};

export const addFunds = async (req, res) => {
    const { studentId } = req.params;
    const { amount } = req.body; 
    // Validate input
    if (!studentId  || !amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: "Valid studentId and amount are required" });
    }

    try {
        // Find the student in the users table
        const student_id = parseInt(studentId);
        const student = await prisma.user.findUnique({
            where: { id:student_id }, // Ensure studentId matches the user's ID
        });

        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

       
        //  log the transaction
        const transaction = await prisma.transaction.create({
            data: {
                student_id: student_id,
                type: TransactionType.BUY,
                quantity: amount,
                price: amount, // Assuming price is the same as the amount for funds
                timestamp: new Date(),
                stock_id: Math.random() * 100, // Generate a random stock_id
            },
        });

        // Return success response
        res.status(200).json({
            message: "Funds added successfully",
            studentId: student_id,
            amount: amount,
            transactionId: transaction.id,
        });
    } catch (error) {
        console.error("Error adding funds to student:", error);
        res.status(500).json({ error: "An error occurred while adding funds" });
    }
};

export const getStudentDetails = async (req, res) => {
    const { studentId } = req.params;

    try {
        // Fetch student information and related data
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            include: {
                studentClasses: {
                    include: {
                        class: true, // Fetch class information
                    },
                },
                transactions: true, // Fetch transaction history
            },
        });

        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        // Calculate portfolio diversification
        const diversification = calculateDiversification(student.transactions);

        // Calculate Sharpe Ratio (based on transaction performance)
        const sharpeRatio = calculateSharpeRatio(student.transactions);

        // Calculate portfolio value over time (sum of price * quantity)
        const portfolioValue = student.transactions.reduce((total, transaction) => {
            return total + transaction.price * transaction.quantity;
        }, 0);

        // Prepare transaction history data
        const transactionHistory = student.transactions.map(transaction => ({
            stock_id: transaction.stock_id,
            type: transaction.type,
            quantity: transaction.quantity,
            price: transaction.price,
            timestamp: transaction.timestamp,
        }));

        // Response with all student details
        res.status(200).json({
            student: {
                id: student.id,
                fullName: `${student.first_name} ${student.last_name}`,
                classes: student.studentClasses.map(sc => ({
                    classId: sc.class.id,
                    className: sc.class.name,
                })),
                performanceMetrics: {
                    diversification,
                    sharpeRatio,
                    portfolioValue,
                },
                transactionHistory,
            },
        });
    } catch (error) {
        console.error("Error fetching student details:", error);
        res.status(500).json({ error: "An error occurred while fetching student details" });
    }
};