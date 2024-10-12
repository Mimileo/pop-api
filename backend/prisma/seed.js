import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
 

  // Seed Users (Students)
  for (let i = 0; i < 80; i++) {
    await prisma.user.create({
      data: {
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email(),
        password: faker.internet.password(), 
        last_initial: faker.person.lastName()[0], // Use the first letter of the last name as initial
        is_teacher: faker.datatype.boolean(), // Assuming all seeded users are students
      },
    });
  }

  // Seed Classes
  const teachers = await prisma.teacher.findMany({ select: { id: true } });
  for (let i = 0; i < 100; i++) {
    await prisma.class.create({
      data: {
        name: faker.commerce.productName(),
        download_code: faker.string.alphanumeric(10), // Generates a random alphanumeric string of length 10
        teacher_id: faker.helpers.arrayElement(teachers).id, // Assign a random teacher
      },
    });
  }

  // Seed StudentClasses
  const users = await prisma.user.findMany({ select: { id: true } });
  const classes = await prisma.class.findMany({ select: { id: true } });

  for (let i = 0; i < 100; i++) {
    await prisma.studentClass.create({
      data: {
        student_id: faker.helpers.arrayElement(users).id, // Assign a random student
        class_id: faker.helpers.arrayElement(classes).id, // Assign a random class
      },
    });
  }

  // Seed Transactions
  for (let i = 0; i < 100; i++) {
    await prisma.transaction.create({
      data: {
        student_id: faker.helpers.arrayElement(users).id, // Assign a random student
        stock_id: Math.floor(Math.random() * 100) + 1, // Generates a random stock_id between 1 and 100
        type: faker.helpers.arrayElement(['BUY', 'SELL']), // Randomly choose between BUY and SELL
        quantity: faker.number.float({ min: 1, max: 100 }), // Updated to the correct method
        price: faker.number.float({ min: 1, max: 1000 }), // Updated to the correct method
      },
    });
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
