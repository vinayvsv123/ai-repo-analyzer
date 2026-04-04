import fs from 'fs-extra';
import path from 'path';

const IGNORED_DIRS = ['.git', 'node_modules', 'dist', 'build', '.next', '.vscode', '.idea'];
const IGNORED_FILES = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];

export const readRepoFiles = async (dirPath, currentDepth = 0, context = {
    totalFiles: 0,
    languages: {},
    linesOfCode: 0,
    maxFolderDepth: 0,
    largestModule: { name: '', sizeLines: 0 },
    dependencies: [],
    fileTree: [],
    filesDatabase: {},
    allCode: ''
}, baseDir = dirPath) => {

    if (currentDepth > context.maxFolderDepth) {
        context.maxFolderDepth = currentDepth;
    }

    const files = await fs.readdir(dirPath);
    let currentTreeLevel = [];

    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
            if (!IGNORED_DIRS.includes(file)) {
                context.totalFolders = (context.totalFolders || 0) + 1;
                const children = await readRepoFiles(fullPath, currentDepth + 1, context, baseDir);
                currentTreeLevel.push({
                    name: file,
                    path: relPath,
                    isDir: true,
                    children
                });
            }
        } else {
            const ext = path.extname(file).toLowerCase();
            const validCodeFile = (
                file.endsWith('.js') || file.endsWith('.jsx') ||
                file.endsWith('.ts') || file.endsWith('.tsx') ||
                file.endsWith('.py') || file.endsWith('.java') ||
                file.endsWith('.cpp') || file.endsWith('.go') ||
                file.endsWith('.rs') || file.endsWith('.md') || 
                file.endsWith('.html') || file.endsWith('.css') ||
                (file.endsWith('.json') && !IGNORED_FILES.includes(file))
            );

            if (validCodeFile) {
                try {
                    context.totalFiles += 1;
                    
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    const lines = content.split('\n').length;
                    context.linesOfCode += lines;
                    
                    if (lines > context.largestModule.sizeLines) {
                        context.largestModule = { name: file, sizeLines: lines };
                    }
                    
                    if (ext) {
                        const nameLower = ext.replace('.', '');
                        context.languages[nameLower] = (context.languages[nameLower] || 0) + 1;
                    }

                    if (file === 'package.json') {
                        try {
                           const pkg = JSON.parse(content);
                           const deps = Object.keys(pkg.dependencies || {});
                           const devDeps = Object.keys(pkg.devDependencies || {});
                           context.dependencies = [...new Set([...context.dependencies, ...deps, ...devDeps])];
                        } catch(e){}
                    }
                    
                    context.allCode += `\n\n FILE: ${relPath} \n`;
                    context.allCode += content;
                    
                    context.filesDatabase[relPath] = content;

                    currentTreeLevel.push({
                        name: file,
                        path: relPath,
                        isDir: false,
                        size: lines
                    });
                } catch (err) {
                    console.warn(`Could not read file ${fullPath}`);
                }
            }
        }
    }

    if (currentDepth === 0) {
        let mainLanguage = 'Unknown';
        let maxCount = 0;
        for (const [lang, count] of Object.entries(context.languages)) {
            if (count > maxCount) {
                maxCount = count;
                mainLanguage = lang;
            }
        }
        
        const langMap = {
            'js': 'JavaScript', 'jsx': 'React (JSX)', 'ts': 'TypeScript', 'tsx': 'React (TSX)',
            'py': 'Python', 'java': 'Java', 'cpp': 'C++', 'go': 'Go', 'rs': 'Rust', 'html': 'HTML', 'css': 'CSS'
        };

        return {
            allCode: context.allCode,
            fileTree: currentTreeLevel,
            filesDatabase: context.filesDatabase,
            metrics: {
                totalFiles: context.totalFiles,
                totalFolders: context.totalFolders || 0,
                linesOfCode: context.linesOfCode,
                maxFolderDepth: context.maxFolderDepth,
                largestModule: context.largestModule,
                mainLanguage: langMap[mainLanguage] || mainLanguage.toUpperCase(),
                languages: context.languages,
                dependencies: context.dependencies.slice(0, 30)
            }
        };
    }
    
    return currentTreeLevel;
};