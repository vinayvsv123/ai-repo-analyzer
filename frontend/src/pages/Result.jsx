import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Target, Layers, Code2, Database, TerminalSquare,
  Download, Code, FolderTree, MessageSquare, Bot, User,
  Loader2, Stars, CheckCircle2, ChevronRight, FileCode2,
  X, Sparkles, Package, FileText, Copy, Network
} from 'lucide-react';
import ArchGraph from '../components/ArchGraph';
import FileTree from '../components/FileTree';
import ChatBox from '../components/ChatBox';
import FolderRelationsGraph from '../components/FolderRelationsGraph';
import VisualSection from '../components/VisualSection';
import { chatWithRepository, explainFile as explainFileAPI } from '../services/apiService';
import jsPDF from 'jspdf';

const LANG_NAMES = {
  js: 'JavaScript', jsx: 'React JSX', ts: 'TypeScript', tsx: 'React TSX',
  py: 'Python', java: 'Java', cpp: 'C++', go: 'Go', rs: 'Rust',
  html: 'HTML', css: 'CSS', json: 'JSON', md: 'Markdown'
};

const LANG_COLORS = {
  js: '#f7df1e', jsx: '#61dafb', ts: '#3178c6', tsx: '#61dafb',
  py: '#3776ab', java: '#b07219', cpp: '#f34b7d', go: '#00add8',
  rs: '#dea584', html: '#e34c26', css: '#563d7c', json: '#f5a623',
  md: '#083fa1'
};

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const { result: summary, repoUrl, fileTree = [], filesDatabase = {} } = location.state || {};

  useEffect(() => {
    if (!summary) navigate('/', { replace: true });
  }, []);

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileExplanation, setFileExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: `I've analyzed this repository. Ask me anything about the codebase!` }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef(null);
  const [chatWidth, setChatWidth] = useState(350);

  useEffect(() => {
    const handleResize = () => {
      setChatWidth(window.innerWidth < 768 ? window.innerWidth : 350);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!summary) return null;

  const repoName = repoUrl?.replace('https://github.com/', '').replace('.git', '') || 'Repository';
  const metrics = summary.metrics || {};
  const languages = metrics.languages || {};
  const totalLangFiles = Object.values(languages).reduce((a, b) => a + b, 0) || 1;

  const handleFileClick = (node) => {
    setSelectedFile(node);
    setFileExplanation('');
  };

  const handleCloseFile = () => {
    setSelectedFile(null);
    setFileExplanation('');
  };

  const handleExplainFile = async () => {
    if (!selectedFile || isExplaining) return;
    const content = filesDatabase[selectedFile.path];
    if (!content) return;
    setIsExplaining(true);
    try {
      const res = await explainFileAPI(selectedFile.path, content);
      setFileExplanation(res.explanation);
    } catch (err) {
      setFileExplanation('Failed to explain file. ' + (err.message || err));
    } finally {
      setIsExplaining(false);
    }
  };

  const handleChat = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    const msg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsChatLoading(true);
    try {
      const history = chatMessages.filter(m => m.role !== 'system');
      const res = await chatWithRepository(repoUrl, msg, history);
      setChatMessages(prev => [...prev, { role: 'assistant', text: res.answer }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Error: ' + err.message }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPDF = () => {
    if (!summary) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129);
    doc.text("Repository Analysis Report", 20, 20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    let y = 35;
    const addSection = (title, content) => {
      if (!content) return;
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.text(title, 20, y); y += 8;
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(String(content), 170);
      for (const line of lines) {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.text(line, 20, y); y += 7;
      }
      y += 10;
    };
    addSection("Project Overview", summary.projectOverview || summary.summary);
    addSection("Architecture", summary.architecture);
    addSection("Key Features", summary.keyFeatures?.join('\n- '));
    addSection("Code Quality Review", summary.codeQualityReview);
    addSection("Tech Stack", summary.techStack?.join(', '));
    addSection("Improvements", summary.improvements?.join('\n- '));
    addSection("Resume Description", summary.resumeDescription);
    doc.save('repo-analysis.pdf');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'filetree', label: 'File Tree', icon: FolderTree },
    { id: 'folderrelations', label: 'Folder Relations', icon: Network },
    { id: 'metrics', label: 'Metrics', icon: Database },
    { id: 'techstack', label: 'Tech Stack', icon: Package },
    { id: 'architecture', label: 'Architecture', icon: Layers },
    { id: 'insights', label: 'Insights', icon: TerminalSquare },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Ambient glow */}
      <div className="absolute top-0 left-[20%] w-[600px] h-[300px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-[10%] w-[400px] h-[200px] bg-teal-600/5 blur-[100px] rounded-full pointer-events-none" />

      {/* ── HEADER ── */}
      <header className="h-14 shrink-0 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all">
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
          <div className="w-px h-6 bg-slate-700" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Code className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-white text-sm hidden sm:block">{repoName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {summary.complexityScore && (
            <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              {summary.complexityScore}
            </div>
          )}
          <button onClick={() => setIsChatOpen(!isChatOpen)} className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 transition-all ${isChatOpen ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
            <MessageSquare className="w-4 h-4" /> Chat
          </button>
          <button onClick={downloadPDF} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-sm rounded-lg flex items-center gap-2 border border-slate-700 transition-colors">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </header>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {!selectedFile && (
            <div className="shrink-0 border-b border-slate-800 bg-slate-900/50 px-4 flex items-center gap-1 h-11 overflow-x-auto whitespace-nowrap scrollbar-none">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all border-b-2 shrink-0 ${activeTab === tab.id ? 'text-emerald-400 border-emerald-500 bg-slate-800/50' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                >
                  <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
            <AnimatePresence mode="wait">
              {selectedFile ? (
                <motion.div key="file-viewer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="max-w-5xl mx-auto">
                  {/* File header */}
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <FileCode2 className="w-5 h-5 text-emerald-400" />
                      <span className="font-mono text-sm text-white">{selectedFile.path}</span>
                      <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{selectedFile.size} lines</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleExplainFile} disabled={isExplaining}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2">
                        {isExplaining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {isExplaining ? 'Analyzing...' : 'Explain with AI'}
                      </button>
                      <button onClick={handleCloseFile} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Code viewer */}
                  <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg">
                    <div className="overflow-auto max-h-[500px]">
                      <pre className="p-4 text-sm font-mono leading-relaxed">
                        {(filesDatabase[selectedFile.path] || '').split('\n').map((line, i) => (
                          <div key={i} className="flex hover:bg-slate-800/50 group">
                            <span className="text-slate-600 w-12 text-right pr-4 select-none shrink-0 group-hover:text-slate-400 transition-colors">{i + 1}</span>
                            <span className="text-slate-200 whitespace-pre">{line || ' '}</span>
                          </div>
                        ))}
                      </pre>
                    </div>
                  </div>

                  {/* AI Explanation */}
                  <AnimatePresence>
                    {(fileExplanation || isExplaining) && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass-card rounded-2xl p-6 border border-emerald-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles className="w-16 h-16 text-emerald-500" /></div>
                        <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2 relative z-10">
                          <Sparkles className="w-5 h-5" /> AI Explanation
                        </h3>
                        {isExplaining ? (
                          <div className="flex items-center gap-3 text-slate-400">
                            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                            <span>Analyzing file structure, patterns, and logic...</span>
                          </div>
                        ) : (
                          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap relative z-10">{fileExplanation}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className={activeTab === 'filetree' || activeTab === 'folderrelations' ? "max-w-6xl w-full mx-auto" : "max-w-4xl mx-auto"}>

                  {/* ═══ OVERVIEW TAB ═══ */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <h2 className="text-3xl font-bold flex items-center gap-3"><Target className="text-emerald-400 w-8 h-8" /> Project Overview</h2>
                      <VisualSection text={summary.projectOverview || summary.summary} type="overview" />

                      {/* Quick metrics row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Files', value: metrics.totalFiles, color: 'from-blue-500 to-cyan-500', icon: FileText },
                          { label: 'Lines of Code', value: (metrics.linesOfCode || 0).toLocaleString(), color: 'from-emerald-500 to-teal-500', icon: Code },
                          { label: 'Folders', value: metrics.totalFolders, color: 'from-purple-500 to-pink-500', icon: FolderTree },
                          { label: 'Main Language', value: metrics.mainLanguage || '—', color: 'from-amber-500 to-orange-500', icon: Code2 },
                        ].map(m => (
                          <div key={m.label} className="relative group bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 flex flex-col items-center text-center overflow-hidden hover:border-slate-600 transition-colors">
                            <div className={`absolute inset-0 bg-gradient-to-br ${m.color} opacity-[0.04] group-hover:opacity-[0.08] transition-opacity`} />
                            <m.icon className="w-6 h-6 mb-2 text-slate-400 relative z-10" />
                            <span className="text-2xl font-bold text-white mb-1 relative z-10">{m.value}</span>
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest relative z-10">{m.label}</span>
                          </div>
                        ))}
                      </div>

                      <h3 className="text-xl font-bold mt-8 mb-4 text-white">Code Quality Review</h3>
                      <VisualSection text={summary.codeQualityReview} type="quality" />
                    </div>
                  )}

                  {/* ═══ FILETREE TAB ═══ */}
                  {activeTab === 'filetree' && (
                    <div className="space-y-6">
                      <h2 className="text-3xl font-bold flex items-center gap-3"><FolderTree className="text-emerald-400 w-8 h-8" /> File Explorer</h2>
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-6">
                        <div className="glass-card rounded-2xl border border-slate-700/50 overflow-hidden flex flex-col max-h-[650px] min-h-[400px]">
                          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <FileTree tree={fileTree} onFileClick={handleFileClick} selectedFile={selectedFile} />
                          </div>
                          <div className="p-4 border-t border-slate-700/50 bg-slate-900/80">
                            <div className="flex gap-6 justify-center text-center">
                              <div>
                                <div className="text-xl font-bold text-emerald-400">{metrics.totalFiles || 0}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Files</div>
                              </div>
                              <div className="w-px bg-slate-700/50 h-8"></div>
                              <div>
                                <div className="text-xl font-bold text-teal-400">{metrics.totalFolders || 0}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Folders</div>
                              </div>
                              <div className="w-px bg-slate-700/50 h-8"></div>
                              <div>
                                <div className="text-xl font-bold text-cyan-400">{(metrics.linesOfCode || 0).toLocaleString()}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lines</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <ChatBox repoUrl={repoUrl} />
                      </div>
                    </div>
                  )}

                  {/* ═══ FOLDER RELATIONS TAB ═══ */}
                  {activeTab === 'folderrelations' && (
                    <div className="space-y-6 flex flex-col h-[650px] min-h-[400px]">
                      <div>
                        <h2 className="text-3xl font-bold flex items-center gap-3">
                          <Network className="text-emerald-400 w-8 h-8 animate-pulse" /> Folder Relations
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                          Understand connections, imports, and dependencies between folders of the repository.
                        </p>
                      </div>
                      <div className="flex-1 min-h-0 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 shadow-inner">
                        <FolderRelationsGraph filesDatabase={filesDatabase} />
                      </div>
                    </div>
                  )}

                  {/* ═══ METRICS TAB ═══ */}
                  {activeTab === 'metrics' && (
                    <div className="space-y-6">
                      <h2 className="text-3xl font-bold flex items-center gap-3"><Database className="text-emerald-400 w-8 h-8" /> Code Metrics</h2>
                      <p className="text-slate-400 text-sm">All metrics are computed directly from the repository source code — not AI-generated text.</p>

                      {/* Big stat cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: 'Total Files', value: metrics.totalFiles, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                          { label: 'Lines of Code', value: (metrics.linesOfCode || 0).toLocaleString(), icon: Code, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                          { label: 'Folders', value: metrics.totalFolders, icon: FolderTree, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                          { label: 'Main Language', value: metrics.mainLanguage, icon: Code2, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        ].map(m => (
                          <div key={m.label} className="glass-card rounded-2xl p-6 border border-slate-700/50 flex flex-col items-center justify-center text-center">
                            <div className={`p-3 rounded-xl mb-3 ${m.bg}`}><m.icon className={`w-7 h-7 ${m.color}`} /></div>
                            <span className="text-3xl font-bold text-white mb-1">{m.value}</span>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{m.label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Language breakdown */}
                      <div className="glass-card rounded-2xl p-6 border border-slate-700/50">
                        <h3 className="text-lg font-bold text-white mb-4">Language Distribution</h3>
                        <div className="space-y-3">
                          {Object.entries(languages)
                            .sort((a, b) => b[1] - a[1])
                            .map(([ext, count]) => (
                              <div key={ext} className="flex items-center gap-3">
                                <span className="w-24 text-sm text-slate-300 font-medium">{LANG_NAMES[ext] || ext.toUpperCase()}</span>
                                <div className="flex-1 h-6 bg-slate-800/80 rounded-full overflow-hidden relative">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(count / totalLangFiles) * 100}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: LANG_COLORS[ext] || '#64748b' }}
                                  />
                                </div>
                                <span className="text-sm text-slate-400 w-16 text-right font-mono">{count} files</span>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Largest module */}
                      <div className="glass-card rounded-2xl p-6 border border-slate-700/50 flex items-center gap-6">
                        <div className="p-4 bg-rose-500/10 rounded-xl text-rose-400"><FileCode2 className="w-8 h-8" /></div>
                        <div>
                          <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-1">Largest Module</div>
                          <div className="text-xl font-bold text-white">{metrics.largestModule?.name || '—'}</div>
                          <div className="text-sm text-slate-500">{metrics.largestModule?.sizeLines || 0} lines</div>
                        </div>
                        <div className="ml-auto text-sm text-slate-500">Max Depth: <span className="text-white font-bold">{metrics.maxFolderDepth}</span></div>
                      </div>
                    </div>
                  )}

                  {/* ═══ TECH STACK TAB ═══ */}
                  {activeTab === 'techstack' && (
                    <div className="space-y-6">
                      <h2 className="text-3xl font-bold flex items-center gap-3"><Package className="text-emerald-400 w-8 h-8" /> Tech Stack & Dependencies</h2>

                      {/* Detected from package.json */}
                      {metrics.dependencies?.length > 0 && (
                        <div className="glass-card rounded-2xl p-6 border border-slate-700/50">
                          <h3 className="text-lg font-bold text-white mb-1">Detected from package.json</h3>
                          <p className="text-xs text-slate-500 mb-4">Auto-detected by parsing dependency files — not AI text.</p>
                          <div className="flex flex-wrap gap-2">
                            {metrics.dependencies.map((dep, i) => (
                              <span key={i} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 font-mono hover:border-emerald-500/30 hover:text-emerald-300 transition-colors cursor-default">
                                {dep}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI-detected tech stack */}
                      <div className="glass-card rounded-2xl p-6 border border-slate-700/50">
                        <h3 className="text-lg font-bold text-white mb-4">Full Technology Stack</h3>
                        <div className="flex flex-wrap gap-3">
                          {summary.techStack?.map((tech, i) => (
                            <span key={i} className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl font-medium text-emerald-300 shadow-sm">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      <h3 className="text-xl font-bold mt-8 mb-4 text-white">Security Analysis</h3>
                      <VisualSection text={summary.securityAnalysis} type="security" />
                    </div>
                  )}

                  {/* ═══ ARCHITECTURE TAB ═══ */}
                  {activeTab === 'architecture' && (
                    <div className="space-y-6">
                      <h2 className="text-3xl font-bold flex items-center gap-3"><Layers className="text-emerald-400 w-8 h-8" /> Architecture</h2>
                      <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-inner h-[500px]">
                        <ArchGraph data={summary.architectureGraph} />
                      </div>
                      <VisualSection text={summary.architecture} type="architecture" />
                    </div>
                  )}

                  {/* ═══ INSIGHTS TAB ═══ */}
                  {activeTab === 'insights' && (
                    <div className="space-y-6">
                      <h2 className="text-3xl font-bold flex items-center gap-3"><TerminalSquare className="text-emerald-400 w-8 h-8" /> Insights & Features</h2>

                      {/* Resume description */}
                      <div className="glass-card rounded-2xl p-8 border border-slate-700/50 relative overflow-hidden">
                        <div className="absolute inset-0 bg-emerald-600/5 opacity-50" />
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Stars className="w-16 h-16 text-emerald-500" /></div>
                        <h3 className="text-lg font-bold text-emerald-400 mb-4 relative z-10 flex items-center gap-2">Resume Description <TerminalSquare className="w-4 h-4" /></h3>
                        <p className="text-xl font-medium italic leading-relaxed text-slate-200 relative z-10 mb-4">"{summary.resumeDescription}"</p>
                        <button onClick={() => copyText(summary.resumeDescription)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-600 relative z-10 flex items-center gap-2 w-max">
                          <Copy className="w-4 h-4" /> {copied ? 'Copied!' : 'Copy Text'}
                        </button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Key Features */}
                        <div className="glass-card rounded-2xl p-6 border border-slate-700/50">
                          <h3 className="text-lg font-bold text-white mb-4">Key Features</h3>
                          <ul className="space-y-3">
                            {summary.keyFeatures?.map((f, i) => (
                              <li key={i} className="flex gap-3 text-slate-300 text-sm">
                                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" /> <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {/* Improvements */}
                        <div className="glass-card rounded-2xl p-6 border border-slate-700/50">
                          <h3 className="text-lg font-bold text-white mb-4">Suggested Improvements</h3>
                          <ul className="space-y-3">
                            {summary.improvements?.map((f, i) => (
                              <li key={i} className="flex gap-3 text-slate-300 text-sm">
                                <ChevronRight className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" /> <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* ── CHAT SIDEBAR ── */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: chatWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed md:relative right-0 top-14 md:top-0 bottom-0 z-40 md:z-10 border-l border-slate-800 bg-slate-950 md:bg-slate-900/50 flex flex-col shadow-2xl overflow-hidden shrink-0 h-[calc(100vh-3.5rem)] md:h-auto"
            >
              <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center gap-3 shrink-0">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg"><Bot className="w-5 h-5" /></div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-sm">Ask AI Chat</h3>
                  <p className="text-xs text-slate-400">Context: Loaded</p>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="p-1 text-slate-500 hover:text-white rounded transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                {chatMessages.map((msg, idx) => (
                  <motion.div initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} key={idx}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-1"><Bot className="w-4 h-4" /></div>
                    )}
                    <div className={`p-3 rounded-2xl max-w-[85%] ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-sm shadow-md' : 'bg-slate-800/80 text-slate-200 rounded-tl-sm border border-slate-700/50 shadow-inner'}`}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-1"><User className="w-4 h-4 text-slate-300" /></div>
                    )}
                  </motion.div>
                ))}
                {isChatLoading && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-1"><Bot className="w-4 h-4" /></div>
                    <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/50 rounded-tl-sm text-sm text-slate-400 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> Thinking...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form className="p-4 bg-slate-900 border-t border-slate-800 shrink-0" onSubmit={handleChat}>
                <div className="relative">
                  <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} disabled={isChatLoading}
                    placeholder="Ask about this repo..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-50 transition-colors" />
                  <button type="submit" disabled={!chatInput.trim() || isChatLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-emerald-400 hover:text-emerald-300 disabled:text-slate-600 transition-colors">
                    {isChatLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19V5m0 0l-7 7m7-7l7 7" /></svg>}
                  </button>
                </div>
              </form>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}