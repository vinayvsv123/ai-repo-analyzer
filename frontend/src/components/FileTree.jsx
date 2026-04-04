import { useState } from 'react';
import { ChevronRight, Folder, FolderOpen, FileText, FileCode2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EXT_COLORS = {
  js: 'text-yellow-400', jsx: 'text-cyan-400', ts: 'text-blue-400', tsx: 'text-blue-400',
  py: 'text-green-400', java: 'text-red-400', go: 'text-sky-400', rs: 'text-orange-400',
  css: 'text-purple-400', html: 'text-rose-400', json: 'text-amber-400', md: 'text-slate-400',
  cpp: 'text-pink-400',
};

function getFileColor(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  return EXT_COLORS[ext] || 'text-slate-400';
}

function TreeNode({ node, depth = 0, onFileClick, selectedFile }) {
  const [isOpen, setIsOpen] = useState(depth < 1);

  if (node.isDir) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-1.5 py-1 px-2 text-sm rounded-lg hover:bg-slate-800/60 transition-colors group"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <ChevronRight
            className={`w-3 h-3 text-slate-500 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`}
          />
          {isOpen ? (
            <FolderOpen className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-emerald-500/70 shrink-0" />
          )}
          <span className="text-slate-300 truncate font-medium group-hover:text-white transition-colors">
            {node.name}
          </span>
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden relative"
            >
              {/* Tree guide line */}
              <div 
                className="absolute top-0 bottom-0 w-px bg-slate-700/50"
                style={{ left: `${depth * 16 + 15}px` }}
              />
              <div className="relative z-10">
                {node.children
                  ?.sort((a, b) => (b.isDir ? 1 : 0) - (a.isDir ? 1 : 0) || a.name.localeCompare(b.name))
                  .map((child) => (
                    <TreeNode
                      key={child.path}
                      node={child}
                      depth={depth + 1}
                      onFileClick={onFileClick}
                      selectedFile={selectedFile}
                    />
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const isSelected = selectedFile?.path === node.path;
  const colorClass = getFileColor(node.name);

  return (
    <button
      onClick={() => onFileClick(node)}
      className={`w-full flex items-center gap-1.5 py-1 px-2 text-sm rounded-lg transition-all group ${
        isSelected
          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
          : 'hover:bg-slate-800/60 text-slate-400 border border-transparent'
      }`}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
    >
      <span className="w-3 h-3 shrink-0" />
      <FileCode2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-400' : colorClass}`} />
      <span className={`truncate ${isSelected ? 'text-emerald-200 font-medium' : 'group-hover:text-slate-200'}`}>
        {node.name}
      </span>
      <span className="ml-auto text-[10px] text-slate-600 shrink-0">{node.size}L</span>
    </button>
  );
}

export default function FileTree({ tree, onFileClick, selectedFile }) {
  if (!tree || tree.length === 0) {
    return (
      <div className="p-4 text-sm text-slate-500 italic text-center">
        No files detected
      </div>
    );
  }

  const sorted = [...tree].sort((a, b) => (b.isDir ? 1 : 0) - (a.isDir ? 1 : 0) || a.name.localeCompare(b.name));

  return (
    <div className="space-y-0.5 py-1">
      {sorted.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          depth={0}
          onFileClick={onFileClick}
          selectedFile={selectedFile}
        />
      ))}
    </div>
  );
}
