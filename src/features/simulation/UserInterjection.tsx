import { useState } from 'react';

interface UserInterjectionProps {
  onInterject: (message: string) => void;
  isGenerating?: boolean;
  disabled?: boolean;
}

export default function UserInterjection({ 
  onInterject, 
  isGenerating = false,
  disabled = false 
}: UserInterjectionProps) {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isGenerating && !disabled) {
      onInterject(input.trim());
      setInput('');
      setIsExpanded(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isExpanded) {
    return (
      <div className="flex justify-center">
        <button
          onClick={() => setIsExpanded(true)}
          disabled={disabled || isGenerating}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
        >
          <span>💬</span>
          <span>Add Your Perspective</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-orange-600 font-semibold">Your Interjection</span>
        <button
          onClick={() => {
            setIsExpanded(false);
            setInput('');
          }}
          className="ml-auto text-gray-500 hover:text-gray-700 text-sm"
        >
          ✕
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Share your perspective, ask a question, or guide the discussion..."
          className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          rows={3}
          disabled={isGenerating || disabled}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Press Enter to submit, Shift+Enter for new line
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                setInput('');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
              disabled={isGenerating || disabled}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!input.trim() || isGenerating || disabled}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isGenerating ? 'Submitting...' : 'Interject'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

