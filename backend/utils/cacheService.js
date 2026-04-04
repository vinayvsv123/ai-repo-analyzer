import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), 'cache');

export const getCacheKey = (repoUrl) => {
    return crypto.createHash('md5').update(repoUrl).digest('hex');
};

export const getCachedResult = async (repoUrl) => {
    const key = getCacheKey(repoUrl);
    const cachePath = path.join(CACHE_DIR, `${key}.json`);
    
    if (fs.existsSync(cachePath)) {
        try {
            const data = await fs.readFile(cachePath, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            console.warn("Could not read cache file", err);
            return null;
        }
    }
    return null;
};

export const setCachedResult = async (repoUrl, summary) => {
    const key = getCacheKey(repoUrl);
    const cachePath = path.join(CACHE_DIR, `${key}.json`);
    
    try {
        await fs.ensureDir(CACHE_DIR);
        await fs.writeFile(cachePath, JSON.stringify(summary, null, 2));
    } catch (err) {
        console.warn("Could not write cache file", err);
    }
};

export const getCachedCode = async (repoUrl) => {
    const key = getCacheKey(repoUrl);
    const cachePath = path.join(CACHE_DIR, `${key}_code.txt`);
    
    if (fs.existsSync(cachePath)) {
        try {
            return await fs.readFile(cachePath, 'utf8');
        } catch (err) {
            return null;
        }
    }
    return null;
};

export const setCachedCode = async (repoUrl, code) => {
    const key = getCacheKey(repoUrl);
    const cachePath = path.join(CACHE_DIR, `${key}_code.txt`);
    
    try {
        await fs.ensureDir(CACHE_DIR);
        await fs.writeFile(cachePath, code);
    } catch (err) {
        console.warn("Could not write code cache", err);
    }
};

export const getCachedFiles = async (repoUrl) => {
    const key = getCacheKey(repoUrl);
    const cachePath = path.join(CACHE_DIR, `${key}_files.json`);
    
    if (fs.existsSync(cachePath)) {
        try {
            const data = await fs.readFile(cachePath, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            return null;
        }
    }
    return null;
};

export const setCachedFiles = async (repoUrl, filesDatabase) => {
    const key = getCacheKey(repoUrl);
    const cachePath = path.join(CACHE_DIR, `${key}_files.json`);
    
    try {
        await fs.ensureDir(CACHE_DIR);
        await fs.writeFile(cachePath, JSON.stringify(filesDatabase));
    } catch (err) {
        console.warn("Could not write files cache", err);
    }
};
