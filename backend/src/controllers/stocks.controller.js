import prisma from "../db/prisma.js";

export const getStocks = async (req, res) => {
    //res.send("Get Stocks Successfully");

    try {
        const stocks = await prisma.stocks.findMany({
          
           take: 10,
           skip: 0,
           
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.status(200).json({stocks});
    } catch (error) {
        console.error('Error fetching stocks:', error);
        res.status(500).json({ error: 'An error occurred while fetching stocks.' });
    }
}