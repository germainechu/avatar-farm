import type { Message, Avatar, MessageTag } from '../../types';

interface ConversationTimelineProps {
  messages: Message[];
  avatars: Avatar[];
  currentMessageIndex?: number;
}

export default function ConversationTimeline({ 
  messages, 
  avatars,
  currentMessageIndex 
}: ConversationTimelineProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No messages yet. Run a simulation to see the conversation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const avatar = avatars.find(a => a.id === message.avatarId);
        const isCurrent = currentMessageIndex !== undefined && index === currentMessageIndex;
        
        return (
          <MessageBubble
            key={message.id}
            message={message}
            avatar={avatar}
            isCurrent={isCurrent}
          />
        );
      })}
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  avatar?: Avatar;
  isCurrent: boolean;
}

function MessageBubble({ message, avatar, isCurrent }: MessageBubbleProps) {
  if (!avatar) return null;

  const tagColors: Record<MessageTag, string> = {
    support: 'bg-green-100 text-green-800 border-green-300',
    critique: 'bg-red-100 text-red-800 border-red-300',
    idea: 'bg-purple-100 text-purple-800 border-purple-300',
    clarify: 'bg-blue-100 text-blue-800 border-blue-300'
  };

  const tagIcons: Record<MessageTag, string> = {
    support: '👍',
    critique: '🤔',
    idea: '💡',
    clarify: '🔍'
  };

  return (
    <div 
      className={`
        relative p-4 rounded-lg border-2 transition-all
        ${isCurrent 
          ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]' 
          : 'border-gray-200 bg-white'
        }
      `}
    >
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
              Round {message.round} • {avatar.mbtiType}
            </p>
          </div>
        </div>

        {/* Message Tag */}
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${tagColors[message.tag]}`}>
          <span>{tagIcons[message.tag]}</span>
          <span className="capitalize">{message.tag}</span>
        </span>
      </div>

      {/* Message Content */}
      <div className="pl-15">
        <p className="text-gray-700 leading-relaxed">{message.content}</p>
      </div>

      {/* Function Indicators */}
      <div className="flex gap-1.5 mt-3 pl-15">
        {avatar.functions.slice(0, 2).map((func, index) => (
          <span 
            key={index}
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
          >
            {func.code}
          </span>
        ))}
      </div>
    </div>
  );
}
