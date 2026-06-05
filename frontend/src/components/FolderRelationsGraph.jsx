import React, { useMemo, useState } from 'react';
import { ReactFlow, Controls, Background, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Folder, ArrowRight, FileCode2, Info, Network, HelpCircle } from 'lucide-react';

const EXT_COLORS = {
  js: 'text-yellow-400', jsx: 'text-cyan-400', ts: 'text-blue-400', tsx: 'text-blue-400',
  py: 'text-green-400', java: 'text-red-400', go: 'text-sky-400', rs: 'text-orange-400',
  css: 'text-purple-400', html: 'text-rose-400', json: 'text-amber-400', md: 'text-slate-400',
};

function getFileColor(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  return EXT_COLORS[ext] || 'text-slate-400';
}

function computeFolderRelations(filesDatabase) {
  const allFiles = Object.keys(filesDatabase);
  const folderImports = {}; 
  const folderFileCounts = {};

  const getDir = (filePath) => {
    const parts = filePath.split('/');
    parts.pop();
    return parts.join('/') || 'root';
  };

  const resolveRelative = (fromDir, relPath) => {
    if (fromDir === 'root' || fromDir === '') {
      return relPath.replace(/^\.\//, '');
    }
    const fromParts = fromDir.split('/');
    const relParts = relPath.split('/');
    for (const part of relParts) {
      if (part === '.' || part === '') {
        continue;
      } else if (part === '..') {
        fromParts.pop();
      } else {
        fromParts.push(part);
      }
    }
    return fromParts.join('/');
  };

  for (const filePath of allFiles) {
    const dir = getDir(filePath);
    folderFileCounts[dir] = (folderFileCounts[dir] || 0) + 1;
  }

  const importRegex = /(?:import|export)\s+(?:[\w*\s{},]*\s+from\s+)?['"](\.\.?\/[^'"]+)['"]/g;
  const requireRegex = /require\s*\(\s*['"](\.\.?\/[^'"]+)['"]\s*\)/g;

  for (const [filePath, content] of Object.entries(filesDatabase)) {
    const fromDir = getDir(filePath);
    const imports = new Set();

    let match;
    importRegex.lastIndex = 0;
    while ((match = importRegex.exec(content)) !== null) {
      imports.add(match[1]);
    }

    requireRegex.lastIndex = 0;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.add(match[1]);
    }

    for (const relImport of imports) {
      const resolved = resolveRelative(fromDir, relImport);
      const targetFile = allFiles.find(f => {
        if (f === resolved) return true;
        const ext = f.split('.').pop();
        if (f.replace(new RegExp(`\\.${ext}$`), '') === resolved) return true;
        if (f === `${resolved}/index.js` || f === `${resolved}/index.jsx` || f === `${resolved}/index.ts` || f === `${resolved}/index.tsx`) return true;
        return false;
      });

      if (targetFile) {
        const toDir = getDir(targetFile);
        if (fromDir !== toDir) {
          if (!folderImports[fromDir]) folderImports[fromDir] = new Set();
          folderImports[fromDir].add(toDir);
        }
      }
    }
  }

  // Convert Set to Array
  const folderRelations = {};
  for (const [key, valSet] of Object.entries(folderImports)) {
    folderRelations[key] = Array.from(valSet);
  }

  return { folderRelations, folderFileCounts };
}

