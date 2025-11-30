import type { Avatar } from '../../types';

interface AvatarCardProps {
  avatar: Avatar;
  onClick?: () => void;
  isSelected?: boolean;
}

export default function AvatarCard({ avatar, onClick, isSelected = false }: AvatarCardProps) {
  const dominant = avatar.functions.find(f => f.role === 'dominant');
  const auxiliary = avatar.functions.find(f => f.role === 'auxiliary');

  return (
    <div
      onClick={onClick}
      className={`
        relative p-4 rounded-lg border-2 transition-all cursor-pointer
        hover:shadow-lg hover:-translate-y-1
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 bg-white hover:border-gray-300'
        }
      `}
    >
      {/* MBTI Type Badge */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl font-bold text-gray-900">
          {avatar.mbtiType}
        </span>
        {isSelected && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
            Selected
          </span>
        )}
      </div>

      {/* Avatar Name */}
      <h3 className="text-sm font-semibold text-gray-700 mb-2">
        {avatar.name}
      </h3>

      {/* Cognitive Functions */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {dominant && (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
            {dominant.code}
          </span>
        )}
        {auxiliary && (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
            {auxiliary.code}
          </span>
        )}
      </div>

      {/* Behavior Indicators */}
      <div className="space-y-1">
        <BehaviorBar 
          label="Abstract" 
          value={avatar.behavior.abstractness} 
          color="blue"
        />
        <BehaviorBar 
          label="Emotional" 
          value={avatar.behavior.emotionalFocus} 
          color="pink"
        />
        <BehaviorBar 
          label="Structured" 
          value={avatar.behavior.structure} 
          color="green"
        />
      </div>
    </div>
  );
}

interface BehaviorBarProps {
  label: string;
  value: number;
  color: 'blue' | 'pink' | 'green';
}

function BehaviorBar({ label, value, color }: BehaviorBarProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    pink: 'bg-pink-500',
    green: 'bg-green-500'
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-16">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClasses[color]} transition-all`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}
