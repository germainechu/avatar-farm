import type { Avatar, AvatarPosition } from '../../types';

interface FinalPositionsProps {
  positions: AvatarPosition[];
  avatars: Avatar[];
  isGenerating?: boolean;
}

export default function FinalPositions({ 
  positions, 
  avatars, 
  isGenerating = false 
}: FinalPositionsProps) {
  // Don't show anything if no positions and not generating
  if (positions.length === 0 && !isGenerating) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Section Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Final Positions</h3>
        <p className="text-sm text-gray-500 mt-1">
          Concluding stances and reasoning from each participant
        </p>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Generating State */}
        {isGenerating && positions.length === 0 && (
          <div className="flex items-center justify-center gap-3 py-8">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
            <span className="text-gray-600">Generating final positions...</span>
          </div>
        )}

        {/* Positions List */}
        {positions.length > 0 && (
          <div className="space-y-4">
            {positions.map((position) => {
              const avatar = avatars.find(a => a.id === position.avatarId);
              if (!avatar) return null;

              return (
                <div
                  key={position.avatarId}
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
                      <h4 className="font-semibold text-gray-900 text-base mb-1">
                        {avatar.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Round {position.round} • {avatar.mbtiType}
                      </p>
                    </div>
                  </div>

                  {/* Position Content */}
                  <div className="pl-16">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {position.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Generating with existing positions */}
        {isGenerating && positions.length > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 pt-4 border-t border-gray-200">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            <span>Generating remaining positions...</span>
          </div>
        )}
      </div>
    </div>
  );
}
