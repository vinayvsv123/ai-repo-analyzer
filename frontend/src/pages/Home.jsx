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
          navigate('/result', { state: { result: res.summary, repoUrl, fileTree: res.fileTree || [], filesDatabase: res.filesDatabase || {} } });
        } catch (err) {
          setError(err.message || err.toString());
          setIsAnalyzing(false);
        }
      });
    } catch {
      setError('Failed to connect to server');
      setIsAnalyzing(false);
    }
  };

  const currentStageIndex = STAGES.indexOf(currentStage);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200 items-center justify-center relative overflow-hidden font-sans selection:bg-emerald-500/30 p-6">
      {/* Ambient glow matching Result.jsx */}
      <div className="absolute top-0 left-[20%] w-[600px] h-[300px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-[10%] w-[400px] h-[200px] bg-teal-600/5 blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-2xl w-full relative z-10"
      >
        <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/20 mb-6 inline-block shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          AI-Powered Code Intelligence
        </span>
        
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
          Analyze Any Public <br />
          <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 text-transparent bg-clip-text">
            GitHub Repository
          </span>
        </h2>
        
        <p className="text-slate-400 text-lg mb-12">
          Drop a GitHub link below and our AI will generate a complete project summary, breakdown the tech stack, metrics, caching, and suggest improvements.
        </p>

        <form onSubmit={handleAnalyze} className="relative max-w-xl mx-auto mb-12">
          <div className="relative group flex items-center">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            </div>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/facebook/react"
              disabled={isAnalyzing}
              className="w-full bg-slate-900/50 border border-slate-700/80 rounded-2xl py-4 pl-12 pr-36 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-lg shadow-emerald-900/20 backdrop-blur-sm"
            />
            <button
              type="submit"
              disabled={!repoUrl || isAnalyzing}
              className="absolute right-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:hover:from-emerald-600 disabled:hover:to-teal-600 text-white font-medium rounded-xl transition-all shadow-md shadow-emerald-500/20"
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Analyze'}
            </button>
          </div>
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm mt-4 text-center px-4 bg-red-500/10 py-2 rounded-xl border border-red-500/20">
              {error}
            </motion.p>
          )}
        </form>

        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="max-w-xl mx-auto text-left bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-8 backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.15)] overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Loader2 className="w-24 h-24 animate-spin text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-100 to-emerald-400 bg-clip-text text-transparent mb-8 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                 Analysis Timeline
              </h3>
              <div className="space-y-8 relative pl-2">
                {[
                  { id: 'cloning_started', label: 'Cloning Repository' },
                  { id: 'reading_files', label: 'Reading Source Code & Computing Metrics' },
                  { id: 'analyzing_code', label: 'AI Generating Architecture & Insights' },
                  { id: 'analysis_completed', label: 'Analysis Results Ready' }
                ].map((step, index) => {
                  const stepIndex = STAGES.indexOf(step.id);
                  let status = 'waiting';
                  if (currentStageIndex > stepIndex) status = 'completed';
                  else if (currentStageIndex === stepIndex) status = 'active';

                  return (
                    <div key={step.id} className="relative flex items-center gap-5">
                      {index !== 3 && (
                        <div className={`absolute top-8 left-[11px] w-[2px] h-10 ${status === 'completed' ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                      )}
                      <div className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                        status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                        status === 'active' ? 'border-emerald-400 bg-slate-900 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]' :
                        'border-slate-700 bg-slate-900 text-slate-600'
                      }`}>
                        {status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                         status === 'active' ? <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> : null}
                      </div>
                      <span className={`text-base font-medium transition-colors duration-300 ${
                        status === 'active' ? 'text-white' :
                        status === 'completed' ? 'text-slate-300' : 'text-slate-600'
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