import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

const git = simpleGit();

export const cloneRepo = async (repoUrl) => {
    const repoName = repoUrl.split('/').pop().replace('.git', '');

    // ✅ Use OS temp directory (never locked by OneDrive)
    const baseTempDir = path.join(os.tmpdir(), 'ai-repo-analyzer');
    const clonePath = path.join(baseTempDir, repoName);

    // Ensure base temp exists
    fs.ensureDirSync(baseTempDir);

    // Clean old clone if exists
    if (fs.existsSync(clonePath)) {
        fs.removeSync(clonePath);
    }

    try {
        await git.clone(repoUrl, clonePath, ['--depth', '1']);
        return clonePath;
    } catch (error) {
        throw new Error(`Failed to clone repository: ${error.message}`);
    }
};