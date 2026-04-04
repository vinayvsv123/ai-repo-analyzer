import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageSquare, User, Bot } from 'lucide-react';
import { chatWithRepository } from '../services/apiService';
import { motion } from 'framer-motion';

export default function ChatBox({ repoUrl }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I have analyzed the repository. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.filter(m => m.role !== 'system');
      const response = await chatWithRepository(repoUrl, userMessage, history);
      setMessages(prev => [...prev, { role: 'assistant', text: response.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I encountered an error: ' + error }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[400px] bg-slate-900/50 border border-slate-700/50 rounded-2xl glass-card overflow-hidden">
      <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center gap-3">
        <MessageSquare className="w-5 h-5 text-emerald-400" />
        <h3 className="font-semibold text-white">Ask Questions About Repo</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={idx} 
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
            )}
            
            <div className={`p-3 rounded-2xl max-w-[80%] ${
              msg.role === 'user' ? 'bg-emerald-600/90 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 rounded-tl-sm'
            }`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
            </div>
            
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-slate-300" />
              </div>
            )}
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm p-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> AI is thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-slate-800/50 border-t border-slate-700 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about this repo..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl px-4 py-2.5 transition-colors flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
