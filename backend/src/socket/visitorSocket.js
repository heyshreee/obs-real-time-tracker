const { verifyToken } = require('../utils/jwt');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected');

        socket.on('join_room', (token) => {
            try {
                const decoded = verifyToken(token);
                const userId = decoded.id;
                socket.join(`user_${userId}`);
                console.log(`User ${userId} joined room user_${userId}`);
            } catch (error) {
                console.error('Invalid token for socket connection');
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
};
