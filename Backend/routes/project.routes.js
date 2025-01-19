import express from 'express';
import { body } from 'express-validator';
import { addUserToProject, createProject, getAllProjects, getProjectById } from '../controllers/project.controller.js';
import { authUser } from '../middlewares/auth.middleware.js';

const router = express.Router();


router.post('/create-project', authUser, [
    body('name').isString().withMessage('Project name must be a string'),
], createProject)


router.get('/all-projects', authUser, getAllProjects)


router.put('/add-user',
    authUser, [
    body('projectId').isString().withMessage('Project ID is required'),
    body('users').isArray({ min: 1 }).withMessage('Users must be an array of strings').bail()
        .custom((users) => users.every(user => typeof user === 'string')).withMessage('Each user must be a string'),
], addUserToProject
)


router.get('/get-project/:projectId', authUser, getProjectById)

export default router