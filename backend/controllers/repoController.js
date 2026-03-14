import {cloneRepo} from '../utility/cloneRepo.js';
import {readRepoFiles} from '../utility/readFiles.js';

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

      
        console.log(`Analyzing repository: ${repoUrl}`);
        res.json({
                    message: 'Repo cloned successfully',
                   length: repoCode.length,
         });
      
    }
   
    catch(error) {
           console.error('Error analyzing repository:', error);
           return res.status(500).json({error: 'Failed to analyze repository'});
    }
}