export default function FolderRelationsGraph({ filesDatabase }) {
  const [selectedFolder, setSelectedFolder] = useState(null);

  const { folderRelations, folderFileCounts } = useMemo(() => {
    return computeFolderRelations(filesDatabase || {});
  }, [filesDatabase]);

  // All folders that exist in the system (either has files or is imported)
  const allFolders = useMemo(() => {
    const folders = new Set(Object.keys(folderFileCounts));
    Object.keys(folderRelations).forEach(from => {
      folders.add(from);
      folderRelations[from].forEach(to => folders.add(to));
    });
    return Array.from(folders).sort((a, b) => a.localeCompare(b));
  }, [folderRelations, folderFileCounts]);

  // Compute dependents (incoming links)
  const folderDependents = useMemo(() => {
    const dependents = {};
    allFolders.forEach(folder => {
      dependents[folder] = [];
    });
    Object.entries(folderRelations).forEach(([from, toList]) => {
      toList.forEach(to => {
        if (dependents[to] && !dependents[to].includes(from)) {
          dependents[to].push(from);
        }
      });
    });
    return dependents;
  }, [allFolders, folderRelations]);

  // Selected folder's details
  const folderDetails = useMemo(() => {
    if (!selectedFolder) return null;
    const files = Object.keys(filesDatabase).filter(f => {
      const parts = f.split('/');
      parts.pop();
      const dir = parts.join('/') || 'root';
      return dir === selectedFolder;
    }).map(f => ({
      path: f,
      name: f.split('/').pop(),
      size: filesDatabase[f]?.split('\n').length || 0
    }));

    return {
      name: selectedFolder,
      fileCount: folderFileCounts[selectedFolder] || 0,
      files,
      dependencies: folderRelations[selectedFolder] || [],
      dependents: folderDependents[selectedFolder] || []
    };
  }, [selectedFolder, filesDatabase, folderRelations, folderDependents, folderFileCounts]);

  // Build nodes and edges for React Flow
  const { nodes, edges } = useMemo(() => {
    const folderDepths = {};
    allFolders.forEach(f => {
      folderDepths[f] = f === 'root' ? 0 : f.split('/').length;
    });

    // Group by depth
    const depthGroups = {};
    allFolders.forEach(f => {
      const d = folderDepths[f];
      if (!depthGroups[d]) depthGroups[d] = [];
      depthGroups[d].push(f);
    });

    // Create React Flow Nodes
    const nodesList = [];
    Object.entries(depthGroups).forEach(([depthStr, list]) => {
      const depth = parseInt(depthStr, 10);
      const y = depth * 160 + 50;
      const totalInLevel = list.length;
      const horizontalSpacing = 220;
      
      list.forEach((folder, idx) => {
        // Center the row around x = 400
        const startX = 400 - ((totalInLevel - 1) * horizontalSpacing) / 2;
        const x = startX + idx * horizontalSpacing;

        // Custom theme color based on folder name
        let ringColor = 'border-slate-700/60';
        let bgStyle = 'bg-slate-900/90';
        let textColor = 'text-slate-300';
        let hoverBorder = 'group-hover:border-slate-500';

        if (folder.startsWith('frontend') || folder.includes('client') || folder.includes('public')) {
          ringColor = 'border-emerald-500/30';
          bgStyle = 'bg-emerald-950/20';
          textColor = 'text-emerald-100';
          hoverBorder = 'group-hover:border-emerald-400';
        } else if (folder.startsWith('backend') || folder.includes('server') || folder.includes('api')) {
          ringColor = 'border-blue-500/30';
          bgStyle = 'bg-blue-950/20';
          textColor = 'text-blue-100';
          hoverBorder = 'group-hover:border-blue-400';
        } else if (folder.includes('db') || folder.includes('model') || folder.includes('schema') || folder.includes('controller')) {
          ringColor = 'border-amber-500/30';
          bgStyle = 'bg-amber-950/20';
          textColor = 'text-amber-100';
          hoverBorder = 'group-hover:border-amber-400';
        }

        // Highlight state
        const isSelected = selectedFolder === folder;
        const isDependency = selectedFolder && folderRelations[selectedFolder]?.includes(folder);
        const isDependent = selectedFolder && folderDependents[selectedFolder]?.includes(folder);
        const hasActiveHighlight = selectedFolder ? (isSelected || isDependency || isDependent) : true;

        if (selectedFolder) {
          if (isSelected) {
            ringColor = 'border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
            bgStyle = 'bg-emerald-900/30';
            textColor = 'text-emerald-300 font-bold';
          } else if (isDependency) {
            ringColor = 'border-amber-400';
            bgStyle = 'bg-amber-900/10';
            textColor = 'text-amber-200';
          } else if (isDependent) {
            ringColor = 'border-blue-400';
            bgStyle = 'bg-blue-900/10';
            textColor = 'text-blue-200';
          } else {
            // Dim
            ringColor = 'border-slate-800/40';
            bgStyle = 'bg-slate-950/20';
            textColor = 'text-slate-600';
          }
        }

        nodesList.push({
          id: folder,
          position: { x, y },
          data: {
            label: (
              <div className="flex flex-col items-start gap-1 p-1 text-left w-full h-full select-none">
                <div className="flex items-center gap-1.5 w-full">
                  <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-400' : isDependency ? 'text-amber-400' : isDependent ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span className={`text-xs md:text-sm font-semibold truncate flex-1 ${textColor}`}>{folder.split('/').pop() || 'root'}</span>
                </div>
                <div className="flex items-center justify-between w-full mt-1.5 border-t border-slate-800/60 pt-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">{folder.split('/').slice(0, -1).join('/') || 'root'}</span>
                  <span className="text-[9px] bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-400 font-bold">{folderFileCounts[folder] || 0} files</span>
                </div>
              </div>
            )
          },
          style: {
            background: 'transparent',
            border: 'none',
            padding: 0,
            width: 200,
            opacity: hasActiveHighlight ? 1 : 0.35,
            transition: 'all 0.3s ease'
          },
          // Wrap in a custom class styled with tailwind
          className: `group cursor-pointer border rounded-xl p-2.5 transition-all duration-300 ${bgStyle} ${ringColor} ${hoverBorder} shadow-lg backdrop-blur-md`
        });
      });
    });

    // Create React Flow Edges
    const edgesList = [];
    Object.entries(folderRelations).forEach(([from, toList]) => {
      toList.forEach((to, idx) => {
        const isSelectedFrom = selectedFolder === from;
        const isSelectedTo = selectedFolder === to;
        
        let strokeColor = '#334155'; // default slate-700
        let strokeWidth = 1.5;
        let animated = false;
        let opacity = 0.4;

        if (selectedFolder) {
          if (isSelectedFrom && isSelectedTo) {
            strokeColor = '#10b981'; // active connection
            strokeWidth = 2.5;
            animated = true;
            opacity = 1;
          } else if (isSelectedFrom) {
            strokeColor = '#f59e0b'; // dependency path (outgoing)
            strokeWidth = 2.5;
            animated = true;
            opacity = 1;
          } else if (isSelectedTo) {
            strokeColor = '#3b82f6'; // dependent path (incoming)
            strokeWidth = 2.5;
            animated = true;
            opacity = 1;
          } else {
            // Unrelated edge when selection exists
            opacity = 0.08;
          }
        }

        edgesList.push({
          id: `fe-${from}-${to}-${idx}`,
          source: from,
          target: to,
          animated,
          style: { stroke: strokeColor, strokeWidth, opacity, transition: 'all 0.3s ease' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
            style: { opacity }
          }
        });
      });
    });

    return { nodes: nodesList, edges: edgesList };
  }, [allFolders, selectedFolder, folderRelations, folderDependents, folderFileCounts]);

  const handleNodeClick = (event, node) => {
    setSelectedFolder(node.id === selectedFolder ? null : node.id);
  };

  const handlePaneClick = () => {
    setSelectedFolder(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full w-full select-none">
      {/* ── GRAPH VIEW ── */}
      <div className="flex-1 min-h-[400px] lg:min-h-0 bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden flex flex-col shadow-inner">
        <div className="absolute top-4 left-4 z-10 bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 shadow-md pointer-events-none max-w-[280px] sm:max-w-none">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Folder Imports Graph
          </h4>
          <p className="text-[10px] text-slate-400 mt-1">
            Visual dependency flow. Top-down based on directory depth. Click a folder to inspect connections.
          </p>
        </div>

        {selectedFolder && (
          <button
            onClick={() => setSelectedFolder(null)}
            className="absolute top-4 right-4 z-10 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 text-xs rounded-lg border border-slate-700 transition-all cursor-pointer"
          >
            Clear Selection
          </button>
        )}

        <div className="flex-1 h-full w-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            fitView
            attributionPosition="bottom-right"
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#1e293b" gap={24} size={1} />
            <Controls showInteractive={false} className="bg-slate-900 text-white fill-white border-slate-800" />
          </ReactFlow>
        </div>
      </div>

      {/* ── DETAIL SIDE PANEL ── */}
      <div className="w-full lg:w-[350px] shrink-0 border border-slate-800 bg-slate-900/30 rounded-2xl p-5 flex flex-col max-h-[500px] lg:max-h-none overflow-y-auto">
        {!folderDetails ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center mb-3 text-slate-500 shadow-sm">
              <Info className="w-5 h-5" />
            </div>
            <h5 className="font-bold text-white text-sm">Select a Folder Node</h5>
            <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
              Click any folder node in the directory map to analyze its files, imports, and connections.
            </p>
          </div>
        ) : (
          <div className="space-y-5 flex-1 flex flex-col justify-start">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Folder className="w-5 h-5 text-emerald-400 shrink-0" />
                <h5 className="font-bold text-white text-base truncate flex-1">{folderDetails.name.split('/').pop() || 'root'}</h5>
              </div>
              <p className="text-[10px] font-mono text-slate-500 break-all select-all bg-slate-950 px-2 py-1.5 rounded border border-slate-900">
                {folderDetails.name}
              </p>
            </div>

            {/* Folder statistics */}
            <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-850">
              <div>
                <div className="text-lg font-bold text-emerald-400">{folderDetails.fileCount}</div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Files</div>
              </div>
              <div>
                <div className="text-lg font-bold text-teal-400">
                  {folderDetails.files.reduce((sum, f) => sum + f.size, 0).toLocaleString()}
                </div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Lines</div>
              </div>
            </div>

            {/* Folder files list */}
            <div>
              <h6 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileCode2 className="w-3.5 h-3.5 text-slate-500" /> Files in this folder ({folderDetails.files.length})
              </h6>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {folderDetails.files.map(file => (
                  <div key={file.path} className="flex items-center justify-between text-xs bg-slate-900/40 hover:bg-slate-800/40 px-2.5 py-1.5 rounded-lg border border-slate-850/40">
                    <span className="text-slate-300 truncate font-mono mr-2">{file.name}</span>
                    <span className="text-[9px] text-slate-500 bg-slate-950 px-1 rounded shrink-0">{file.size}L</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Outgoing Dependencies */}
            <div>
              <h6 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 rotate-45" /> Imports from ({folderDetails.dependencies.length})
              </h6>
              {folderDetails.dependencies.length === 0 ? (
                <div className="text-[11px] text-slate-500 italic px-2">No relative imports from other folders</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {folderDetails.dependencies.map(dep => (
                    <button
                      key={dep}
                      onClick={() => setSelectedFolder(dep)}
                      className="text-[11px] font-medium bg-amber-500/5 hover:bg-amber-500/15 text-amber-300 border border-amber-500/15 hover:border-amber-500/30 px-2 py-1 rounded-md transition-colors cursor-pointer truncate max-w-full"
                    >
                      {dep.split('/').pop() || 'root'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Incoming Dependents */}
            <div>
              <h6 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 -rotate-135" /> Imported by ({folderDetails.dependents.length})
              </h6>
              {folderDetails.dependents.length === 0 ? (
                <div className="text-[11px] text-slate-500 italic px-2">No other folders import this folder</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {folderDetails.dependents.map(dep => (
                    <button
                      key={dep}
                      onClick={() => setSelectedFolder(dep)}
                      className="text-[11px] font-medium bg-blue-500/5 hover:bg-blue-500/15 text-blue-300 border border-blue-500/15 hover:border-blue-500/30 px-2 py-1 rounded-md transition-colors cursor-pointer truncate max-w-full"
                    >
                      {dep.split('/').pop() || 'root'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
