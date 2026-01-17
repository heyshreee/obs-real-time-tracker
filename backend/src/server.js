const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const visitorRoutes = require('./routes/visitor.routes');
// const analyticsRoutes = require('./routes/analytics.routes');
// const paymentRoutes = require('./routes/payment.routes');
const setupVisitorSocket = require('./socket/visitorSocket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible globally
global.io = io;

const cookieParser = require('cookie-parser');

// ...

app.use(helmet());
app.use(cookieParser());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/projects', require('./routes/project.routes'));
app.use('/api/track', require('./routes/track.routes'));
// app.use('/api/analytics', analyticsRoutes);
// app.use('/api/payments', paymentRoutes);

// Socket.io setup
setupVisitorSocket(io);

app.get('/', (req, res) => {
  res.send('OBS View Tracker API is running');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
