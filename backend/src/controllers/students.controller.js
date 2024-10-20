import { PrismaClient } from '@prisma/client';
import { calculateSharpeRatio, calculateDiversification } from '../utils/students/portfolio.metrics.js';

const prisma = new PrismaClient();

const fetchStudents = async (where, pagination) => {
    return await prisma.users.findMany({
        where,
        include: {
          /*  studentClasses: {
                include: {
                    class: true,
                },
            },*/
         //   transactions: true, // To do Fetch transaction history 
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
            sort = 'firstName',
            order = 'asc',
            first_name,
            last_initial,
            class_name,
            classCount
        } = req.query;

        const parsedPage = Math.max(1, parseInt(page));
        const parsedLimit = Math.min(Math.max(1, parseInt(limit)), 100);
        const offset = (parsedPage - 1) * parsedLimit;

       /* const where = {
            is_teacher: false, // Fetch only students
        };*/

        const where = {
            firstName: { not: null }, // Fetch only students
        };

        if (first_name) {
            where.firstName = { contains: first_name, mode: 'insensitive' };
        }

       /* if (last_initial) { 
            where.last_initial = { equals: last_initial, mode: 'insensitive' };
        }*/

        if (last_initial) { 
            where.lastName = { startsWith: last_initial, mode: 'insensitive' };
        }

        // Integrate class name search - to be implemented

        /*if (class_name) {
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
        }*/

        // Fetch students with their class information
        const allStudents = await prisma.users.findMany({
            where,
            /*include: {
                studentClasses: {
                    include: {
                        class: true,
                    },
                },
            },*/
            orderBy: {
                [sort]: order,
            },
        });

        // Apply class count filtering
       /* const filteredStudents = allStudents.filter(student => {
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

*/
        // Apply pagination after filtering
        //const paginatedStudents = filteredStudents.slice(offset, offset + parsedLimit);
        const paginatedStudents = allStudents.slice(offset, offset + parsedLimit);

        // Total count of filtered students
       // const totalFilteredStudents = filteredStudents.length;
       const totalFilteredStudents = paginatedStudents.length;


        res.status(200).json({
            data: paginatedStudents.length === 0 ? "No students found with the given criteria" : paginatedStudents,
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
       const where = { firstName: { not: null } };  // Fetch only students
        const students = await fetchStudents(where 

            , { skip: 0, take: 1000, orderBy: { firstName: 'asc' } });  

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
                type: orders_type_enum.BUY,
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

                  /* studentClasses: {
                    include: {
                        class: true, // Todo: Fetch class information
                    },
                },*/
             
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
                /*classes: student.studentClasses.map(sc => ({
                    classId: sc.class.id,
                    className: sc.class.name,
                })),*/
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
/*
TP-6 TP32
Retrieve Student Balance

Description
https://popstock.atlassian.net/jira/software/c/projects/TP/boards/5?quickFilter=11&selectedIssue=TP-32
Description: Extend the /api/students/:studentId endpoint to provide the student's current funds balance.

Tasks:

Fetch the balance from the users or student_funds table.

Return the balance information in the API response.*/

export const getStudentBalance = async (req, res) => {
    const { studentId } = req.params;

    try {
        // Find the student in the users table
        const student = await prisma.users.findUnique({
            where: { id: parseInt(studentId) },
        }); 

        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        // Fetch the balance from the student_funds table
        const balance = await prisma.student_funds.findUnique({
            where: { id: student.id },
        });

        if (!balance) {
            return res.status(404).json({ error: "Balance not found" });
        }   

        res.status(200).json({ "student balance" : balance });
    } catch (error) {
        console.error("Error fetching student balance:", error);
        res.status(500).json({ error: "An error occurred while fetching student balance" });
    }
}

/* TP6-TP30
Description - Calculate Student Activity Level

Description: Implement logic to calculate the student's activity level based on the number of trades made compared to the previous day.

Tasks:

Fetch the total number of trades made by the student on the current day and the previous day from the transactions table.

Calculate the activity level as a percentage, ensuring it does not exceed 100%.

Update the /api/students/:studentId endpoint to include this activity level.
*/

// router is router.get('/:studentId/activity', getStudentActivity);

export const getStudentActivity = async (req, res) => {
    const { studentId } = req.params;

    try {

        // get the student from the database first before calculating activity level
        const student = await prisma.users.findUnique({
            where: { id: parseInt(studentId) }, 
            include: { transactions: true }, // Include transactions in the response
        });

        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        if (!student.transactions) {
            return res.status(404).json({ error: "No transactions found" });
        }

        // if student found and transactions found then calculate activity level
        // Get the total number of trades made by the student on the current day 
        const tradesToday = await prisma.transactions.count({
            where: {
                student_id: parseInt(studentId),
                timestamp: {
                    gte: new Date().setHours(0, 0, 0, 0), // Start of the current day
                    lt: new Date().setHours(23, 59, 59, 999), // End of the current day
                },
            },
        });

        // Get the total number of trades made by the student on the previous day
        const tradesYesterday = await prisma.transactions.count({
            where: {
                student_id: parseInt(studentId),
                timestamp: {
                    gte: new Date(new Date().setDate(new Date().getDate() - 1)).setHours(0, 0, 0, 0), // Start of the previous day
                    lt: new Date(new Date().setDate(new Date().getDate() - 1)).setHours(23, 59, 59, 999), // End of the previous day
                },
            },
        });

        // Calculate the activity level as a percentage, ensuring it does not exceed 100%
        const activityLevel = Math.min((tradesToday / tradesYesterday) * 100, 100);
        

        res.status(200).json({ "student activity level" : activityLevel });
      
        // Calculate the activity level as a percentage, ensuring it does not exceed 100%

    } catch (error) {
        console.error("Error fetching student activity level:", error);
        res.status(500).json({ error: "An error occurred while fetching student activity level" });
    }
};
