import { useState, useRef } from 'react';
import type { Avatar, InteractionStyle, Scenario, MessageImage } from '../../types';

interface ScenarioBuilderProps {
  avatars: Avatar[];
  onScenarioCreate: (scenario: Scenario) => void;
}

export default function ScenarioBuilder({ avatars, onScenarioCreate }: ScenarioBuilderProps) {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState<InteractionStyle>('brainstorm');
  const [selectedAvatarIds, setSelectedAvatarIds] = useState<string[]>([]);
  const [rounds, setRounds] = useState(10);
  const [casualMode, setCasualMode] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<MessageImage | null>(null);
  const [isModerating, setIsModerating] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (!topic.trim()) {
      newErrors.push('Topic is required');
    }

    if (selectedAvatarIds.length < 2) {
      newErrors.push('Select at least 2 avatars');
    }

    if (selectedAvatarIds.length > 8) {
      newErrors.push('Select at most 8 avatars');
    }

    if (rounds < 1 || rounds > 10) {
      newErrors.push('Rounds must be between 1 and 10');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const scenario: Scenario = {
      id: `scenario-${Date.now()}`,
      topic: topic.trim(),
      style,
      avatarIds: selectedAvatarIds,
      rounds,
      createdAt: new Date().toISOString(),
      useLLM: true, // Always use LLM mode
      image: selectedImage || undefined,
      casualMode: casualMode || undefined,
    };

    onScenarioCreate(scenario);
  };

  const toggleAvatar = (avatarId: string) => {
    if (selectedAvatarIds.includes(avatarId)) {
      setSelectedAvatarIds(selectedAvatarIds.filter(id => id !== avatarId));
    } else {
      if (selectedAvatarIds.length < 8) {
        setSelectedAvatarIds([...selectedAvatarIds, avatarId]);
      }
    }
  };

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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Scenario</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Topic Input with Inline Image Upload */}
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
            Topic or Question
          </label>
          <div className="relative">
            <textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Should we prioritize innovation or stability in our product roadmap?"
              rows={3}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {/* Inline attachment button */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                disabled={isModerating}
                className="hidden"
                id="scenario-image-upload"
              />
              <label
                htmlFor="scenario-image-upload"
                className={`p-1.5 rounded cursor-pointer transition-colors ${
                  isModerating
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-100'
                } ${selectedImage ? 'text-blue-600' : 'text-gray-500'}`}
                title="Attach image"
              >
                {isModerating ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                )}
              </label>
            </div>
          </div>

          {/* Image Preview */}
          {selectedImage && (
            <div className="mt-2 relative border border-gray-300 rounded-md p-2 bg-gray-50">
              <div className="flex items-start gap-2">
                <img
                  src={selectedImage.url}
                  alt="Scenario preview"
                  className="max-h-32 max-w-full rounded object-contain"
                />
                <div className="flex-1">
                  {selectedImage.moderationStatus === 'approved' && (
                    <div className="inline-flex items-center gap-1 bg-green-500 text-white text-xs px-2 py-1 rounded mb-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Approved
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="block text-xs text-red-600 hover:text-red-800 underline mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Moderation Error */}
          {moderationError && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
              {moderationError}
            </div>
          )}
        </div>

        {/* Interaction Style */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interaction Style
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['debate', 'brainstorm', 'cooperative'] as InteractionStyle[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStyle(s)}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${style === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {style === 'debate' && 'Avatars challenge and critique each other\'s viewpoints'}
            {style === 'brainstorm' && 'Avatars generate and build upon creative ideas'}
            {style === 'cooperative' && 'Avatars work together toward consensus'}
          </p>
        </div>

        {/* Avatar Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Participants ({selectedAvatarIds.length}/8)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-md">
            {avatars.map((avatar) => {
              const isSelected = selectedAvatarIds.includes(avatar.id);
              const isDisabled = !isSelected && selectedAvatarIds.length >= 8;

              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => toggleAvatar(avatar.id)}
                  disabled={isDisabled}
                  className={`
                    px-3 py-2 rounded-md text-sm font-medium transition-all text-left
                    ${isSelected
                      ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                      : isDisabled
                      ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  <div className="font-bold">{avatar.mbtiType}</div>
                  <div className="text-xs truncate">{avatar.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Rounds */}
        <div>
          <label htmlFor="rounds" className="block text-sm font-medium text-gray-700 mb-2">
            Number of Rounds: {rounds}
          </label>
          <input
            id="rounds"
            type="range"
            min="1"
            max="10"
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 (Quick)</span>
            <span>10 (Deep)</span>
          </div>
        </div>

        {/* Casual Mode Toggle */}
        <div className="flex items-center gap-3">
          <input
            id="casualMode"
            type="checkbox"
            checked={casualMode}
            onChange={(e) => setCasualMode(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="casualMode" className="text-sm font-medium text-gray-700">
            Casual Mode
          </label>
          <p className="text-xs text-gray-500">
            Use informal, conversational language instead of formal speech
          </p>
        </div>


        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">Please fix the following:</h4>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm text-red-700">{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          Run Simulation
        </button>
      </form>
    </div>
  );
}
