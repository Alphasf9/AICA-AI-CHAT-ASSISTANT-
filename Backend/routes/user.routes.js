import express from 'express';
import { getUserProfile, login, logout, registerUser } from '../controllers/user.controller.js';
import { body } from 'express-validator';
import { authUser } from '../middlewares/auth.middleware.js';

const router = express.Router();


router.post('/register', [
    body('email').isEmail().withMessage('Email must be a valid email'),
    body('password').isLength({ min: 3 }).withMessage('Password must be at least 6 characters long'),

], registerUser)


router.post('/login', [
    body('email').isEmail().withMessage('Email must be a valid email'),
    body('password').isLength({ min: 3 }).withMessage('Password must be at least 6 characters long'),

], login)


router.get('/get-profile', authUser, getUserProfile)


router.post('/logout', authUser, logout)

export default router