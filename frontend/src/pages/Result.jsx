import { useLocation, useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, Copy, Layers, Target, TerminalSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const summary = location.state?.result;

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Results Found</h2>
        <p className="text-slate-400 mb-6">You need to analyze a repository first.</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
    // Could add brief toast here
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'repo-analysis.json';
    a.click();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="pb-20"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white flex items-center gap-2 mb-4 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Analyze Another Repo
          </button>
          <h2 className="text-3xl font-bold text-white">Repository Analysis</h2>
        </div>
        <div className="flex gap-3">
          <button onClick={handleCopy} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-2 border border-slate-700 transition-colors tooltip tooltip-top" data-tip="Copy JSON">
            <Copy className="w-5 h-5" />
          </button>
          <button onClick={handleDownload} className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg flex items-center gap-2 border border-blue-500/20 transition-colors font-medium">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Main Summary */}
        <motion.div variants={itemVariants} className="md:col-span-2 glass-card rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-white">Project Summary</h3>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {summary.summary}
          </p>
        </motion.div>

        {/* Complexity Level */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 border border-slate-700/50 flex flex-col justify-center items-center text-center">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">Complexity</h3>
          <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-white font-bold text-lg shadow-inner">
             {summary.complexityLevel}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Tech Stack */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-white">Tech Stack</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.techStack?.map((tech, i) => (
              <span key={i} className="px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-300 shadow-sm">
                {tech}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Resume Description */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <TerminalSquare className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-white">Resume Description</h3>
          </div>
          <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-300 italic">
            "{summary.resumeDescription}"
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Improvements */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-white">Suggested Improvements</h3>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.improvements?.map((imp, i) => (
              <li key={i} className="flex gap-3 text-slate-300 bg-slate-800/30 p-4 rounded-xl border border-slate-700/30">
                <div className="min-w-6 min-h-6 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 text-xs font-bold border border-slate-700">
                  {i + 1}
                </div>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Folder Explanation */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
               <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-white">Architecture Breakdown</h3>
          </div>
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
            {summary.folderExplanation}
          </p>
        </motion.div>
      </div>

    </motion.div>
  );
}
