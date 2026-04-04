import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Loader2, Target, Layers, Code2, FileText, Database, FolderTree, TerminalSquare, MessageSquare, Download, AlertCircle, PlayCircle, Code, FileCode2, Stars, CheckCircle2, ChevronRight, User, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import ArchGraph from '../components/ArchGraph';
import { analyzeRepository, chatWithRepository } from '../services/apiService';
import { initiateSocketConnection, getSocket, disconnectSocket } from '../services/socketService';

export default function Dashboard() {
  const [repoUrl, setRepoUrl] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressStep, setProgressStep] = useState(null);
  const [error, setError] = useState(null);
  
  const [summary, setSummary] = useState(null);
  const [analyzedRepoUrl, setAnalyzedRepoUrl] = useState('');
  
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Hi! Analyze a repository first, then ask me anything about it.' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    return () => disconnectSocket();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleAnalyze = async (e) => {
    e?.preventDefault();
    if (!repoUrl) return;

    setIsAnalyzing(true);
    setError(null);
    setProgressStep('cloning_started');
    setSummary(null);

    try {
      initiateSocketConnection();
      const socket = getSocket();

      socket.on('progress', (data) => {
        setProgressStep(data.step);
      });

      socket.on('progress_error', (data) => {
        setError(data.message);
        setIsAnalyzing(false);
        disconnectSocket();
      });

      socket.on('connect', async () => {
        try {
          const res = await analyzeRepository(repoUrl, socket.id);
          setSummary(res.summary);
          setAnalyzedRepoUrl(repoUrl);
          setChatMessages([{ role: 'assistant', text: `Repository loaded! I've read the source code of ${repoUrl}. What would you like to know?` }]);
        } catch (err) {
          setError(err.message || err.toString());
        } finally {
          setIsAnalyzing(false);
          disconnectSocket();
        }
      });
    } catch {
      setError('Failed to connect to server');
      setIsAnalyzing(false);
    }
  };

  const handleAskAI = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || isChatLoading || !analyzedRepoUrl) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsChatLoading(true);

    try {
      const history = chatMessages.filter(m => m.role !== 'system');
      const response = await chatWithRepository(analyzedRepoUrl, userMessage, history);
      setChatMessages(prev => [...prev, { role: 'assistant', text: response.answer }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Error: ' + err.message }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!summary) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129);
    doc.text("Repository Analysis Report", 20, 20);
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Complexity: " + (summary.complexityScore || summary.complexityLevel || 'N/A'), 20, 30);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    
    let y = 40;
    const addSection = (title, content) => {
        if (!content) return;
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.text(title, 20, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        let textLines = doc.splitTextToSize(String(content), 170);
        for(let line of textLines) {
           if (y > 280) { doc.addPage(); y = 20; }
           doc.text(line, 20, y);
           y += 7;
        }
        y += 10;
    };

    addSection("Project Overview", summary.projectOverview || summary.summary);
    addSection("Architecture", summary.architecture);
    addSection("Key Features", summary.keyFeatures?.join('\\n- '));
    addSection("Code Quality Review", summary.codeQualityReview);
    addSection("Security Analysis", summary.securityAnalysis);
    addSection("Tech Stack", summary.techStack?.join(', '));
    addSection("Improvements", summary.improvements?.join('\\n- '));
    addSection("Resume Description", summary.resumeDescription);

    doc.save('repo-analysis.pdf');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'architecture', label: 'Architecture', icon: Layers },
    { id: 'techstack', label: 'Tech Stack', icon: Code2 },
    { id: 'metrics', label: 'Metrics', icon: Database },
    { id: 'insights', label: 'Insights', icon: TerminalSquare },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-emerald-500/30">
      
      {/* Background ambient light */}
      <div className="absolute top-0 left-[20%] w-[600px] h-[300px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* --- FIXED TOP BAR --- */}
      <header className="h-16 shrink-0 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-4 z-20">
        
        {/* Brand */}
        <div className="flex items-center gap-3 w-64">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Code className="w-4 h-4 text-white"/>
           </div>
           <h1 className="font-bold text-white tracking-tight hidden sm:block">AI Analyzer</h1>
        </div>

        {/* Action Center - Repo URL | Ask AI | Analyze */}
        <div className="flex-1 max-w-4xl flex items-center gap-3 mx-4">
          
          <form className="flex-1 flex gap-2 relative" onSubmit={handleAnalyze}>
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
             <input 
               type="text" 
               placeholder="GitHub Repo URL..." 
               value={repoUrl}
               onChange={(e) => setRepoUrl(e.target.value)}
               className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg py-1.5 pl-9 pr-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
             />
          </form>

          <form className="flex-1 flex gap-2 relative" onSubmit={handleAskAI}>
             <MessageSquare className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
             <input 
               type="text" 
               placeholder="Ask AI anything about this repo..." 
               value={chatInput}
               onChange={(e) => setChatInput(e.target.value)}
               disabled={!summary}
               className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg py-1.5 pl-9 pr-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors disabled:opacity-50"
             />
          </form>

          <button 
             onClick={handleAnalyze}
             disabled={!repoUrl || isAnalyzing}
             className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 whitespace-nowrap"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin"/> : <PlayCircle className="w-4 h-4"/>} 
            Analyze
          </button>
        </div>
        
        {/* Top right actions */}
        <div className="w-48 flex justify-end">
          <button 
             onClick={downloadPDF}
             disabled={!summary}
             className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-emerald-400 text-sm rounded-lg flex items-center gap-2 border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" /> PDF Report
          </button>
        </div>
      </header>

      {/* --- DASHBOARD LAYOUT --- */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* --- LEFT SIDEBAR --- */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/30 flex flex-col pt-6 z-10 shrink-0">
          <div className="px-4 mb-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Navigation</div>
          <nav className="flex-1 space-y-1 px-2 flex flex-col">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-emerald-500/10 text-emerald-400 shadow-sm border border-emerald-500/20' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
            
            <div className="mt-4 pt-4 border-t border-slate-800/50">
               <button
                  onClick={downloadPDF}
                  disabled={!summary}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    !summary 
                      ? 'text-slate-500 opacity-50 cursor-not-allowed'
                      : 'text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  PDF Report
               </button>
            </div>
          </nav>
          
          {summary && (
             <div className="p-4 mt-auto">
               <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 text-center shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10"><Stars className="w-12 h-12 text-emerald-500"/></div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Score</div>
                  <div className="text-2xl font-black text-emerald-400">{summary.complexityScore || summary.complexityLevel}</div>
               </div>
             </div>
          )}
        </aside>

        {/* --- MAIN CONTENT AREA --- */}
        <main className="flex-1 overflow-y-auto relative bg-slate-950 p-8 scroll-smooth">
          
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5"/>
              <p>{error}</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-20">
               <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-8 backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.1)] w-full max-w-lg">
                 <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                    Analyzing Repository
                 </h3>
                 <div className="space-y-6">
                    {['cloning_started', 'reading_files', 'analyzing_code', 'analysis_completed'].map((step, idx) => {
                      const stages = ['cloning_started', 'reading_files', 'analyzing_code', 'analysis_completed'];
                      const currIdx = stages.indexOf(progressStep);
                      const isCompleted = currIdx > idx;
                      const isActive = currIdx === idx;
                      return (
                         <div key={step} className="flex items-center gap-4">
                           <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isCompleted ? 'bg-emerald-500 text-white' : isActive ? 'bg-emerald-500/20 border border-emerald-400' : 'bg-slate-800'}`}>
                              {isCompleted && <CheckCircle2 className="w-3 h-3"/>}
                              {isActive && <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />}
                           </div>
                           <span className={isActive ? 'text-white font-medium' : isCompleted ? 'text-slate-400' : 'text-slate-600'}>
                             {step.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                           </span>
                         </div>
                      )
                    })}
                 </div>
               </div>
            </div>
          )}

          {!summary && !isAnalyzing && (
            <div className="flex flex-col items-center justify-center h-full opacity-60">
              <Stars className="w-20 h-20 text-slate-700 mb-6" />
              <h2 className="text-2xl font-bold text-slate-400 mb-2">No Analysis Selected</h2>
              <p className="text-slate-500">Enter a GitHub matching URL in the top bar and click Analyze.</p>
            </div>
          )}

          {summary && !isAnalyzing && (
            <div className="max-w-4xl mx-auto pb-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  
                  {/* OVERVIEW */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <h2 className="text-3xl font-bold flex items-center gap-3"><Target className="text-emerald-400 w-8 h-8"/> Project Overview</h2>
                      <div className="glass-card rounded-2xl p-6 leading-relaxed text-slate-300 text-lg border border-slate-700/50">
                        {summary.projectOverview || summary.summary}
                      </div>

                      <h3 className="text-xl font-bold mt-10 mb-4 text-white">Code Quality Review</h3>
                      <div className="glass-card rounded-2xl p-6 text-slate-300 border border-slate-700/50 leading-relaxed whitespace-pre-wrap">
                        {summary.codeQualityReview}
                      </div>
                    </div>
                  )}

                  {/* ARCHITECTURE */}
                  {activeTab === 'architecture' && (
                    <div className="space-y-6">
                      <h2 className="text-3xl font-bold flex items-center gap-3"><Layers className="text-emerald-400 w-8 h-8"/> Architecture</h2>
                      
                      <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-inner h-[500px]">
                        <ArchGraph data={summary.architectureGraph} />
                      </div>

                      <div className="glass-card rounded-2xl p-6 text-slate-300 text-base leading-relaxed border border-slate-700/50 whitespace-pre-wrap">
                        {summary.architecture}
                      </div>
                    </div>
                  )}

                  {/* TECH STACK */}
                  {activeTab === 'techstack' && (
                    <div className="space-y-6">
                      <h2 className="text-3xl font-bold flex items-center gap-3"><Code2 className="text-emerald-400 w-8 h-8"/> Tech Stack</h2>
                      <div className="flex flex-wrap gap-3 p-6 glass-card rounded-2xl border border-slate-700/50">
                        {summary.techStack?.map((tech, i) => (
                           <span key={i} className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl font-medium text-emerald-300 shadow-sm">
                             {tech}
                           </span>
                        ))}
                      </div>

                      <h3 className="text-xl font-bold mt-10 mb-4 text-white">Security Analysis</h3>
                      <div className="glass-card rounded-2xl p-6 text-slate-300 border border-slate-700/50 leading-relaxed whitespace-pre-wrap">
                        {summary.securityAnalysis}
                      </div>
                    </div>
                  )}

                  {/* METRICS */}
                  {activeTab === 'metrics' && (
                    <div className="space-y-6">
                      <h2 className="text-3xl font-bold flex items-center gap-3"><Database className="text-emerald-400 w-8 h-8"/> Metrics</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { l: 'Total Files', v: summary.metrics?.totalFiles, i: FileText, c: 'text-blue-400' },
                          { l: 'Lines of Code', v: summary.metrics?.linesOfCode?.toLocaleString(), i: Code, c: 'text-emerald-400' },
                          { l: 'Languages', v: summary.metrics?.languages?.length || 0, i: Database, c: 'text-purple-400' },
                          { l: 'Max Depth', v: summary.metrics?.maxFolderDepth, i: FolderTree, c: 'text-amber-400' },
                        ].map(metric => (
                           <div key={metric.l} className="glass-card rounded-2xl p-6 border border-slate-700/50 flex flex-col items-center justify-center text-center">
                             <metric.i className={`w-8 h-8 mb-3 ${metric.c}`}/>
                             <span className="text-3xl font-bold text-white mb-1">{metric.v}</span>
                             <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{metric.l}</span>
                           </div>
                        ))}
                      </div>
                      
                      <div className="glass-card rounded-2xl p-6 border border-slate-700/50 flex items-center gap-6 mt-6">
                         <div className="p-4 bg-rose-500/10 rounded-xl text-rose-400"><FileCode2 className="w-8 h-8"/></div>
                         <div>
                            <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-1">Largest Module</div>
                            <div className="text-xl font-bold text-white">{summary.metrics?.largestModule?.name || '-'}</div>
                         </div>
                      </div>
                    </div>
                  )}

                  {/* INSIGHTS */}
                  {activeTab === 'insights' && (
                    <div className="space-y-6">
                      <h2 className="text-3xl font-bold flex items-center gap-3"><TerminalSquare className="text-emerald-400 w-8 h-8"/> Insights & Features</h2>
                      
                      <div className="glass-card rounded-2xl p-8 border border-slate-700/50 relative overflow-hidden">
                        <div className="absolute inset-0 bg-emerald-600/5 opacity-50"/>
                        <h3 className="text-lg font-bold text-emerald-400 mb-4 relative z-10 flex items-center gap-2">Resume Description <TerminalSquare className="w-4 h-4"/></h3>
                        <p className="text-xl font-medium italic leading-relaxed text-slate-200 relative z-10 mb-4">"{summary.resumeDescription}"</p>
                        <button onClick={() => navigator.clipboard.writeText(summary.resumeDescription)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-600 relative z-10 flex items-center gap-2 w-max">
                           Copy Text
                        </button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 mt-6">
                        <div className="glass-card rounded-2xl p-6 border border-slate-700/50">
                           <h3 className="text-lg font-bold text-white mb-4">Key Features</h3>
                           <ul className="space-y-3">
                             {summary.keyFeatures?.map((f, i) => (
                                <li key={i} className="flex gap-3 text-slate-300 text-sm">
                                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5"/> <span>{f}</span>
                                </li>
                             ))}
                           </ul>
                        </div>
                        <div className="glass-card rounded-2xl p-6 border border-slate-700/50 flex flex-col">
                           <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">Suggested Improvements</h3>
                           <ul className="space-y-3 flex-1">
                             {summary.improvements?.map((f, i) => (
                                <li key={i} className="flex gap-3 text-slate-300 text-sm">
                                  <ChevronRight className="w-5 h-5 shrink-0 text-amber-500 mt-0.5"/> <span>{f}</span>
                                </li>
                             ))}
                           </ul>
                        </div>
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </main>

        {/* --- RIGHT CHATBOT SIDEBAR --- */}
        <aside className="w-[350px] border-l border-slate-800 bg-slate-900/50 flex flex-col z-10 shadow-2xl relative">
          <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center gap-3 z-10">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg"><Bot className="w-5 h-5"/></div>
            <div>
              <h3 className="font-bold text-white">Ask AI Chat</h3>
              <p className="text-xs text-slate-400">Context: {analyzedRepoUrl ? 'Loaded' : 'None'}</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {chatMessages.map((msg, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                key={idx} 
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div className={`p-3 rounded-2xl max-w-[85%] ${
                  msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-sm shadow-md' : 'bg-slate-800/80 text-slate-200 rounded-tl-sm border border-slate-700/50 shadow-inner'
                }`}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </motion.div>
            ))}
            {isChatLoading && (
              <div className="flex gap-3">
                 <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                 <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/50 rounded-tl-sm text-sm text-slate-400 flex items-center gap-2">
                   <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> Analyzing...
                 </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form className="p-4 bg-slate-900 border-t border-slate-800" onSubmit={handleAskAI}>
            <div className="relative">
               <input 
                 type="text" 
                 disabled={!analyzedRepoUrl || isChatLoading}
                 value={chatInput}
                 onChange={e => setChatInput(e.target.value)}
                 placeholder={analyzedRepoUrl ? "Type your question..." : "Analyze a repo first..."}
                 className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-50 transition-colors"
               />
               <button 
                 type="submit"
                 disabled={!chatInput.trim() || !analyzedRepoUrl || isChatLoading}
                 className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-emerald-400 hover:text-emerald-300 disabled:text-slate-600 transition-colors"
               >
                 {isChatLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19V5m0 0l-7 7m7-7l7 7"/></svg>}
               </button>
            </div>
          </form>
        </aside>

      </div>
    </div>
  );
}
