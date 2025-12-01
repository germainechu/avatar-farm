import { useEffect, useRef } from 'react';
import type { Message, Avatar, MessageTag } from '../../types';
import TypingIndicator from './TypingIndicator';
import { formatMarkdown } from '../../lib/markdown';

interface ConversationTimelineProps {
  messages: Message[];
  avatars: Avatar[];
  currentMessageIndex?: number;
  typingAvatarId?: string | null;
}

export default function ConversationTimeline({ 
  messages, 
  avatars,
  currentMessageIndex,
  typingAvatarId
}: ConversationTimelineProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or typing starts (live chat behavior)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages.length, typingAvatarId]);

  if (messages.length === 0 && !typingAvatarId) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No messages yet. Generating conversation...</p>
      </div>
    );
  }

  const typingAvatar = typingAvatarId ? avatars.find(a => a.id === typingAvatarId) : null;

  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const avatar = avatars.find(a => a.id === message.avatarId);
        const isCurrent = currentMessageIndex !== undefined && index === currentMessageIndex;
        const isUserMessage = message.avatarId === 'user';
        
        return (
          <MessageBubble
            key={message.id}
            message={message}
            avatar={avatar}
            isCurrent={isCurrent}
            isUserMessage={isUserMessage}
          />
        );
      })}
      
      {/* Typing Indicator */}
      {typingAvatar && (
        <TypingIndicator avatar={typingAvatar} />
      )}
      
      {/* Scroll anchor for auto-scrolling */}
      <div ref={messagesEndRef} />
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  avatar?: Avatar;
  isCurrent: boolean;
  isUserMessage?: boolean;
}

function MessageBubble({ message, avatar, isCurrent, isUserMessage = false }: MessageBubbleProps) {
  // User messages have special styling
  if (isUserMessage) {
    return (
      <div 
        className={`
          relative p-4 rounded-lg border-2 transition-all
          ${isCurrent 
            ? 'border-orange-500 bg-orange-50 shadow-lg scale-[1.02]' 
            : 'border-orange-300 bg-orange-50'
          }
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* User Badge */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                👤
              </div>
            </div>

            {/* User Info */}
            <div>
              <h4 className="font-semibold text-gray-900">You</h4>
              <p className="text-xs text-gray-500">
                Round {message.round} • Interjection
              </p>
            </div>
          </div>

          {/* User Message Tag */}
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-orange-100 text-orange-800 border-orange-300">
            <span>💬</span>
            <span>Your Input</span>
          </span>
        </div>

        {/* Message Content */}
        <div className="pl-15">
          <p className="text-gray-700 leading-relaxed font-medium">{formatMarkdown(message.content)}</p>
        </div>
      </div>
    );
  }

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
        <p className="text-gray-700 leading-relaxed">{formatMarkdown(message.content)}</p>
      </div>

      {/* Function Indicators - Show all 4 functions */}
      <div className="flex gap-1.5 mt-3 pl-15">
        {avatar.functions.map((func, index) => {
          const isActive = message.activeFunctions?.includes(func.code) || false;
          const roleColors: Record<string, string> = {
            dominant: isActive ? 'bg-purple-500 text-white ring-2 ring-purple-300' : 'bg-purple-100 text-purple-800',
            auxiliary: isActive ? 'bg-indigo-500 text-white ring-2 ring-indigo-300' : 'bg-indigo-100 text-indigo-800',
            tertiary: isActive ? 'bg-blue-500 text-white ring-2 ring-blue-300' : 'bg-blue-100 text-blue-800',
            inferior: isActive ? 'bg-gray-500 text-white ring-2 ring-gray-300' : 'bg-gray-100 text-gray-700',
          };
          
          return (
            <span 
              key={index}
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium transition-all ${
                roleColors[func.role] || 'bg-gray-100 text-gray-700'
              } ${isActive ? 'font-bold shadow-sm' : ''}`}
              title={`${func.code} (${func.role})${isActive ? ' - Active' : ''}`}
            >
              {func.code}
            </span>
          );
        })}
      </div>
    </div>
  );
}
