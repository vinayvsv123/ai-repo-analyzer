import { cloneRepo } from '../utils/cloneRepo.js';
import { readRepoFiles } from '../utils/readFiles.js';
import { analyzeCodeWithAI, chatWithRepo, explainFileWithAI } from '../services/aiServices.js';
import { getSocket } from '../sockets/socketService.js';
import { getCachedResult, setCachedResult, getCachedCode, setCachedCode, getCachedFiles, setCachedFiles } from '../utils/cacheService.js';
import fs from 'fs-extra';
import dotenv from 'dotenv';

dotenv.config();

const MAX_CODE_LENGTH = 3000000;

export const analyzeRepo = async (req, res) => {
    console.log("Received analyze request for repo:", req.body.repoUrl);
    const io = getSocket();
    let localPath = null;
    
    try {
        const { repoUrl, socketId } = req.body;
        
        if (!repoUrl || !repoUrl.includes("github.com")) {
            return res.status(400).json({ error: 'Valid GitHub Repository URL is required' });
        }

        const cachedSummary = await getCachedResult(repoUrl);
        if (cachedSummary) {
            console.log("Returning cached result for", repoUrl);
            const cachedFilesData = await getCachedFiles(repoUrl);

            io.to(socketId).emit('progress', { step: 'cloning_started', message: 'Using cached repository data...' });
            setTimeout(() => io.to(socketId).emit('progress', { step: 'reading_files', message: 'Loading cache...' }), 500);
            setTimeout(() => io.to(socketId).emit('progress', { step: 'analyzing_code', message: 'Restoring AI analysis...' }), 1000);
            setTimeout(() => io.to(socketId).emit('progress', { step: 'analysis_completed', message: 'Ready' }), 1500);
            
            return setTimeout(() => res.json({
                message: 'Cached repository analyzed',
                summary: cachedSummary,
                fileTree: cachedFilesData?.fileTree || [],
                filesDatabase: cachedFilesData?.filesDatabase || {}
            }), 1600);
        }

        io.to(socketId).emit('progress', { step: 'cloning_started', message: 'Cloning repository...' });
        console.log("Cloning repository:", repoUrl);

        localPath = await cloneRepo(repoUrl);
        
        io.to(socketId).emit('progress', { step: 'cloning_completed', message: 'Cloned successfully' });
        io.to(socketId).emit('progress', { step: 'reading_files', message: 'Reading project files & calculating metrics...' });
        console.log("Reading files from:", localPath);

        const { allCode: rawRepoCode, metrics, fileTree, filesDatabase } = await readRepoFiles(localPath);
        let repoCode = rawRepoCode;

        if (!repoCode || repoCode.trim().length === 0) {
            throw new Error('Repository is empty or unreadable.');
        }

        await setCachedCode(repoUrl, repoCode);
        await setCachedFiles(repoUrl, { fileTree, filesDatabase });

        if (repoCode.length > MAX_CODE_LENGTH) {
            repoCode = repoCode.substring(0, MAX_CODE_LENGTH) + '\\n...[TRUNCATED]';
        }

        io.to(socketId).emit('progress', { step: 'analyzing_code', message: 'AI is analyzing code & generating architecture...' });
        
        let aiSummary = await analyzeCodeWithAI(repoCode);
        
        aiSummary.metrics = metrics;

        await setCachedResult(repoUrl, aiSummary);

        io.to(socketId).emit('progress', { step: 'analysis_completed', message: 'Analysis ready' });
        console.log("AI analysis completed, sending response");

        res.json({
            message: 'Repository analyzed successfully',
            summary: aiSummary,
            fileTree,
            filesDatabase
        });
        
    } catch (error) {
        console.error('Error analyzing repository:', error);
        
        const socketId = req.body.socketId;
        if (socketId) {
            const io = getSocket();
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
};

export const chatRepo = async (req, res) => {
    try {
        const { repoUrl, question, history = [] } = req.body;
        if (!repoUrl || !question) {
            return res.status(400).json({ error: "Missing repoUrl or question" });
        }

        let repoCode = await getCachedCode(repoUrl);
        if (!repoCode) {
            return res.status(404).json({ error: "Repository code not found in cache. Analyze it again." });
        }

        if (repoCode.length > MAX_CODE_LENGTH) {
            repoCode = repoCode.substring(0, MAX_CODE_LENGTH) + '\\n...[TRUNCATED]';
        }

        const answer = await chatWithRepo(repoCode, history, question);
        res.json({ answer });
    } catch (error) {
        console.error("Chat error:", error);
        res.status(500).json({ error: "Failed to process chat query" });
    }
};

export const explainFile = async (req, res) => {
    try {
        const { filePath, fileContent } = req.body;
        if (!filePath || !fileContent) {
            return res.status(400).json({ error: "Missing filePath or fileContent" });
        }

        const explanation = await explainFileWithAI(filePath, fileContent);
        res.json({ explanation });
    } catch (error) {
        console.error("Explain file error:", error);
        res.status(500).json({ error: "Failed to explain file" });
    }
};