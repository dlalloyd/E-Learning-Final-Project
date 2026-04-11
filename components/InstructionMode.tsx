// components/InstructionMode.tsx
// Displays learning content when a learner needs instruction on a topic.
// Content is stored as markdown in the DB; this component parses it into
// visually distinct section cards rather than rendering a prose dump.

'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpen,
  Target,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  MapPin,
  TriangleAlert,
  Sparkles,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LearningObject {
  id: string;
  title: string;
  content: string;
  eli5Content: string | null;
  contentType: string;
  bloomLevel: number;
  orderIndex: number;
  knowledgeComponentId: string;
}

interface KnowledgeComponent {
  id: string;
  name: string;
  description: string | null;
  bloomLevel: number;
}

interface PrerequisiteStatus {
  kcId: string;
  name: string;
  mastered: boolean;
}

interface InstructionModeProps {
  kcId: string;
  sessionId?: string;
  onComplete: () => void;
  onRequestPrerequisite?: (kcId: string) => void;
  triggerReason: 'low_mastery' | 'consecutive_failures' | 'user_request';
}

// ---------------------------------------------------------------------------
// Section parsing
// ---------------------------------------------------------------------------

interface ContentSection {
  heading: string;
  body: string;
}

/**
 * Split a markdown string into sections by ## headings.
 * The first chunk before any heading is preserved as an intro block.
 */
function parseSections(markdown: string): ContentSection[] {
  const lines = markdown.split('\n');
  const sections: ContentSection[] = [];
  let current: ContentSection = { heading: '', body: '' };

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current.heading || current.body.trim()) {
        sections.push({ ...current, body: current.body.trim() });
      }
      current = { heading: line.replace(/^## /, '').trim(), body: '' };
    } else {
      current.body += line + '\n';
    }
  }
  if (current.heading || current.body.trim()) {
    sections.push({ ...current, body: current.body.trim() });
  }

  return sections.filter((s) => s.body.trim());
}

// ---------------------------------------------------------------------------
// Section card configuration
// ---------------------------------------------------------------------------

type SectionTheme = {
  icon: React.ReactNode;
  accent: string;       // Tailwind border-left / badge colour
  bg: string;           // card background
  badge: string;        // badge pill style
  badgeText: string;
};

function getSectionTheme(heading: string): SectionTheme {
  const h = heading.toLowerCase();

  if (h.includes('objective') || h.includes('goal')) {
    return {
      icon: <Target size={16} />,
      accent: 'border-l-4 border-indigo-500',
      bg: 'bg-indigo-950/40',
      badge: 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50',
      badgeText: 'Learning Goal',
    };
  }
  if (h.includes('memory') || h.includes('mnemonic') || h.includes('tip') || h.includes('trick')) {
    return {
      icon: <Lightbulb size={16} />,
      accent: 'border-l-4 border-amber-500',
      bg: 'bg-amber-950/30',
      badge: 'bg-amber-900/60 text-amber-300 border border-amber-700/50',
      badgeText: 'Memory Aid',
    };
  }
  if (h.includes('check') || h.includes('quiz') || h.includes('test yourself') || h.includes('question')) {
    return {
      icon: <CheckCircle2 size={16} />,
      accent: 'border-l-4 border-emerald-500',
      bg: 'bg-emerald-950/30',
      badge: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
      badgeText: 'Self-Check',
    };
  }
  if (h.includes('connect') || h.includes('next') || h.includes('link')) {
    return {
      icon: <ArrowRight size={16} />,
      accent: 'border-l-4 border-violet-500',
      bg: 'bg-violet-950/30',
      badge: 'bg-violet-900/60 text-violet-300 border border-violet-700/50',
      badgeText: 'What Comes Next',
    };
  }
  if (h.includes('key fact') || h.includes('fact') || h.includes('overview')) {
    return {
      icon: <Sparkles size={16} />,
      accent: 'border-l-4 border-cyan-500',
      bg: 'bg-cyan-950/30',
      badge: 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/50',
      badgeText: 'Key Facts',
    };
  }
  if (h.includes('map') || h.includes('location') || h.includes('where')) {
    return {
      icon: <MapPin size={16} />,
      accent: 'border-l-4 border-teal-500',
      bg: 'bg-teal-950/30',
      badge: 'bg-teal-900/60 text-teal-300 border border-teal-700/50',
      badgeText: 'Geography',
    };
  }

  // Default: plain content section
  return {
    icon: <BookOpen size={16} />,
    accent: 'border-l-4 border-slate-600',
    bg: 'bg-slate-900/60',
    badge: 'bg-slate-800 text-slate-400 border border-slate-700',
    badgeText: 'Content',
  };
}

// ---------------------------------------------------------------------------
// Markdown custom renderers - replaces the prose dump
// ---------------------------------------------------------------------------

const mdComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-lg font-bold text-white mt-3 mb-2">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-base font-semibold text-slate-100 mt-3 mb-1.5">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wide mt-3 mb-1">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-slate-300 text-[15px] leading-relaxed mb-3">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="text-white font-semibold">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="text-slate-200 italic">{children}</em>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="space-y-1.5 my-2">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="space-y-1.5 my-2 list-none counter-reset-item">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="flex items-start gap-2 text-[15px] text-slate-300 leading-relaxed">
      <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400/70" />
      <span>{children}</span>
    </li>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-indigo-500/50 pl-3 my-2 text-slate-400 italic text-sm">
      {children}
    </blockquote>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded text-sm font-mono">
      {children}
    </code>
  ),
  hr: () => <hr className="border-slate-700/50 my-4" />,
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="text-left text-slate-300 font-semibold px-3 py-2 border-b border-slate-700 bg-slate-800/60">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="text-slate-400 px-3 py-2 border-b border-slate-800">{children}</td>
  ),
};

// ---------------------------------------------------------------------------
// Section card component
// ---------------------------------------------------------------------------

function SectionCard({ section }: { section: ContentSection }) {
  const theme = getSectionTheme(section.heading);

  return (
    <div className={`rounded-xl ${theme.bg} ${theme.accent} p-5 mb-4`}>
      {section.heading && (
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${theme.badge}`}>
            {theme.icon}
            {theme.badgeText}
          </span>
          <span className="text-slate-200 font-semibold text-sm">{section.heading}</span>
        </div>
      )}
      <div>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents as any}>
          {section.body}
        </ReactMarkdown>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KC-to-map lookup - serves SVG reference maps for spatial topics
// ---------------------------------------------------------------------------

const KC_MAP_ASSETS: Record<string, { src: string; alt: string }> = {
  UK_national_parks: { src: '/maps/uk-national-parks.svg', alt: 'Map showing UK national park locations' },
  UK_rivers:         { src: '/maps/uk-rivers.svg',         alt: 'Map showing UK major rivers' },
  UK_mountains:      { src: '/maps/uk-mountains.svg',      alt: 'Map showing UK mountain peaks and ranges' },
};

function ReferenceMap({ kcId }: { kcId: string }) {
  const asset = KC_MAP_ASSETS[kcId];
  if (!asset) return null;

  return (
    <div className="rounded-xl bg-slate-900/60 border-l-4 border-teal-500 p-4 sm:p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-900/60 text-teal-300 border border-teal-700/50">
          <MapPin size={12} />
          Reference Map
        </span>
      </div>
      <img
        src={asset.src}
        alt={asset.alt}
        className="w-full max-w-md mx-auto rounded-lg"
        loading="eager"
      />
      <p className="text-xs text-slate-500 text-center mt-2">
        Study this map before answering questions. Tap to zoom on mobile.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bloom level label
// ---------------------------------------------------------------------------

function BloomBadge({ level }: { level: number }) {
  const map: Record<number, { label: string; cls: string }> = {
    1: { label: 'Remembering', cls: 'bg-blue-900/60 text-blue-300 border border-blue-700/50' },
    2: { label: 'Understanding', cls: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700/50' },
    3: { label: 'Applying', cls: 'bg-rose-900/60 text-rose-300 border border-rose-700/50' },
  };
  const { label, cls } = map[level] || { label: 'Learning', cls: 'bg-slate-800 text-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      <Layers size={11} />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function InstructionMode({
  kcId,
  sessionId,
  onComplete,
  onRequestPrerequisite,
  triggerReason,
}: InstructionModeProps) {
  const [learningObjects, setLearningObjects] = useState<LearningObject[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [knowledgeComponent, setKnowledgeComponent] = useState<KnowledgeComponent | null>(null);
  const [prerequisiteStatus, setPrerequisiteStatus] = useState<PrerequisiteStatus[]>([]);
  const [showEli5, setShowEli5] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selfAssessment, setSelfAssessment] = useState<number | null>(null);

  useEffect(() => {
    setCurrentIndex(0);
    setSelfAssessment(null);
    fetchLearningContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kcId, sessionId]);

  const fetchLearningContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = sessionId
        ? `/api/learning-objects/${kcId}?sessionId=${sessionId}`
        : `/api/learning-objects/${kcId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch learning content');
      const data = await response.json();
      setLearningObjects(data.learningObjects);
      setKnowledgeComponent(data.knowledgeComponent);
      setPrerequisiteStatus(data.prerequisiteStatus || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const currentContent = learningObjects[currentIndex];
  const unmasteredPrereqs = prerequisiteStatus.filter((p) => !p.mastered);

  const handleNext = () => {
    if (currentIndex < learningObjects.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelfAssessment(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelfAssessment(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleComplete = () => {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        eventType: 'instruction_completed',
        payload: {
          kcId,
          triggerReason,
          chunksViewed: currentIndex + 1,
          totalChunks: learningObjects.length,
          usedEli5: showEli5,
          selfAssessment,
        },
      }),
    }).catch(console.error);
    onComplete();
  };

  const getTriggerLabel = () => {
    switch (triggerReason) {
      case 'low_mastery': return 'Building your foundation';
      case 'consecutive_failures': return 'Let\'s revisit this together';
      case 'user_request': return 'Study material';
      default: return 'Learning content';
    }
  };

  // --- Loading ------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Loading content...</p>
      </div>
    );
  }

  // --- Error --------------------------------------------------------------

  if (error) {
    return (
      <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-8 text-center">
        <TriangleAlert size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-red-300 font-medium mb-1">Could not load content</p>
        <p className="text-red-400/70 text-sm mb-4">{error}</p>
        <button
          onClick={fetchLearningContent}
          className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  // --- Empty state --------------------------------------------------------

  if (learningObjects.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-8 text-center">
        <BookOpen size={32} className="text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 mb-1">No study material for this topic yet.</p>
        <p className="text-slate-600 text-sm mb-4">Jump straight to the questions instead.</p>
        <button
          onClick={onComplete}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Go to Questions
        </button>
      </div>
    );
  }

  // --- Parse content sections ----------------------------------------------

  const rawContent = showEli5 && currentContent.eli5Content
    ? currentContent.eli5Content
    : currentContent.content;

  const sections = parseSections(rawContent);

  const progressPct = ((currentIndex + 1) / learningObjects.length) * 100;
  const isLastPage = currentIndex === learningObjects.length - 1;

  // --- Main render --------------------------------------------------------

  return (
    <div className="max-w-3xl mx-auto">

      {/* --- Header card --- */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden mb-4">
        <div className="bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border-b border-slate-700/50 px-6 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">
                {getTriggerLabel()}
              </p>
              <h2 className="text-xl font-bold text-white leading-snug">
                {knowledgeComponent?.name || currentContent.title}
              </h2>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {knowledgeComponent && (
                <BloomBadge level={knowledgeComponent.bloomLevel} />
              )}
              {currentContent.eli5Content && (
                <button
                  onClick={() => setShowEli5(!showEli5)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    showEli5
                      ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50'
                      : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
                  }`}
                >
                  {showEli5 ? 'Full version' : 'Simpler version'}
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
              <span>{currentContent.title}</span>
              <span>{currentIndex + 1} / {learningObjects.length}</span>
            </div>
            <div className="h-1 bg-slate-700/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Topic progress dots */}
        {learningObjects.length > 1 && (
          <div className="px-6 py-3 flex gap-1.5 border-b border-slate-800">
            {learningObjects.map((lo, idx) => (
              <button
                key={lo.id}
                title={lo.title}
                onClick={() => { setCurrentIndex(idx); setSelfAssessment(null); }}
                className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'bg-indigo-500'
                    : idx < currentIndex
                    ? 'bg-indigo-800/70'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* --- Prerequisite warning --- */}
      {unmasteredPrereqs.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-700/40 rounded-xl px-5 py-4 mb-4 flex items-start gap-3">
          <TriangleAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-amber-300 text-sm font-medium">Foundation topics may help</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {unmasteredPrereqs.map((prereq) => (
                <button
                  key={prereq.kcId}
                  onClick={() => onRequestPrerequisite?.(prereq.kcId)}
                  className="text-xs text-amber-400 hover:text-amber-200 underline underline-offset-2 transition-colors"
                >
                  {prereq.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- Reference map (if available for this KC) --- */}
      <ReferenceMap kcId={kcId} />

      {/* --- Section cards --- */}
      <div>
        {sections.map((section, idx) => (
          <SectionCard key={idx} section={section} />
        ))}
      </div>

      {/* --- Self-assessment (last page only) --- */}
      {isLastPage && (
        <div className="bg-slate-900 border border-slate-700/50 rounded-xl px-6 py-5 mb-4">
          <p className="text-slate-300 text-sm font-medium mb-3">
            How well do you understand this topic now?
          </p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setSelfAssessment(level)}
                className={`w-11 h-11 rounded-lg text-sm font-bold transition-all ${
                  selfAssessment === level
                    ? 'bg-indigo-600 text-white scale-105 shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-indigo-500/60 hover:text-slate-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-600 mt-1.5 px-0.5">
            <span>Still unsure</span>
            <span>Got it</span>
          </div>
        </div>
      )}

      {/* --- Navigation footer --- */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl px-5 py-4 flex items-center justify-between gap-3">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            currentIndex === 0
              ? 'text-slate-600 cursor-not-allowed'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <p className="text-xs text-slate-600 font-mono tabular-nums">
          {currentIndex + 1}/{learningObjects.length}
        </p>

        {!isLastPage ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all"
          >
            Next
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleComplete}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-all"
          >
            Start questions
            <ArrowRight size={16} />
          </button>
        )}
      </div>

    </div>
  );
}
