import express from 'express'; 
import { getResult } from '../controllers/ai.controller.js';
const router = express.Router();



router.get('/get-result', getResult)



export default router