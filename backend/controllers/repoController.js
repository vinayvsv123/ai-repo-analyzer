import {cloneRepo} from '../utility/cloneRepo.js';
import {readRepoFiles} from '../utility/readFiles.js';
import {analyzeCodeWithAI} from '../services/aiServices.js';
import dotenv from 'dotenv';

dotenv.config();

export const analyzeRepo = async (req, res) => {
    console.log('Received request to analyze repository');
    try{
        const {repoUrl} = req.body;
        if(!repoUrl) 
            {
               return res.status(400).json({error: 'Repository URL is required'});
          }

          const localPath = await cloneRepo(repoUrl);
          const repoCode= await readRepoFiles(localPath);
          const aiSummary= await analyzeCodeWithAI(repoCode);

      
        console.log(`Analyzing repository: ${repoUrl}`);
        console.log("Repo Code Length:", repoCode.length);
        res.json({
                    message: 'Repository analyzed successfully',
                    summary:aiSummary
         });
      
    }
   
    catch(error) {
           console.error('Error analyzing repository:', error);
           return res.status(500).json({error: 'Failed to analyze repository'});
    }
}