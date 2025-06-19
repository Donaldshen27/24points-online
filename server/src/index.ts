import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
// Allow origins from environment variable or default to development URLs
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'];

// Add production deployment URLs
if (process.env.NODE_ENV === 'production') {
  allowedOrigins.push('https://verdant-flan-eeb30e.netlify.app');
  allowedOrigins.push('https://twentyfourpoints.com');
  allowedOrigins.push('https://www.twentyfourpoints.com');
}

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

const PORT = process.env.PORT || 3024;

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'Server is running' });
});

// API Routes
import authRoutes from './routes/auth';
import debugRoutes from './routes/debug';
app.use('/api/auth', authRoutes);
app.use('/api/debug', debugRoutes);

import { handleConnection } from './socket/connectionHandler';

io.on('connection', (socket) => {
  handleConnection(io, socket);
});

const port = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Server accessible on local network at http://192.168.0.83:${port}`);
});