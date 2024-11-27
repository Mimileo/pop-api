import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();




  //await prisma.stocks.deleteMany({});
 
  
  async function main() {
    // Seed student data
    const student = await prisma.users.create({
      data: {
        first_name: 'John',
        lastName: 'Doe',
        last_initial: 'D',
        email: 'john.doe@example.com',
        is_teacher: false,
        roles: 'student',
        password: 'password123',
      },
    });
  
    console.log('Student seeded:', student);
  
    // Initial buy of 100 shares at $100 each
    const buy100Shares = await prisma.transactions.create({
      data: {
        student_id: student.id,
        stock_id: 'STOCK_A',
        type: 'buy',
        quantity: 100,
        price: 100.00,
      },
    });
  
    console.log('Transaction (Buy 100 Shares at $100):', buy100Shares);
  
    // Sell 30 shares at $110
    const sell30Shares = await prisma.transactions.create({
      data: {
        student_id: student.id,
        stock_id: 'STOCK_A',
        type: 'sell',
        quantity: 30,
        price: 110.00,
      },
    });
  
    console.log('Transaction (Sell 30 Shares at $110):', sell30Shares);
  
    // Sell 20 shares at $130
    const sell20Shares = await prisma.transactions.create({
      data: {
        student_id: student.id,
        stock_id: 'STOCK_A',
        type: 'sell',
        quantity: 20,
        price: 130.00,
      },
    });
  
    console.log('Transaction (Sell 20 Shares at $130):', sell20Shares);
  
    // Buy 50 shares at $120
    const buy50Shares = await prisma.transactions.create({
      data: {
        student_id: student.id,
        stock_id: 'STOCK_A',
        type: 'buy',
        quantity: 50,
        price: 120.00,
      },
    });
  
    console.log('Transaction (Buy 50 Shares at $120):', buy50Shares);
  
    // Calculate portfolio value based on the current price of $130
    const currentPrice = 130.00;
    const totalShares = 100 - 30 - 20 + 50; // 100 initial shares - 30 sold - 20 sold + 50 bought
    const portfolioValue = currentPrice * totalShares;
  
    console.log(`Current Portfolio Value at $${currentPrice}: $${portfolioValue}`);
  }
  
  // Run the main function to seed the data
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
  