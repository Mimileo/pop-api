import prisma from "../db/prisma.js";


import {
  calculateSharpeRatio,
  calculateDiversification,
} from "../utils/students/portfolio.calculations.js";

const fetchStudents = async (where, pagination) => {
  return await prisma.users.findMany({
    where,
    include: {
      student_classes: {
        include: {
          class: true,
        },
      },
      //   transactions: true, // To do Fetch transaction history
    },
    orderBy: pagination.orderBy,
    skip: pagination.skip,
    take: pagination.take,
  });
};

/*
TP-6 TP8
https://popstock.atlassian.net/browse/TP-8
GET /api/students

Implement pagination, sorting, and filtering logic based on query parameters

Fetch student data from users where is_teacher is false

Calculate profit, loss, and portfolioValue using transaction/stock history data

Join with student_classes and classes to get class names

Return paginated list of students with details

*/
export const getStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "first_name",
      order = "asc",
      classId,
      studentId,
    } = req.query;

    // If studentId is provided, fetch only that student
    if (studentId) {
      const student = await prisma.users.findUnique({
        where: { id: parseInt(studentId) },
        include: {
          student_classes: {
            include: {
              classes: true, // Get class names
            },
          },
          transactions: true, // Include student's transactions for profit/loss calculation
        },
      });

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Get the current price dynamically; here it's hardcoded for demonstration
      const currentPrice = 130; // Replace with dynamic price fetching if needed

      const portfolioValue = calculatePortfolioValue(
        student.transactions,
        currentPrice
      );
      const profit = calculateProfitLossFIFO(student.transactions);

      const studentWithProfitLoss = {
        ...student,
        portfolioValue,
        profit,
        classes: student.student_classes.map((sc) => sc.classes.name), // Get class names
      };

      return res.status(200).json(studentWithProfitLoss);
    }

    // If no studentId, proceed with fetching students
    const pageNum = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNum - 1) * pageSize;

    // Base query for fetching students
    const whereClause = {
      is_teacher: false,
    };

    // If a classId filter is provided, add it to the where clause
    if (classId) {
      whereClause.student_classes = {
        some: {
          class_id: classId,
        },
      };
    }

    // Fetch students with pagination, sorting, and filtering
    const students = await prisma.users.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { [sort]: order }, // Sorting
      include: {
        student_classes: {
          include: {
            classes: true, // Get class names
          },
        },
        transactions: true, // Include student's transactions for profit/loss calculation
      },
    });

    // Get the current price dynamically; here it's hardcoded for demonstration
    const currentPrice = 130; // Replace with dynamic price fetching if needed

    // Calculate portfolio value and profit/loss for each student
    const studentsWithProfitLoss = students.map((student) => {
      const portfolioValue = calculatePortfolioValue(
        student.transactions,
        currentPrice
      );
      const profit = calculateProfitLossFIFO(student.transactions);

      return {
        ...student,
        portfolioValue,
        profit,
        classes: student.student_classes.map((sc) => sc.classes.name), // Get class names
      };
    });

    // Get the total count for pagination
    const totalStudents = await prisma.users.count({ where: whereClause });

    res.status(200).json({
      page: pageNum,
      limit: pageSize,
      totalPages: Math.ceil(totalStudents / pageSize),
      totalStudents,
      students: studentsWithProfitLoss,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching students" });
  }
};

const calculateSingleSaleProfitLoss = (sellPrice, costBasis, quantity) => {
    return (sellPrice - costBasis) * quantity;
};

const fetchCurrentPrices = async (uniqueStockIds) => {
    const stockPrices = await prisma.stocks.findMany({
        where: { id: { in: uniqueStockIds } },
        select: { id: true, nominalPrice: true },
    });
    return Object.fromEntries(stockPrices.map(stock => [stock.id, stock.nominalPrice]));
};

const calculateTotalPortfolioValue = (buyTransactions, currentStockPrice) => {
    let totalPortfolioValue = 0;

    // Sum up the current value of remaining shares from buy transactions
    let values= []; 
    for (let buy of buyTransactions) {
        console.log(buy.quantity);
        console.log(buy.price);
        console.log(currentStockPrice);

        console.log('You have bought ' + buy.quantity + ' shares of ' + buy.stockId + ' at '  + 'buy.price'  + currentStockPrice);

    
       // const currentStockPrice = stockPriceMap[buy.stockId]; // Get current stock price
        const portfolioValue = buy.quantity * currentStockPrice; // Calculate portfolio value
        console.log("portfolioValue: " + portfolioValue);
        totalPortfolioValue += buy.quantity * currentStockPrice; // Add value for remaining shares
        console.log("Running totalPortfolioValue: " + totalPortfolioValue);
        
    }

    return totalPortfolioValue;
};


