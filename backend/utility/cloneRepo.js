import SimpleGit from 'simple-git';
import path from 'path';
import fs from 'fs'; 

const git = new SimpleGit();

export const cloneRepo = async (repoUrl) => {
    const repoName=repoUrl.split('/').pop();
    const clonePath = path.join('cloned_repos', repoName);
    if (fs.existsSync(clonePath)) {
    fs.rmSync(clonePath, { recursive: true, force: true });
  }

  await git.clone(repoUrl, clonePath);

  return clonePath;
};
