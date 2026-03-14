import express from 'express';
import {analyzeRepo} from '../controllers/repoController.js';
const router = express.Router();

console.log('repo routes loaded');
router.post('/analyze', analyzeRepo);

export default router;