import socket from 'socket.io-client';

let socketInstance = null;

export const initializeSocket = (projectId) => {
    socketInstance = socket(import.meta.env.VITE_BASE_URL, {
        auth: {
            token: localStorage.getItem('token'),
        },
        query: {
            projectId, 
        }
    });

    if (!socketInstance) {
        console.log("SocketInstance is not initialized")
        throw new Error('Socket initialization failed');
    }

    return socketInstance;
};

export const receivedMessage = (eventName, cb) => {
    if (socketInstance) {
        socketInstance.on(eventName, cb);
    } else {
        console.error('Socket instance is not initialized');
    }
};

export const sendMessage = (eventName, cb) => {
    if (socketInstance) {
        socketInstance.emit(eventName, cb);
    } else {
        console.error('Socket instance is not initialized');
    }
};
