import { useState, useEffect } from 'react';
import type { Avatar, AvatarPosition, Message } from '../../types';
import { formatMarkdown } from '../../lib/markdown';

interface PerspectiveDiagramProps {
  positions: AvatarPosition[];
  messages: Message[];
  avatars: Avatar[];
  scenario: {
    topic: string;
    style: string;
  };
  isGenerating?: boolean;
}

interface PerspectiveAnalysis {
  avatarId: string;
  avatarName: string;
  mbtiType: string;
  keyPoints: string[];
}

interface AnalysisData {
  perspectives: PerspectiveAnalysis[];
  commonGround: string[];
}

export default function PerspectiveDiagram({ 
  positions, 
  messages,
  avatars, 
  scenario,
  isGenerating = false 
}: PerspectiveDiagramProps) {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [lastAnalysisKey, setLastAnalysisKey] = useState<string>('');

  // Analyze perspectives when positions are available OR when messages/positions change
  // This ensures common ground evolves as the conversation progresses
  useEffect(() => {
    // Clear analysis if positions are cleared
    if (positions.length === 0 && analysis) {
      setAnalysis(null);
      setLastAnalysisKey('');
      return;
    }

    // Create a key that represents the current state of messages and positions
    // This ensures we re-analyze when either changes
    const messageIds = messages.map(m => m.id).join(',');
    const positionIds = positions.map(p => `${p.avatarId}-${p.round}`).join(',');
    const currentKey = `${messageIds}|${positionIds}`;
    
    const hasChanged = currentKey !== lastAnalysisKey;
    const shouldAnalyze = positions.length > 0 && !isGenerating && !isAnalyzing && 
      (hasChanged || !analysis);

    if (shouldAnalyze) {
      // Use a small delay to debounce rapid updates
      const timeoutId = setTimeout(() => {
        analyzePerspectives();
        setLastAnalysisKey(currentKey);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, messages, isGenerating]);

  const analyzePerspectives = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/analyze-perspectives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenario,
          messages: messages.map(msg => ({
            id: msg.id,
            avatarId: msg.avatarId,
            content: msg.content,
            tag: msg.tag,
            round: msg.round,
          })),
          positions,
          avatars: avatars.map(a => ({
            id: a.id,
            name: a.name,
            mbtiType: a.mbtiType,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data);
    } catch (error) {
      console.error('Error analyzing perspectives:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Failed to analyze perspectives');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Don't show anything if no positions and not generating/analyzing
  if (positions.length === 0 && !isGenerating && !isAnalyzing) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Section Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Perspective Analysis</h3>
        <p className="text-sm text-gray-500 mt-1">
          Individual perspectives and common ground from the conversation
        </p>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Generating/Analyzing State */}
        {(isGenerating || isAnalyzing) && !analysis && (
          <div className="flex items-center justify-center gap-3 py-8">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
            <span className="text-gray-600">
              {isGenerating ? 'Generating positions...' : 'Analyzing perspectives...'}
            </span>
          </div>
        )}

        {/* Error State */}
        {analysisError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 text-sm">{analysisError}</p>
            <p className="text-yellow-700 text-xs mt-2">
              Showing positions without analysis.
            </p>
          </div>
        )}

        {/* Analysis Display */}
        {analysis && (
          <div className="space-y-6">
            {/* Common Ground Section - The "Venn Diagram Middle" */}
            {analysis.commonGround.length > 0 && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-5 border-2 border-green-300 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-xs">
                    ∩
                  </div>
                  <h4 className="font-semibold text-gray-900">Common Ground</h4>
                  <span className="text-xs text-gray-500 ml-auto">Shared Perspectives</span>
                </div>
                <ul className="space-y-2 pl-10">
                  {analysis.commonGround.map((point, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span>{formatMarkdown(point)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Individual Perspectives */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 text-base mb-3">Individual Perspectives</h4>
              {analysis.perspectives.map((perspective) => {
                const avatar = avatars.find(a => a.id === perspective.avatarId);
                if (!avatar) return null;

                return (
                  <div
                    key={perspective.avatarId}
                    className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-5 border border-purple-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Avatar Header */}
                    <div className="flex items-start gap-4 mb-3">
                      {/* Avatar Icon */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                        {avatar.mbtiType}
                      </div>
                      
                      {/* Avatar Info */}
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-gray-900 text-base mb-1">
                          {perspective.avatarName}
                        </h5>
                        <p className="text-xs text-gray-500">
                          {avatar.mbtiType} • Unique Perspective
                        </p>
                      </div>
                    </div>

                    {/* Key Points */}
                    <div className="pl-16">
                      <ul className="space-y-2">
                        {perspective.keyPoints.map((point, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-purple-600 mt-1">•</span>
                            <span>{formatMarkdown(point)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Fallback: Show positions if analysis failed */}
        {!analysis && !isAnalyzing && !isGenerating && positions.length > 0 && (
          <div className="space-y-4">
            {positions.map((position) => {
              const avatar = avatars.find(a => a.id === position.avatarId);
              if (!avatar) return null;

              return (
                <div
                  key={position.avatarId}
                  className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-5 border border-purple-200 shadow-sm"
                >
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                      {avatar.mbtiType}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-base mb-1">
                        {avatar.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {avatar.mbtiType}
                      </p>
                    </div>
                  </div>
                  <div className="pl-16">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {formatMarkdown(position.content)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Generating with existing analysis */}
        {isGenerating && analysis && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 pt-4 border-t border-gray-200">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            <span>Updating analysis...</span>
          </div>
        )}
      </div>
    </div>
  );
}

