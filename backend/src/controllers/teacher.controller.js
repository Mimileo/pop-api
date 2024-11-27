// backend/src/controllers/teacher.controller.js
import prisma from "../db/prisma.js";


/*

Description TP-6 - TP -25

GET /api/teacher/profile to fetch the teacher's profile details.

Create a form handler for updating teacher details like name, email, district, and school.
*/

export const getAllTeachers = async (req, res) => {
    try {
        const teachers = await prisma.teachers.findMany();
        res.json(teachers); // Return the list of users
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({ error: 'An error occurred while fetching teachers.' });
    }
}
// Fetch a teacher's profile
export const getProfile = async (req, res) => {
    const teacherId = req.user?.id; // Assuming teacher ID is available from req.user

    try {
        const teacher = await prisma.teachers.findUnique({
            where: { id: teacherId },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                district: true,
                school: true,
            },
        });

        if (!teacher) {
            return res.status(404).json({ error: "Teacher not found" });
        }

        res.status(200).json(teacher);
    } catch (error) {
        console.error("Error fetching teacher profile:", error);
        res.status(500).json({ error: "An error occurred while fetching the profile" });
    }
};

/*

Description TP-6 - TP -25
PUT /api/teacher/profile to update the teacher's profile.

Tasks:

Create a form handler for updating teacher details like name, email, district, and school.
*/


// Update a teacher's profile
export const updateProfile = async (req, res) => {
    const teacherId = req.user?.id;
    const { first_name, last_name, email, district, school } = req.body;

    try {
        const updatedTeacher = await prisma.teachers.update({
            where: { id: teacherId },
            data: { first_name, last_name, email, district, school },
        });

        res.status(200).json({ message: "Profile updated successfully", updatedTeacher });
    } catch (error) {
        console.error("Error updating teacher profile:", error);
        res.status(500).json({ error: "An error occurred while updating the profile" });
    }
};


