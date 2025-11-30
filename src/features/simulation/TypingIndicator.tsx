import type { Avatar } from '../../types';

interface TypingIndicatorProps {
  avatar: Avatar;
}

export default function TypingIndicator({ avatar }: TypingIndicatorProps) {
  return (
    <div className="relative p-4 rounded-lg border-2 border-gray-200 bg-gray-50 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar Badge */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {avatar.mbtiType}
            </div>
          </div>

          {/* Avatar Info */}
          <div>
            <h4 className="font-semibold text-gray-900">{avatar.name}</h4>
            <p className="text-xs text-gray-500">
              {avatar.mbtiType} • Thinking...
            </p>
          </div>
        </div>

        {/* Typing Badge */}
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-600 border-gray-300">
          <span>💭</span>
          <span>Thinking</span>
        </span>
      </div>

      {/* Typing Animation */}
      <div className="pl-15">
        <div className="flex items-center gap-1">
          <span className="text-gray-500 italic">is thinking</span>
          <div className="flex gap-1.5 ml-2">
            <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Function Indicators */}
      <div className="flex gap-1.5 mt-3 pl-15">
        {avatar.functions.slice(0, 2).map((func, index) => (
          <span 
            key={index}
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-600"
          >
            {func.code}
          </span>
        ))}
      </div>
    </div>
  );
}
