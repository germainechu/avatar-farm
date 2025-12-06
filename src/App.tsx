import { useMemo, useState } from 'react';
import AppShell from './components/AppShell';
import { AvatarGrid } from './features/avatars';
import { ScenarioBuilder } from './features/scenarios';
import { SimulationView } from './features/simulation';
import ChatHistory from './features/simulation/ChatHistory';
import { generateAvatars } from './lib/avatars';
import { saveScenario } from './lib/storage';
import type { Scenario } from './types';
import type { StoredSimulation } from './lib/storage';

type AppView = 'avatars' | 'scenario-builder' | 'simulation' | 'chat-history';

function App() {
  const avatars = useMemo(() => generateAvatars(), []);
  const [view, setView] = useState<AppView>('avatars');
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);

  const handleScenarioCreate = (scenario: Scenario) => {
    saveScenario(scenario);
    setCurrentScenario(scenario);
    setView('simulation');
  };

  const handleBackToSetup = () => {
    setView('scenario-builder');
  };

  const handleLoadSimulation = (simulation: StoredSimulation) => {
    setCurrentScenario(simulation.scenario);
    setView('simulation');
  };

  return (
    <AppShell>
      {/* Navigation Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setView('avatars')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              view === 'avatars'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Avatar Library
          </button>
          <button
            onClick={() => setView('scenario-builder')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              view === 'scenario-builder'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Create Scenario
          </button>
          <button
            onClick={() => setView('chat-history')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              view === 'chat-history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Chat History
          </button>
          {currentScenario && (
            <button
              onClick={() => setView('simulation')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                view === 'simulation'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Simulation
            </button>
          )}
        </nav>
      </div>

      {/* View Content */}
      {view === 'avatars' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Avatar Library</h2>
            <p className="text-gray-600">
              Explore 16 MBTI personality types, each driven by their unique cognitive function stack.
              Click on any avatar to see their detailed function stack and communication style.
            </p>
          </div>
          
          <AvatarGrid avatars={avatars} />
        </div>
      )}

      {view === 'scenario-builder' && (
        <div className="max-w-3xl mx-auto">
          <ScenarioBuilder
            avatars={avatars}
            onScenarioCreate={handleScenarioCreate}
          />
        </div>
      )}

      {view === 'simulation' && currentScenario && (
        <SimulationView
          scenario={currentScenario}
          avatars={avatars}
          onBack={handleBackToSetup}
        />
      )}

      {view === 'chat-history' && (
        <ChatHistory
          avatars={avatars}
          onLoadSimulation={handleLoadSimulation}
        />
      )}
    </AppShell>
  );
}

export default App;

