import express from 'express';
import cors from 'cors';
import repoRoutes from './routes/repoRoutes.js';

const app = express();
app.use(express.json());
app.use(cors());   

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});
app.use('/api/repo', repoRoutes);

export  default app ;