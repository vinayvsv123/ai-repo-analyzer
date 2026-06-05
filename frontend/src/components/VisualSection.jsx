import React from 'react';
import {
  Target, RefreshCw, Cpu, FolderGit2, Split,
  FileCheck2, Award, ShieldCheck, CheckSquare,
  Sparkles, Layers, ShieldAlert, ListChecks, HelpCircle
} from 'lucide-react';

const ICON_MAP = {
  purpose: Target,
  goals: Target,
  overview: Sparkles,
  flow: RefreshCw,
  workflow: RefreshCw,
  process: RefreshCw,
  pipeline: RefreshCw,
  design: Cpu,
  decision: Cpu,
  decisions: Cpu,
  philosophy: Cpu,
  folder: FolderGit2,
  structure: FolderGit2,
  modularity: FolderGit2,
  modular: FolderGit2,
  separation: Split,
  concern: Split,
  concerns: Split,
  naming: FileCheck2,
  convention: FileCheck2,
  conventions: FileCheck2,
  readability: FileCheck2,
  clean: FileCheck2,
  pattern: Award,
  patterns: Award,
  practice: Award,
  practices: Award,
  best: Award,
  privacy: ShieldCheck,
  security: ShieldAlert,
  auth: ShieldCheck,
  protection: ShieldCheck,
  validation: ListChecks,
  verification: ListChecks
};

function getIconForTitle(title) {
  const t = title.toLowerCase();
  for (const [key, Icon] of Object.entries(ICON_MAP)) {
    if (t.includes(key)) return Icon;
  }
  return Layers;
}

function parseSections(text) {
  if (!text) return [];

  let parsed = [];

  // 1. Check if the text contains standard markdown headers (### or ##)
  if (text.includes('### ') || text.includes('## ')) {
    const rawBlocks = text.split(/(?=#{2,4}\s+)/g);
    for (const block of rawBlocks) {
      const match = block.match(/^#{2,4}\s+([^\n]+)\n([\s\S]*)/);
      if (match) {
        parsed.push({
          title: match[1].replace(/\*/g, '').trim(),
          content: match[2].trim()
        });
      } else {
        if (block.trim()) {
          parsed.push({
            title: 'Overview',
            content: block.trim()
          });
        }
      }
    }
  } else {
    // 2. Check if we can split by bold labels, e.g. "**Modularity:**" or "**Modularity**"
    const boldRegex = /\*\*([^*:]+)(?::\*\*|\*\*)/g;
    const matches = [];
    let match;
    while ((match = boldRegex.exec(text)) !== null) {
      matches.push({
        title: match[1].trim(),
        index: match.index,
        fullLength: match[0].length
      });
    }

    if (matches.length >= 2) {
      for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const next = matches[i + 1];
        const contentStart = current.index + current.fullLength;
        const contentEnd = next ? next.index : text.length;
        let content = text.slice(contentStart, contentEnd).trim();
        // Clean leading/trailing colons, spaces, dashes
        content = content.replace(/^[:\-\s,]+/, '').trim();
        parsed.push({
          title: current.title,
          content: content
        });
      }
      // If there was text before the first bold term, prepend it as "Introduction"
      if (matches[0].index > 0) {
        const intro = text.slice(0, matches[0].index).trim();
        if (intro) {
          parsed.unshift({
            title: 'Overview',
            content: intro
          });
        }
      }
    } else {
      // 3. Split by paragraphs
      const paragraphs = text.split(/\n\s*\n/);
      if (paragraphs.length >= 2) {
        paragraphs.forEach((p, idx) => {
          if (p.trim()) {
            parsed.push({
              title: idx === 0 ? 'Summary' : `Detail Section ${idx}`,
              content: p.trim()
            });
          }
        });
      } else {
        // 4. Split by sentence chunks
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        if (sentences.length > 4) {
          const size = Math.ceil(sentences.length / 3);
          parsed.push({
            title: 'Goal & Scope',
            content: sentences.slice(0, size).join(' ').trim()
          });
          parsed.push({
            title: 'Key Mechanisms',
            content: sentences.slice(size, size * 2).join(' ').trim()
          });
          parsed.push({
            title: 'Overall Analysis',
            content: sentences.slice(size * 2).join(' ').trim()
          });
        } else {
          parsed.push({
            title: 'Details',
            content: text
          });
        }
      }
    }
  }

  return parsed;
}

function formatContent(content) {
  const lines = content.split('\n');
  const listItems = [];
  const paragraphs = [];

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
      listItems.push(trimmed.replace(/^[-*•]\s*/, ''));
    } else if (trimmed) {
      paragraphs.push(trimmed);
    }
  });

  const renderInline = (txt) => {
    // Replace markdown inline bold format **text** with styled tags
    const parts = txt.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-emerald-400 font-bold">{part}</strong> : part);
  };

  return (
    <div className="space-y-3">
      {paragraphs.map((p, idx) => (
        <p key={idx} className="text-slate-300 leading-relaxed text-sm md:text-base">
          {renderInline(p)}
        </p>
      ))}
      {listItems.length > 0 && (
        <ul className="space-y-2.5 mt-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex gap-2.5 text-slate-300 text-sm md:text-base">
              <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function VisualSection({ text, type }) {
  const sections = parseSections(text);

  if (sections.length === 0) {
    return <div className="text-slate-500 italic text-center py-4">No content available</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {sections.map((section, idx) => {
        const Icon = getIconForTitle(section.title);
        return (
          <div
            key={idx}
            className="glass-card rounded-2xl p-6 border border-slate-800 bg-slate-900/40 hover:border-emerald-500/30 hover:bg-slate-900/60 transition-all duration-300 shadow-md group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-slate-800/80 text-emerald-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-300 transition-all duration-300">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-base md:text-lg group-hover:text-emerald-300 transition-colors">
                  {section.title}
                </h4>
              </div>
              <div>{formatContent(section.content)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
