import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { initiateSocketConnection, getSocket, disconnectSocket } from '../services/socketService';
import { analyzeRepository } from '../services/apiService';

const STAGES = ['cloning_started', 'cloning_completed', 'reading_files', 'analyzing_code', 'analysis_completed'];

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStage, setCurrentStage] = useState('');
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    return () => disconnectSocket();
  }, []);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!repoUrl) return;

    setIsAnalyzing(true);
    setError(null);
    setCurrentStage('cloning_started');

    try {
      initiateSocketConnection();
      const socket = getSocket();

      socket.on('progress', (data) => {
        setCurrentStage(data.step);
      });

      socket.on('progress_error', (data) => {
        setError(data.message);
        setIsAnalyzing(false);
        disconnectSocket();
      });

      socket.on('connect', async () => {
        try {
          const res = await analyzeRepository(repoUrl, socket.id);
          navigate('/result', { state: { result: res.summary } });
        } catch (err) {
          setError(err);
          setIsAnalyzing(false);
        }
      });
    } catch (err) {
      setError('Failed to connect to server');
      setIsAnalyzing(false);
    }
  };

  const currentStageIndex = STAGES.indexOf(currentStage);

  return (
    <div className="flex flex-col items-center justify-center pt-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-2xl w-full"
      >
        <span className="px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium border border-blue-500/20 mb-6 inline-block">
          AI-Powered Code Intelligence
        </span>
        
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
          Analyze Any Public <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 text-transparent bg-clip-text">
            GitHub Repository
          </span>
        </h2>
        
        <p className="text-slate-400 text-lg mb-12">
          Drop a GitHub link below and our AI will generate a complete project summary, breakdown the tech stack, and suggest improvements.
        </p>

        <form onSubmit={handleAnalyze} className="relative max-w-xl mx-auto mb-16">
          <div className="relative group flex items-center">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            </div>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/facebook/react"
              disabled={isAnalyzing}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-32 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-lg glass-card"
            />
            <button
              type="submit"
              disabled={!repoUrl || isAnalyzing}
              className="absolute right-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analyze'}
            </button>
          </div>
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm mt-4 text-left px-4">
              {error}
            </motion.p>
          )}
        </form>

        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-xl mx-auto text-left bg-slate-900/40 border border-slate-800 rounded-2xl p-6 glass-card overflow-hidden"
            >
              <h3 className="text-lg font-medium text-white mb-6">Analysis Progress</h3>
              <div className="space-y-6">
                {[
                  { id: 'cloning_started', label: 'Cloning Repository' },
                  { id: 'reading_files', label: 'Reading Source Code' },
                  { id: 'analyzing_code', label: 'AI Analyzing Patterns' },
                  { id: 'analysis_completed', label: 'Completed' }
                ].map((step, index) => {
                  const stepIndex = STAGES.indexOf(step.id);
                  let status = 'waiting';
                  if (currentStageIndex > stepIndex) status = 'completed';
                  else if (currentStageIndex === stepIndex) status = 'active';

                  return (
                    <div key={step.id} className="relative flex items-center gap-4">
                      {index !== 3 && (
                        <div className={`absolute top-8 left-3 w-px h-10 -ml-px ${status === 'completed' ? 'bg-blue-500' : 'bg-slate-700'}`} />
                      )}
                      <div className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                        status === 'completed' ? 'bg-blue-500 border-blue-500 text-white' :
                        status === 'active' ? 'border-blue-400 bg-blue-400/20 text-blue-400' :
                        'border-slate-700 bg-slate-800 text-slate-500'
                      }`}>
                        {status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : 
                         status === 'active' ? <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" /> : null}
                      </div>
                      <span className={`font-medium ${
                        status === 'active' ? 'text-white' :
                        status === 'completed' ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
