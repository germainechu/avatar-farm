import { useState, useRef } from 'react';
import type { MessageImage } from '../../types';

interface UserInterjectionProps {
  onInterject: (message: string, image?: MessageImage) => void;
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
  const [selectedImage, setSelectedImage] = useState<MessageImage | null>(null);
  const [isModerating, setIsModerating] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setModerationError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setModerationError('Image size must be less than 10MB');
      return;
    }

    setIsModerating(true);
    setModerationError(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        
        if (!base64Data) {
          setModerationError('Failed to read image');
          setIsModerating(false);
          return;
        }

        // Moderate the image
        try {
          const response = await fetch('/api/moderate-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: base64Data }),
          });

          if (!response.ok) {
            throw new Error('Moderation service error');
          }

          const moderationResult = await response.json();

          if (!moderationResult.safe) {
            setModerationError('Image contains inappropriate content and cannot be uploaded');
            setIsModerating(false);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            return;
          }

          // Image is safe, store it
          const messageImage: MessageImage = {
            url: base64Data,
            moderationStatus: 'approved',
            moderationResult: {
              safe: true,
              categories: moderationResult.categories,
            },
          };

          setSelectedImage(messageImage);
          setModerationError(null);
        } catch (error) {
          console.error('Error moderating image:', error);
          // On error, allow the image but mark as pending
          const messageImage: MessageImage = {
            url: base64Data,
            moderationStatus: 'pending',
          };
          setSelectedImage(messageImage);
          setModerationError('Could not verify image content, but it will be included');
        } finally {
          setIsModerating(false);
        }
      };

      reader.onerror = () => {
        setModerationError('Failed to read image file');
        setIsModerating(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      setModerationError('Failed to process image');
      setIsModerating(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setModerationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || selectedImage) && !isGenerating && !disabled) {
      onInterject(input.trim(), selectedImage || undefined);
      setInput('');
      setSelectedImage(null);
      setIsExpanded(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
        
        {/* Image Upload Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              disabled={isGenerating || disabled || isModerating}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className={`px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                isGenerating || disabled || isModerating
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              }`}
            >
              {isModerating ? '🔄 Checking...' : '📷 Add Image'}
            </label>
            {selectedImage && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="px-3 py-2 text-sm text-red-600 hover:text-red-800"
                disabled={isGenerating || disabled}
              >
                Remove Image
              </button>
            )}
          </div>

          {/* Image Preview */}
          {selectedImage && (
            <div className="relative border border-orange-300 rounded-lg p-2 bg-white">
              <img
                src={selectedImage.url}
                alt="Preview"
                className="max-h-48 max-w-full rounded object-contain"
              />
              {selectedImage.moderationStatus === 'approved' && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  ✓ Approved
                </div>
              )}
            </div>
          )}

          {/* Moderation Error */}
          {moderationError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {moderationError}
            </div>
          )}
        </div>

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
                setSelectedImage(null);
                setModerationError(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
              disabled={isGenerating || disabled}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={(!input.trim() && !selectedImage) || isGenerating || disabled || isModerating}
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

