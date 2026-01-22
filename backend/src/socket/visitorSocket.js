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

        // Periodic Auth Revalidation (every 5 minutes)
        const revalidateInterval = setInterval(() => {
            try {
                const cookies = cookie.parse(socket.request.headers.cookie || '');
                const token = cookies.token;
                if (!token) throw new Error('No token');
                verifyToken(token);
            } catch (error) {
                console.log(`Socket auth failed for user ${socket.user.id}, disconnecting...`);
                socket.emit('error', { message: 'Session expired' });
                socket.disconnect();
            }
        }, 5 * 60 * 1000);

        // Project rooms
        socket.on('join_project', (projectId) => {
            socket.join(`project_${projectId}`);
            console.log(`User ${socket.user.id} joined room project_${projectId}`);
        });

        socket.on('leave_project', (projectId) => {
            socket.leave(`project_${projectId}`);
            console.log(`User ${socket.user.id} left room project_${projectId}`);
        });

        socket.on('disconnect', () => {
            clearInterval(revalidateInterval);
            console.log('Client disconnected');
        });
    });
};
