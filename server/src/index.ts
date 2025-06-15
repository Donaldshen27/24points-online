import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://192.168.0.83:5173', 'http://172.29.240.200:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3024;

app.use(cors({
  origin: ['http://localhost:5173', 'http://192.168.0.83:5173', 'http://172.29.240.200:5173'],
  credentials: true
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

import { handleConnection } from './socket/connectionHandler';

io.on('connection', (socket) => {
  handleConnection(io, socket);
});

const port = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Server accessible on local network at http://192.168.0.83:${port}`);
});