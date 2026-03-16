import { cloneRepo } from '../utils/cloneRepo.js';
import { readRepoFiles } from '../utils/readFiles.js';
import { analyzeCodeWithAI } from '../services/aiServices.js';
import { getSocket } from '../sockets/socketService.js';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const MAX_CODE_LENGTH = 3000000; // rough limit to avoid token overflow

export const analyzeRepo = async (req, res) => {
    const io = getSocket();
    let localPath = null;
    
    try {
        const { repoUrl, socketId } = req.body;
        
        if (!repoUrl || !repoUrl.includes("github.com")) {
            return res.status(400).json({ error: 'Valid GitHub Repository URL is required' });
        }

        io.to(socketId).emit('progress', { step: 'cloning_started', message: 'Cloning repository...' });
        
        localPath = await cloneRepo(repoUrl);
        
        io.to(socketId).emit('progress', { step: 'cloning_completed', message: 'Cloned successfully' });
        io.to(socketId).emit('progress', { step: 'reading_files', message: 'Reading project files...' });
        
        let repoCode = readRepoFiles(localPath);

        // Basic check for repository code size
        if (!repoCode || repoCode.trim().length === 0) {
            throw new Error('Repository is empty or unreadable.');
        }

        if (repoCode.length > MAX_CODE_LENGTH) {
            // Trim to avoid AI context overflow
            repoCode = repoCode.substring(0, MAX_CODE_LENGTH) + '\n...[TRUNCATED]';
        }

        io.to(socketId).emit('progress', { step: 'analyzing_code', message: 'AI is analyzing code...' });
        
        const aiSummary = await analyzeCodeWithAI(repoCode);
        
        io.to(socketId).emit('progress', { step: 'analysis_completed', message: 'Analysis ready' });

        res.json({
            message: 'Repository analyzed successfully',
            summary: aiSummary
        });
        
    } catch (error) {
        console.error('Error analyzing repository:', error);
        
        const socketId = req.body.socketId;
        if (socketId) {
            io.to(socketId).emit('progress_error', { message: error.message });
        }
        
        return res.status(500).json({ error: error.message || 'Failed to analyze repository' });
    } finally {
        if (localPath && fs.existsSync(localPath)) {
            try {
                fs.removeSync(localPath);
            } catch (cleanupError) {
                console.error("Failed to clean up repo directory:", cleanupError);
            }
        }
    }
}