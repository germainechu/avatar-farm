import { useState, useEffect } from 'react';
import type { Scenario, Avatar, Message, AvatarPosition } from '../../types';
import { runSimulation, generatePositions, continueSimulation, interjectAndContinue } from '../../lib/simulationEngine';
import { saveSimulation } from '../../lib/storage';
import ConversationTimeline from './ConversationTimeline';
import SimulationControls from './SimulationControls';
import SimulationAnalytics from './SimulationAnalytics';
import PerspectiveDiagram from './PerspectiveDiagram';
import UserInterjection from './UserInterjection';

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
  const [totalRounds, setTotalRounds] = useState(scenario.rounds);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

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
      setTotalRounds(scenario.rounds); // Reset to original rounds
      
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

  const handleExtendConversation = async () => {
    if (allMessages.length === 0) return;

    setIsGenerating(true);
    setGenerationError(null);
    setTypingAvatarId(null);

    try {
      // Continue from existing messages
      const additionalRounds = 5; // Add 5 more rounds
      const extendedScenario = {
        ...scenario,
        rounds: totalRounds + additionalRounds,
      };
      
      // Update total rounds state
      setTotalRounds(totalRounds + additionalRounds);

      const newMessages = await continueSimulation(
        extendedScenario,
        allMessages,
        avatars,
        (message) => {
          setMessages(prev => [...prev, message]);
          setAllMessages(prev => [...prev, message]);
        },
        (avatarId) => {
          setTypingAvatarId(avatarId);
        },
        () => {
          setTypingAvatarId(null);
        }
      );

      // Regenerate positions with all messages (existing + new)
      setIsGeneratingPositions(true);
      try {
        const allMessagesWithNew = [...allMessages, ...newMessages];
        const avatarPositions = await generatePositions(extendedScenario, allMessagesWithNew, avatars);
        setPositions(avatarPositions);
      } catch (error) {
        console.error('Error regenerating positions:', error);
      } finally {
        setIsGeneratingPositions(false);
      }
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Failed to extend conversation');
      console.error('Error extending conversation:', error);
    } finally {
      setIsGenerating(false);
      setTypingAvatarId(null);
    }
  };

  const handleUserInterjection = async (userMessage: string, image?: import('../../types').MessageImage) => {
    if ((!userMessage.trim() && !image) || isGenerating) return;

    setIsGenerating(true);
    setGenerationError(null);
    setTypingAvatarId(null);

    try {
      // Calculate next round number
      const lastRound = allMessages.length > 0 
        ? Math.max(...allMessages.map(m => m.round))
        : 0;
      const nextRound = lastRound + 1;

      // Create user message
      const userMessageObj: Message = {
        id: `user-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        scenarioId: scenario.id,
        avatarId: 'user',
        round: nextRound,
        content: userMessage || (image ? '[Image shared]' : ''),
        tag: 'idea', // Default tag for user messages
        createdAt: new Date().toISOString(),
        image: image,
      };

      // Add user message to conversation
      const messagesWithUser = [...allMessages, userMessageObj];
      setMessages(prev => [...prev, userMessageObj]);
      setAllMessages(messagesWithUser);
      
      // Update currentIndex to reflect the user message being added
      setCurrentIndex(messagesWithUser.length);

      // Continue simulation with avatars responding to user interjection
      // Add 5 rounds after user interjection
      const additionalRounds = 5;
      const extendedScenario = {
        ...scenario,
        rounds: totalRounds + additionalRounds,
      };
      
      // Update total rounds state (this will reset the progress bar calculation)
      setTotalRounds(totalRounds + additionalRounds);

      const newMessages = await interjectAndContinue(
        extendedScenario,
        messagesWithUser,
        avatars,
        (message) => {
          setMessages(prev => [...prev, message]);
          setAllMessages(prev => [...prev, message]);
          setCurrentIndex(prev => prev + 1); // Update progress as messages arrive
        },
        (avatarId) => {
          setTypingAvatarId(avatarId);
        },
        () => {
          setTypingAvatarId(null);
        }
      );

      // Regenerate positions with all messages (including user interjection)
      setIsGeneratingPositions(true);
      try {
        const allMessagesWithNew = [...messagesWithUser, ...newMessages];
        const avatarPositions = await generatePositions(extendedScenario, allMessagesWithNew, avatars);
        setPositions(avatarPositions);
      } catch (error) {
        console.error('Error regenerating positions:', error);
      } finally {
        setIsGeneratingPositions(false);
      }
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Failed to process interjection');
      console.error('Error processing user interjection:', error);
    } finally {
      setIsGenerating(false);
      setTypingAvatarId(null);
    }
  };

  const handleSave = async () => {
    if (allMessages.length === 0) {
      alert('No messages to save');
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await saveSimulation(scenario, allMessages);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving simulation:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
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
          {scenario.image && (
            <div className="mt-3">
              <div className="relative inline-block border border-gray-300 rounded-lg p-2 bg-gray-50 max-w-md">
                <img
                  src={scenario.image.url}
                  alt="Scenario image"
                  className="max-h-48 max-w-full rounded object-contain"
                />
                {scenario.image.moderationStatus === 'approved' && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    ✓ Verified
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Scenario image - avatars will analyze this</p>
            </div>
          )}
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
        {!isGenerating && allMessages.length > 0 && (
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                saveStatus === 'success'
                  ? 'bg-green-600 text-white'
                  : saveStatus === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSaving
                ? 'Saving...'
                : saveStatus === 'success'
                ? '✓ Saved!'
                : saveStatus === 'error'
                ? '✗ Error'
                : '💾 Save Conversation'}
            </button>
            {saveStatus === 'success' && (
              <p className="text-xs text-green-600">Saved to chat history</p>
            )}
            {saveStatus === 'error' && (
              <p className="text-xs text-red-600">Failed to save</p>
            )}
          </div>
        )}
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
          totalRounds={totalRounds}
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

            {/* User Interjection */}
            {!isGenerating && allMessages.length > 0 && (
              <UserInterjection
                onInterject={(message, image) => handleUserInterjection(message, image)}
                isGenerating={isGenerating}
                disabled={isGenerating}
              />
            )}

            {/* Perspective Diagram - Shows individual perspectives and common ground */}
            <PerspectiveDiagram
              positions={positions}
              messages={allMessages}
              avatars={participants}
              scenario={scenario}
              isGenerating={isGeneratingPositions}
            />

            {/* Extend Conversation Button */}
            {!isGenerating && allMessages.length > 0 && (
              <div className="flex justify-center">
                <button
                  onClick={handleExtendConversation}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  + Add 5 More Rounds
                </button>
              </div>
            )}
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
