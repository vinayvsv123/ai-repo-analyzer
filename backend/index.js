import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { initSocket } from './sockets/socketService.js';
import repoRoutes from './routes/repoRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize Socket.io
initSocket(server);

app.get('/', (req, res) => {
  res.send('AI Repo Analyzer Backend is Running!');
});

// Use routes
app.use('/api/repo', repoRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
