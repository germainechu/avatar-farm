interface SimulationControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  currentRound: number;
  totalRounds: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onStep?: () => void;
}

export default function SimulationControls({
  isRunning,
  isPaused,
  currentRound,
  totalRounds,
  onStart,
  onPause,
  onResume,
  onReset,
  onStep
}: SimulationControlsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between">
        {/* Progress Info */}
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-700 mb-1">
            Progress: Round {currentRound} of {totalRounds}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(currentRound / totalRounds) * 100}%` }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2 ml-6">
          {!isRunning ? (
            <button
              onClick={onStart}
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              ▶ Start
            </button>
          ) : isPaused ? (
            <button
              onClick={onResume}
              className="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors"
            >
              ▶ Resume
            </button>
          ) : (
            <button
              onClick={onPause}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md font-medium hover:bg-yellow-700 transition-colors"
            >
              ⏸ Pause
            </button>
          )}

          {onStep && (isPaused || !isRunning) && (
            <button
              onClick={onStep}
              className="px-4 py-2 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700 transition-colors"
            >
              ⏭ Step
            </button>
          )}

          <button
            onClick={onReset}
            className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors"
          >
            ⟲ Reset
          </button>
        </div>
      </div>
    </div>
  );
}
