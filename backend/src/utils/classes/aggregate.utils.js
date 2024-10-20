const calculateStudentCount = (classItem) => {
    return classItem.studentClasses.length; // Count of students in the class
};

// calculating portfolio value is (price * quantity)
 const calculatePortfolioValues = (studentClasses) => {
    return studentClasses.reduce((total, studentClass) => {
        const studentTransactions = studentClass.student.transactions;
        const totalValue = studentTransactions.reduce((sum, transaction) => {
            return sum + transaction.price * transaction.quantity; // Placeholder for calculating portfolio value
        }, 0); 
        return total + totalValue;
    }, 0);
};

const calculatePerformanceTrends = (studentClasses) => {
    return studentClasses.reduce((acc, studentClass) => {
        const studentTransactions = studentClass.student.transactions;
        const totalPerformance = studentTransactions.reduce((sum, transaction) => {
            return sum + transaction.price; // Change as needed for performance metric
        }, 0);
        const averagePerformance = studentTransactions.length ? totalPerformance / studentTransactions.length : 0;
        acc.push(averagePerformance);
        return acc;
    }, []);
};

export const aggregateClassData = (classes) => {
    return classes.map(c => {
        const studentCount = calculateStudentCount(c);
        const portfolioValues = calculatePortfolioValues(c.studentClasses);
        const performanceTrends = calculatePerformanceTrends(c.studentClasses);

        return {
            id: c.id,
            name: c.name,
            download_code: c.download_code,
            teacher: {
                id: c.teacher.id,
                name: `${c.teacher.user.first_name} ${c.teacher.user.last_name}`,
                email: c.teacher.user.email,
                district: c.teacher.district,
                school: c.teacher.school,
            },
            student_count: studentCount,
            portfolio_value: portfolioValues,
            performance_trends: performanceTrends,
            created_at: c.created_at,
            updated_at: c.updated_at,
        };
    });
};

