import fs from 'fs';
import path from 'path';

export const readRepoFiles = (dirPath) => {

    let allCode = '';

    const files = fs.readdirSync(dirPath);

    for (const file of files) {

        const fullPath = path.join(dirPath, file);

        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {

            allCode += readRepoFiles(fullPath);

        } else {

            if (
                file.endsWith('.js') ||
                file.endsWith('.json') ||
                file.endsWith('.md') ||
                file.endsWith('.ts')
            ) {

                const content = fs.readFileSync(fullPath, 'utf-8');

                allCode += `\n\n FILE: ${fullPath} \n`;
                allCode += content;
            }
        }
    }

    return allCode;
};