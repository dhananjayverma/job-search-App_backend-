const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

dotenv.config();

const app = express();

const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const seedData = require('./seedData');

app.use(cors());

app.use(express.json({
  limit: '10mb'
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const mongoUri = process.env.MONGODB_URI;

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 5000,
})
.then((conn) => {
  console.log(`MongoDB connected: ${conn.connection.host}`);
})
.catch((err) => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'Backend is running',
  });
});

app.post('/api/seed', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Seeding is disabled in production',
      });
    }

    const result = await seedData();

    res.status(201).json({
      message: 'Sample backend data added',
      result,
    });
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    error: err.message || 'Something went wrong',
  });
});

const PORT = process.env.PORT;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

app.set('io', io);

const onlineUsers = new Map();

const broadcastPresence = () => {
  io.emit('presence:users', Array.from(onlineUsers.keys()));
};

io.on('connection', (socket) => {

  socket.on('join:user', (userId) => {
    if (!userId) return;

    socket.join(`user:${userId}`);
    socket.data.userId = userId;

    onlineUsers.set(
      userId,
      (onlineUsers.get(userId) || 0) + 1
    );

    broadcastPresence();
  });

  socket.on('join:conversation', (conversationId) => {
    if (!conversationId) return;

    socket.join(`conversation:${conversationId}`);
  });

  socket.on('leave:conversation', (conversationId) => {
    if (!conversationId) return;

    socket.leave(`conversation:${conversationId}`);
  });

  socket.on('disconnect', () => {
    const userId = socket.data.userId;

    if (!userId) return;

    const currentCount = onlineUsers.get(userId) || 0;

    if (currentCount <= 1) {
      onlineUsers.delete(userId);
    } else {
      onlineUsers.set(userId, currentCount - 1);
    }

    broadcastPresence();
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already in use. Update PORT in backend/.env and restart the server.`
    );

    process.exit(1);
  }

  throw error;
});