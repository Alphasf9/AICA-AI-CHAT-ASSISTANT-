import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js'
import aiRoutes from './routes/ai.routes.js'
import connect from './db/db.js';
connect()



const app = express();
app.use(cors());
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


app.use(cookieParser());

app.use('/users', userRoutes)
app.use('/project', projectRoutes)
app.use('/ai', aiRoutes)

export default app


