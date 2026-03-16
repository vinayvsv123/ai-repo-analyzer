import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs-extra'; 

const git = simpleGit();

export const cloneRepo = async (repoUrl) => {
    const repoName = repoUrl.split('/').pop().replace('.git', '');
    const clonePath = path.join('temp', repoName);

    if (fs.existsSync(clonePath)) {
        fs.removeSync(clonePath);
    }

    try {
        await git.clone(repoUrl, clonePath);
        return clonePath;
    } catch (error) {
        throw new Error(`Failed to clone repository: ${error.message}`);
    }
};
