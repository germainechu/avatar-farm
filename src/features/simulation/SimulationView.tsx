import { useState, useEffect } from 'react';
import type { Scenario, Avatar, Message } from '../../types';
import { runSimulation } from '../../lib/simulationEngine';
import ConversationTimeline from './ConversationTimeline';
import SimulationControls from './SimulationControls';
import SimulationAnalytics from './SimulationAnalytics';

interface SimulationViewProps {
  scenario: Scenario;
  avatars: Avatar[];
  onBack: () => void;
}

export default function SimulationView({ scenario, avatars, onBack }: SimulationViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const participants = avatars.filter(a => scenario.avatarIds.includes(a.id));
  const messagesPerRound = participants.length;
  const currentRound = Math.floor(currentIndex / messagesPerRound) + 1;

  // Generate all messages on mount (now async)
  useEffect(() => {
    let isCancelled = false;

    const generateMessages = async () => {
      setIsGenerating(true);
      setGenerationError(null);
      try {
        const generatedMessages = await runSimulation(scenario, avatars);
        if (!isCancelled) {
          setAllMessages(generatedMessages);
        }
      } catch (error) {
        if (!isCancelled) {
          setGenerationError(error instanceof Error ? error.message : 'Failed to generate messages');
          console.error('Error generating messages:', error);
        }
      } finally {
        if (!isCancelled) {
          setIsGenerating(false);
        }
      }
    };

    generateMessages();

    return () => {
      isCancelled = true;
    };
  }, [scenario, avatars]);

  // Auto-play simulation
  useEffect(() => {
    if (isRunning && !isPaused && currentIndex < allMessages.length) {
      const timer = setTimeout(() => {
        setMessages(prev => [...prev, allMessages[currentIndex]]);
        setCurrentIndex(prev => prev + 1);
      }, 800); // 800ms delay between messages

      return () => clearTimeout(timer);
    } else if (currentIndex >= allMessages.length && isRunning) {
      setIsRunning(false);
    }
  }, [isRunning, isPaused, currentIndex, allMessages]);

  const handleStart = () => {
    if (currentIndex === 0) {
      setMessages([]);
    }
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentIndex(0);
    setMessages([]);
  };

  const handleStep = () => {
    if (currentIndex < allMessages.length) {
      setMessages(prev => [...prev, allMessages[currentIndex]]);
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1 text-sm"
          >
            ← Back to Setup
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Simulation</h2>
          <p className="text-gray-600 mt-1">{scenario.topic}</p>
          <div className="flex gap-2 mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {scenario.style}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {participants.length} participants
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              ✨ Enhanced Mode
            </span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isGenerating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-blue-800 font-medium">
            Generating conversation messages...
          </p>
          <p className="text-blue-600 text-sm mt-1">
            Using AI to create natural dialogue (this may take a minute)
          </p>
        </div>
      )}

      {/* Error State */}
      {generationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium mb-2">Error Generating Messages</h3>
          <p className="text-red-700 text-sm">{generationError}</p>
          <p className="text-red-600 text-xs mt-2">
            Please check your API configuration and try again.
          </p>
        </div>
      )}

      {/* Controls */}
      {!isGenerating && !generationError && (
        <SimulationControls
          isRunning={isRunning}
          isPaused={isPaused}
          currentRound={currentRound}
          totalRounds={scenario.rounds}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onReset={handleReset}
          onStep={handleStep}
        />
      )}

      {/* Main Content Grid */}
      {!isGenerating && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation Timeline - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 rounded-lg p-6 max-h-[600px] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversation</h3>
              {allMessages.length === 0 && !generationError ? (
                <p className="text-gray-500 text-center py-8">No messages generated yet.</p>
              ) : (
                <ConversationTimeline
                  messages={messages}
                  avatars={avatars}
                  currentMessageIndex={messages.length - 1}
                />
              )}
            </div>
          </div>

          {/* Analytics - Takes 1 column */}
          <div className="lg:col-span-1">
            <SimulationAnalytics
              messages={messages}
              avatars={participants}
            />
          </div>
        </div>
      )}
    </div>
  );
}
