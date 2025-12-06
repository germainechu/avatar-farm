import { useState, useEffect } from 'react';
import type { StoredSimulation } from '../../lib/storage';
import { getSavedSimulations, deleteSimulation } from '../../lib/storage';
import ConversationTimeline from './ConversationTimeline';
import type { Avatar } from '../../types';

interface ChatHistoryProps {
  avatars: Avatar[];
  onLoadSimulation?: (simulation: StoredSimulation) => void;
}

export default function ChatHistory({ avatars, onLoadSimulation }: ChatHistoryProps) {
  const [simulations, setSimulations] = useState<StoredSimulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSimulation, setSelectedSimulation] = useState<StoredSimulation | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadSimulations();
  }, []);

  const loadSimulations = async () => {
    setLoading(true);
    try {
      const saved = await getSavedSimulations();
      setSimulations(saved);
    } catch (error) {
      console.error('Error loading simulations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteSimulation(id);
      await loadSimulations();
      if (selectedSimulation?.id === id) {
        setSelectedSimulation(null);
      }
    } catch (error) {
      console.error('Error deleting simulation:', error);
      alert('Failed to delete conversation');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = (simulation: StoredSimulation) => {
    try {
      const json = JSON.stringify(
        {
          id: simulation.id,
          scenario: simulation.scenario,
          messages: simulation.messages,
          completedAt: simulation.completedAt,
        },
        null,
        2
      );
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${simulation.id}-${new Date(simulation.completedAt).toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting simulation:', error);
      alert('Failed to export conversation');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getParticipantNames = (simulation: StoredSimulation) => {
    const participantIds = simulation.scenario.avatarIds;
    const names = participantIds
      .map(id => avatars.find(a => a.id === id)?.name)
      .filter(Boolean);
    return names.join(', ');
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading conversations...</p>
      </div>
    );
  }

  if (simulations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-2">No saved conversations yet.</p>
        <p className="text-sm text-gray-400">
          Complete a simulation and save it to see it here.
        </p>
      </div>
    );
  }

  if (selectedSimulation) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedSimulation(null)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
          >
            ← Back to List
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport(selectedSimulation)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Export JSON
            </button>
            {onLoadSimulation && (
              <button
                onClick={() => onLoadSimulation(selectedSimulation)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Load Conversation
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {selectedSimulation.scenario.topic}
            </h3>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>
                <strong>Style:</strong> {selectedSimulation.scenario.style}
              </span>
              <span>
                <strong>Participants:</strong> {getParticipantNames(selectedSimulation)}
              </span>
              <span>
                <strong>Messages:</strong> {selectedSimulation.messages.length}
              </span>
              <span>
                <strong>Completed:</strong> {formatDate(selectedSimulation.completedAt)}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 max-h-[600px] overflow-y-auto border border-gray-200">
            <ConversationTimeline
              messages={selectedSimulation.messages}
              avatars={avatars}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Chat History</h2>
        <button
          onClick={loadSimulations}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4">
        {simulations.map((simulation) => (
          <div
            key={simulation.id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {simulation.scenario.topic}
                </h3>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                  <span>
                    <strong>Style:</strong> {simulation.scenario.style}
                  </span>
                  <span>
                    <strong>Participants:</strong> {getParticipantNames(simulation)}
                  </span>
                  <span>
                    <strong>Messages:</strong> {simulation.messages.length}
                  </span>
                  <span>
                    <strong>Completed:</strong> {formatDate(simulation.completedAt)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => setSelectedSimulation(simulation)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  View
                </button>
                <button
                  onClick={() => handleExport(simulation)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Export
                </button>
                <button
                  onClick={() => handleDelete(simulation.id)}
                  disabled={deletingId === simulation.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === simulation.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

