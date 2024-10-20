import prisma from "../db/prisma.js";

export const getNews = async (req, res) => {
    try {
        const news = await prisma.news.findMany();
        res.json(news);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'An error occurred while fetching news.' });
    }
}