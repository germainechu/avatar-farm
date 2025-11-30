import { useState, useEffect } from 'react';
import type { Scenario, Avatar, Message, AvatarPosition } from '../../types';
import { runSimulation, generatePositions } from '../../lib/simulationEngine';
import ConversationTimeline from './ConversationTimeline';
import SimulationControls from './SimulationControls';
import SimulationAnalytics from './SimulationAnalytics';
import FinalPositions from './FinalPositions';

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
  const [typingAvatarId, setTypingAvatarId] = useState<string | null>(null);
  const [positions, setPositions] = useState<AvatarPosition[]>([]);
  const [isGeneratingPositions, setIsGeneratingPositions] = useState(false);

  const participants = avatars.filter(a => scenario.avatarIds.includes(a.id));
  const messagesPerRound = participants.length;
  const currentRound = Math.floor(currentIndex / messagesPerRound) + 1;

  // Generate messages in real-time (live chat mode)
  useEffect(() => {
    let isCancelled = false;

    const generateMessages = async () => {
      setIsGenerating(true);
      setGenerationError(null);
      setMessages([]); // Clear previous messages
      setAllMessages([]); // Clear previous messages
      setCurrentIndex(0);
      setTypingAvatarId(null); // Clear typing indicator
      setPositions([]); // Clear previous positions when regenerating messages
      setIsGeneratingPositions(false); // Reset position generation state
      
      try {
        // Use callbacks to show messages and typing indicators (live chat feel)
        const generatedMessages = await runSimulation(
          scenario, 
          avatars,
          (message) => {
            // Show message immediately when it arrives
            if (!isCancelled) {
              setMessages(prev => [...prev, message]);
              setAllMessages(prev => [...prev, message]);
              setCurrentIndex(prev => prev + 1);
            }
          },
          (avatarId) => {
            // Show typing indicator when avatar starts generating
            if (!isCancelled) {
              setTypingAvatarId(avatarId);
            }
          },
          () => {
            // Hide typing indicator when avatar finishes generating
            if (!isCancelled) {
              setTypingAvatarId(null);
            }
          }
        );
        
        // Ensure all messages are stored even if callback missed any
        if (!isCancelled) {
          setAllMessages(generatedMessages);
          
          // Generate positions after simulation completes
          setIsGeneratingPositions(true);
          try {
            const avatarPositions = await generatePositions(scenario, generatedMessages, avatars);
            if (!isCancelled) {
              setPositions(avatarPositions);
            }
          } catch (error) {
            console.error('Error generating positions:', error);
            // Don't show error to user, positions are optional
          } finally {
            if (!isCancelled) {
              setIsGeneratingPositions(false);
            }
          }
        }
      } catch (error) {
        if (!isCancelled) {
          setGenerationError(error instanceof Error ? error.message : 'Failed to generate messages');
          setTypingAvatarId(null); // Clear typing indicator on error
          setPositions([]); // Clear positions on error
          setIsGeneratingPositions(false); // Reset position generation state on error
          console.error('Error generating messages:', error);
        }
      } finally {
        if (!isCancelled) {
          setIsGenerating(false);
          setTypingAvatarId(null); // Ensure typing indicator is cleared
        }
      }
    };

    generateMessages();

    return () => {
      isCancelled = true;
    };
  }, [scenario, avatars]);

  const handleStart = () => {
    // Messages are already being generated and displayed in real-time
    // This button can be used to restart if needed
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
    setAllMessages([]);
    setTypingAvatarId(null);
    setPositions([]);
    setIsGeneratingPositions(false);
    // Trigger regeneration by changing a dependency
    // This will be handled by the useEffect above
  };

  const handleStep = () => {
    // Step mode not needed in live chat mode, but keep for compatibility
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

      {/* Main Content */}
      {!generationError && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Conversation and Final Positions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Conversation Timeline */}
            <div className="bg-gray-50 rounded-lg p-6 max-h-[600px] overflow-y-auto border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversation</h3>
              <ConversationTimeline
                messages={messages}
                avatars={avatars}
                currentMessageIndex={messages.length - 1}
                typingAvatarId={typingAvatarId}
              />
            </div>

            {/* Final Positions - Directly below chat, clearly separated */}
            <FinalPositions
              positions={positions}
              avatars={participants}
              isGenerating={isGeneratingPositions}
            />
          </div>

          {/* Right Column: Analytics Dashboard */}
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
