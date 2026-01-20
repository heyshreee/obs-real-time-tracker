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
app.set('trust proxy', 1); // Trust first proxy (Vercel)
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://obs-real-time-tracker-s5do.vercel.app',
      'https://obs-real-time-tracker-s5do-puoj1meir-sris-projects-8ff08b1b.vercel.app',
      'https://obs-real-time-tracker-s5do-git-main-sris-projects-8ff08b1b.vercel.app',
      'https://obs-tracker.netlify.app/',
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
// Custom CORS wrapper to exclude tracking endpoint
app.use(cors({
  origin: (origin, callback) => {
    // For v1 routes, we handle CORS in the router/middleware
    // For other routes (like root or legacy), we use this simple check
    const dashboardOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://obs-real-time-tracker-s5do.vercel.app',
      'https://obs-real-time-tracker-s5do-puoj1meir-sris-projects-8ff08b1b.vercel.app',
      'https://obs-real-time-tracker-s5do-git-main-sris-projects-8ff08b1b.vercel.app',
      'https://obs-tracker.netlify.app/',
      process.env.FRONTEND_URL
    ].filter(Boolean);


    // Allow tracking routes to pass through global CORS
    // They will be handled by trackingCors middleware in the router
    if (!origin || dashboardOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // We'll allow the origin here but the trackingCors middleware will do the final check
      // This is necessary because Express middleware order means global CORS runs first
      callback(null, true);
    }
  },
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/v1', require('./routes/v1'));

// Legacy routes (optional: keep for backward compatibility or remove)
// For now, I'll remove them as requested by the "Clean Architecture" section
app.use('/api/track', require('./routes/v1/track.routes'));

// Socket.io setup
setupVisitorSocket(io);

app.get('/', (req, res) => {
  res.send('OBS View Tracker API is running');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
