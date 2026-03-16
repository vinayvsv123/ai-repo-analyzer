import fs from 'fs-extra';
import path from 'path';

const IGNORED_DIRS = ['.git', 'node_modules', 'dist', 'build', '.next', '.vscode'];
const IGNORED_FILES = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];

export const readRepoFiles = (dirPath) => {
    let allCode = '';

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!IGNORED_DIRS.includes(file)) {
                allCode += readRepoFiles(fullPath);
            }
        } else {
            if (
                file.endsWith('.js') ||
                file.endsWith('.jsx') ||
                file.endsWith('.ts') ||
                file.endsWith('.tsx') ||
                file.endsWith('.py') ||
                file.endsWith('.java') ||
                file.endsWith('.cpp') ||
                file.endsWith('.go') ||
                file.endsWith('.rs') ||
                (file.endsWith('.json') && !IGNORED_FILES.includes(file)) ||
                file.endsWith('.md')
            ) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    allCode += `\n\n FILE: ${fullPath} \n`;
                    allCode += content;
                } catch (err) {
                    console.warn(`Could not read file ${fullPath}`);
                }
            }
        }
    }

    return allCode;
};