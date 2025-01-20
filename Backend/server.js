import 'dotenv/config';
import app from './app.js';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose';
import Project from './models/project.model.js';
import { generateResult } from './services/aigemini.service.js';

const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization.split(' ')[1];
        const projectId = socket.handshake.query.projectId
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error('Invalid project Id'))
        }

        socket.project = await Project.findById(projectId);



        if (!token) {
            return next(new Error('Not authorized with token'))
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return next(new Error('Not authorized with user'))
        }
        socket.user = decoded;
        next()
    } catch (error) {
        console.error(error)
        next(error)
    }
})

io.on('connection', (socket) => {

    socket.roomId = socket.project._id.toString();
    console.log('New client connected');

    socket.join(socket.roomId);

    socket.on('project-message', async data => {
        const message = data.message;
        const aiIsPresentInMessage = message.includes('@aica')

        if (aiIsPresentInMessage) {
            const propmt = message.replace('@aica', '');
            const result = await generateResult(propmt);
            io.to(socket.roomId).emit('project-message', {
                message: result,
                sender: {
                    _id: 'aica',
                    email: 'AICA'
                }
            });
            return
        }
        socket.broadcast.to(socket.roomId).emit('project-message', {
            message: data.message,
            sender: {
                _id: socket.user._id,
                email: socket.user.email
            }
        });
        

    })



    socket.on('event', (data) => {
        console.log('Event received:', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
