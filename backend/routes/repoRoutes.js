import express from 'express';
import { analyzeRepo, chatRepo, explainFile } from '../controllers/repoController.js';
const router = express.Router();

console.log('repo routes loaded');
router.post('/analyze', analyzeRepo);
router.post('/chat', chatRepo);
router.post('/explain-file', explainFile);

export default router;