export const getProfitLoss = async (req, res) => {
    const { studentId } = req.body;

    try {
        if (!studentId) {
            return res.status(400).json({ error: "Student ID is required" });
        }

        // Get the transaction history for this student
        const transactionHistory = await prisma.transactions.findMany({
            where: { student_id: studentId },
            orderBy: { timestamp: "asc" },
        });

        if (transactionHistory.length === 0) {
            return res.status(404).json({ error: "No transaction history found for this student" });
        }

        // Extract unique stock IDs from the transactions
        const uniqueStockIds = [...new Set(transactionHistory.map(t => t.stock_id))];

        // Fetch current prices for all unique stocks
        const stockPriceMap = await fetchCurrentPrices(uniqueStockIds);

        let totalProfitLoss = 0;
        let portfolioValue = 0;
        const buyTransactions = []; // To track buy transactions for cost basis

        let count = 0;
        // Process each transaction
        for (let transaction of transactionHistory) {
            const currentPrice = await prisma.stocks.findUnique({ where: { id: transaction.stock_id } }).nominalPrice; // stockPriceMap[transaction.stock_id]; // Get current price

            let boughtShares = 0;
            if (transaction.type === "buy") {
                boughtShares = transaction.quantity;
                console.log(`Transaction: ${transaction.stock_id}, You bought: ${boughtShares}\n`);
                // Track buy transactions for cost basis
                buyTransactions.push({
                    quantity: transaction.quantity,
                    price: transaction.price,
                    stockId: transaction.stock_id,
                });
                // nothing was sold, so no need to calculate profit/loss
                //console.log(`Transaction: ${transaction.stock_id}, Profit/Loss: ${singleTransactionProfitLoss}\n`);

            } else if (transaction.type === "sell") {
                let remainingSellShares = transaction.quantity;
               // boughtShares += remainingSellShares;
                console.log(`Transaction: ${transaction.stock_id}, You sold: ${remainingSellShares}\n`);
              //  console.log(`Transaction: ${transaction.stock_id}, You sold: ${boughtShares}\n`);

                // Match with buy transactions (FIFO)
                while (remainingSellShares > 0 && buyTransactions.length > 0) {
                    const buy = buyTransactions[0];
                    const totalSharesHeld = buy.quantity - remainingSellShares;
                    console.log(`Transaction: ${transaction.stock_id}, Shares held: ${totalSharesHeld}\n`);
                    
                    const sharesToSell = Math.min(buy.quantity, remainingSellShares);
                    
                    // Calculate profit/loss for this sale
                    const singleTransactionProfitLoss = calculateSingleSaleProfitLoss(transaction.price, buy.price, sharesToSell);
                    totalProfitLoss += singleTransactionProfitLoss;
                    console.log(`Transaction: ${transaction.stock_id}, Profit/Loss: ${singleTransactionProfitLoss}\n`);

                    // Update quantities
                    buy.quantity -= sharesToSell;
                    remainingSellShares -= sharesToSell;

                    // Remove the buy transaction if fully sold
                    if (buy.quantity === 0) {
                        buyTransactions.shift(); // Remove the buy if fully sold
                    }
                }
            }
            // update stock nominl price
            console.log(transaction);
            let updatedstock = await prisma.stocks.update({
                where: { id: transaction.stock_id },
                data: { nominalPrice: transaction.price },
            });
            console.log("Portfolio Value: ", buyTransactions[0].quantity * updatedstock.nominalPrice);

            portfolioValue += buyTransactions[0].quantity * updatedstock.nominalPrice;
            console.log(updatedstock.nominalPrice);

            //stockPriceMap[transaction.stock_id] = currentPrice;

           




        }

        // rpelicate stock price change
        const updatedstock = await prisma.stocks.update({
            where: { id: transactionHistory[0].stock_id },
            data: { nominalPrice: 130 },
        });

        // Calculate total portfolio value based on remaining shares
        const totalPortfolioValue = calculateTotalPortfolioValue(buyTransactions, updatedstock.nominalPrice);



        return res.status(200).json({
            studentId,
            totalProfitLoss,
            totalPortfolioValue,
            message: `Total profit/loss for the student's portfolio is ${totalProfitLoss}. Total portfolio value is ${totalPortfolioValue}.`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "An error occurred while fetching transactions" });
    }
};



  
export const getStudentClasses = async (req, res) => {
  const { studentId } = req.params;

  try {
    // Find the student and include their classes

    // Convert studentId to an integer
    const id =studentId;
    if (!id) {
      return res.status(400).json({ error: "Invalid student ID" });
    }
    const studentWithClasses = await prisma.user.findUnique({
      where: { id: id },
      include: {
        student_classes: {
          include: {
            class: true, // Join with class to get class details
          },
        },
      },
    });

    // Check if student exists
    if (!studentWithClasses || studentWithClasses.is_teacher) {
      return res.status(404).json({ error: "Student not found" });
    }

    // get class names from the rsponse
    const classNames = studentWithClasses.student_classes.map(
      (sc) => sc.class.name
    );

    // Return success response with student id and their class names
    res.status(200).json({
      studentId: id,
      classNames: classNames,
    });
  } catch (error) {
    console.error("Error fetching student classes: ", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching student classes" });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    // const where = { is_teacher:  false  };  // Fetch only students
    const students = await prisma.users.findMany({
      is_teacher: false,
    });
    console.log(`Total number of students: ${students.length}`);
    res.status(200).json({ data: students });
  } catch (error) {
    console.error("Error fetching all students: ", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching all students" });
  }
};

export const addFunds = async (req, res) => {
  const { studentId } = req.params;
  const { amount } = req.body;
  // Validate input
  if (!studentId || !amount || typeof amount !== "number" || amount <= 0) {
    return res
      .status(400)
      .json({ error: "Valid studentId and amount are required" });
  }

  try {
    // Find the student in the users table
    const student_id = studentId;
    const student = await prisma.users.findUnique({
      where: { id: student_id }, // Ensure studentId matches the user's ID
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
    const transactionHistory = student.transactions.map((transaction) => ({
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
    res
      .status(500)
      .json({ error: "An error occurred while fetching student details" });
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
      where: { id: studentId },
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Fetch the balance from the student_funds table
    const wallet = await prisma.wallets.findUnique({
      where: { studentId: student.id }
    });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    res.status(200).json({ "student wallrt avaiable funds": wallet.available });
  } catch (error) {
    console.error("Error fetching student balance:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching student balance" });
  }
};

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
      // Fetch transactions directly, ordered by timestamp
      const transactions = await prisma.transactions.findMany({
        where: { student_id: studentId },
        orderBy: { timestamp: "desc" },
      });
  
      if (transactions.length === 0) {
        return res.status(404).json({ error: "No transactions found for this student" });
      }


      // set dates to EST like the real stock market 
  
      const getESTDayRange = (utcDate) => {
        const estOffset = -5 * 60; // EST offset in minutes (UTC-5)
  
        // Get start of the day in EST
        const start = new Date(utcDate);
        start.setUTCMinutes(start.getUTCMinutes() + estOffset);
        start.setUTCHours(0, 0, 0, 0);
  
        // Get end of the day in EST
        const end = new Date(start);
        end.setUTCHours(23, 59, 59, 999);
  
        return { start, end };
      };
  
      // Current UTC time
      const now = new Date();
  
      // Get today's EST start and end
      const { start: todayStart, end: todayEnd } = getESTDayRange(now);
  
      // Get yesterday's EST start and end by subtracting one day
      const yesterday = new Date(now);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const { start: yesterdayStart, end: yesterdayEnd } = getESTDayRange(yesterday);
  
      console.log("Today EST:", todayStart, "to", todayEnd);
      console.log("Yesterday EST:", yesterdayStart, "to", yesterdayEnd);
  
      // Count today's trades in EST
      const tradesToday = await prisma.transactions.count({
        where: {
          student_id: studentId,
          timestamp: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
      });
  
      // Count yesterday's trades in EST
      const tradesYesterday = await prisma.transactions.count({
        where: {
          student_id: studentId,
          timestamp: {
            gte: yesterdayStart,
            lt: yesterdayEnd,
          },
        },
      });
  
  
      //  Calculate the activity level as a percentage, ensuring it does not exceed 100%. Round up to the nearest whole number.
      const activityLevel = tradesYesterday === 0 ? 0 : Math.min(Math.ceil((tradesToday / tradesYesterday) * 100), 100);

      res.status(200).json({ 
        activityLevel,
        "number of trades made today": tradesToday,
        "number of trades made yesterday": tradesYesterday,

        "percentage of trades made today": `${activityLevel}%`,
     });
    } catch (error) {
      console.error("Error fetching student activity level:", error);
      res.status(500).json({
        error: "An error occurred while fetching student activity level",
      });
    }
  };
  