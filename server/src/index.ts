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
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3024;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

import { handleConnection } from './socket/connectionHandler';

io.on('connection', (socket) => {
  handleConnection(io, socket);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});