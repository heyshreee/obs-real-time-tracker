const { verifyToken } = require('../utils/jwt');

const cookie = require('cookie');

module.exports = (io) => {
    io.use((socket, next) => {
        try {
            const cookies = cookie.parse(socket.request.headers.cookie || '');
            const token = cookies.token;

            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = verifyToken(token);
            socket.user = decoded; // Attach user to socket
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User ${socket.user.id} connected via socket`);

        // Auto-join user room
        socket.join(`user_${socket.user.id}`);
        console.log(`User ${socket.user.id} joined room user_${socket.user.id}`);

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
};
