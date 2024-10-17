// backend/src/controllers/users.controller.js
import prisma from "../db/prisma.js";

export const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.users.findMany();
        res.json(users); // Return the list of users
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'An error occurred while fetching users.' });
    }
};

