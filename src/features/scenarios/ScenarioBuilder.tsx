import { useState } from 'react';
import type { Avatar, InteractionStyle, Scenario } from '../../types';

interface ScenarioBuilderProps {
  avatars: Avatar[];
  onScenarioCreate: (scenario: Scenario) => void;
}

export default function ScenarioBuilder({ avatars, onScenarioCreate }: ScenarioBuilderProps) {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState<InteractionStyle>('brainstorm');
  const [selectedAvatarIds, setSelectedAvatarIds] = useState<string[]>([]);
  const [rounds, setRounds] = useState(10);
  const [errors, setErrors] = useState<string[]>([]);

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

    if (rounds < 4 || rounds > 40) {
      newErrors.push('Rounds must be between 4 and 40');
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
      useLLM: true // Always use LLM mode
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Scenario</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Topic Input */}
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
            Topic or Question
          </label>
          <textarea
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Should we prioritize innovation or stability in our product roadmap?"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
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
            min="4"
            max="40"
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>4 (Quick)</span>
            <span>40 (Deep)</span>
          </div>
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
