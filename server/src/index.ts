import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { seedSkills } from './utils/seed';
import { seedProfiles, seedTestSessions } from './utils/seedProfiles';
import authRoutes from './routes/auth';
import skillRoutes from './routes/skills';
import userRoutes from './routes/users';
import matchingRoutes from './routes/matching';
import sessionRoutes from './routes/sessions';
import messageRoutes from './routes/messages';
import sessionRequestRoutes from './routes/sessionRequests';
import friendRoutes from './routes/friends';

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
];

const io = new SocketServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.set('io', io);

app.use('/api/auth', authRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/session-requests', sessionRequestRoutes);
app.use('/api/friends', friendRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
  console.log('Клиентское SPA подключено из', clientDistPath);
}

const onlineUsers = new Map<string, string>();

io.on('connection', (socket) => {
  console.log('Клиент подключён:', socket.id);

  socket.on('join', ({ userId, nickname }) => {
    onlineUsers.set(userId, socket.id);
    socket.data.userId = userId;
    socket.data.nickname = nickname;
    socket.join(`user:${userId}`);
    io.emit('users:online', Array.from(onlineUsers.keys()));
  });

  socket.on('join:session', (sessionId: string) => {
    socket.join(`session:${sessionId}`);
    console.log(`${socket.data.nickname} присоединился к сессии ${sessionId}`);
  });

  socket.on('signal:offer', ({ to, offer }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit('signal:offer', { from: socket.data.userId, offer });
    }
  });

  socket.on('signal:answer', ({ to, answer }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit('signal:answer', { from: socket.data.userId, answer });
    }
  });

  socket.on('signal:ice-candidate', ({ to, candidate }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit('signal:ice-candidate', { from: socket.data.userId, candidate });
    }
  });

  socket.on('chat:message', ({ sessionId, content }) => {
    const message = {
      id: Date.now().toString(),
      session_id: sessionId,
      sender_id: socket.data.userId,
      nickname: socket.data.nickname,
      content,
      type: 'text',
      created_at: new Date().toISOString(),
    };
    io.to(`session:${sessionId}`).emit('chat:message', message);
  });

  socket.on('session:started', ({ sessionId }) => {
    io.to(`session:${sessionId}`).emit('session:started', { sessionId });
  });

  socket.on('call:request', ({ to, mode, sessionId }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit('call:incoming', {
        from: socket.data.userId,
        fromNickname: socket.data.nickname,
        mode,
        sessionId,
      });
    }
  });

  socket.on('call:accepted', ({ to, sessionId }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit('call:accepted', { sessionId });
    }
  });

  socket.on('call:declined', ({ to }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit('call:declined', {
        from: socket.data.userId,
        fromNickname: socket.data.nickname,
      });
    }
  });

  socket.on('notification:session_created', ({ to, sessionId, initiatorNickname }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit('notification:session_created', {
        sessionId,
        fromNickname: initiatorNickname,
      });
    }
  });

  socket.on('disconnect', () => {
    if (socket.data.userId) {
      onlineUsers.delete(socket.data.userId);
      io.emit('users:online', Array.from(onlineUsers.keys()));
    }
    console.log('Клиент отключён:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

seedSkills();
seedProfiles().then(() => {
  console.log('Сид профилей завершён');
  seedTestSessions();
});

export default app;
