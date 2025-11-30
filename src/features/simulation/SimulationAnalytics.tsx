import type { Message, Avatar, MessageTag } from '../../types';

interface SimulationAnalyticsProps {
  messages: Message[];
  avatars: Avatar[];
}

export default function SimulationAnalytics({ messages, avatars }: SimulationAnalyticsProps) {
  if (messages.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h3>
        <p className="text-gray-500 text-sm">Analytics will appear once the simulation starts.</p>
      </div>
    );
  }

  // Calculate message counts per avatar
  const messageCounts = avatars.map(avatar => ({
    avatar,
    count: messages.filter(m => m.avatarId === avatar.id).length
  }));

  // Calculate tag distribution
  const tagCounts: Record<MessageTag, number> = {
    support: 0,
    critique: 0,
    idea: 0,
    clarify: 0
  };

  messages.forEach(m => {
    tagCounts[m.tag]++;
  });

  const totalMessages = messages.length;

  // Calculate logical vs emotional balance
  const logicalEmotionalBalance = calculateLogicalEmotionalBalance(messages, avatars);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>

      {/* Message Count per Avatar */}
      <section>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Messages per Avatar</h4>
        <div className="space-y-2">
          {messageCounts.map(({ avatar, count }) => (
            <div key={avatar.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-600">{avatar.mbtiType}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500"
                    style={{ width: `${(count / Math.max(...messageCounts.map(m => m.count))) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 w-6 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tag Distribution */}
      <section>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Message Types</h4>
        <div className="space-y-2">
          {Object.entries(tagCounts).map(([tag, count]) => {
            const percentage = totalMessages > 0 ? (count / totalMessages) * 100 : 0;
            const tagColors: Record<string, string> = {
              support: 'bg-green-500',
              critique: 'bg-red-500',
              idea: 'bg-purple-500',
              clarify: 'bg-blue-500'
            };

            return (
              <div key={tag} className="flex items-center justify-between">
                <span className="text-xs text-gray-600 capitalize">{tag}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${tagColors[tag]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 w-10 text-right">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Logical vs Emotional Balance */}
      <section>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Discussion Balance</h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Logical</span>
              <span>Emotional</span>
            </div>
            <div className="h-3 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full relative">
              <div 
                className="absolute top-0 w-1 h-full bg-white border-2 border-gray-800 rounded-full"
                style={{ left: `${logicalEmotionalBalance * 100}%` }}
              />
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center">
            {logicalEmotionalBalance < 0.4 && "Highly logical discussion"}
            {logicalEmotionalBalance >= 0.4 && logicalEmotionalBalance <= 0.6 && "Balanced discussion"}
            {logicalEmotionalBalance > 0.6 && "Emotionally focused discussion"}
          </div>
        </div>
      </section>

      {/* Summary Stats */}
      <section className="pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalMessages}</div>
            <div className="text-xs text-gray-500">Total Messages</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{avatars.length}</div>
            <div className="text-xs text-gray-500">Participants</div>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Calculates the logical vs emotional balance of the conversation
 * Returns a value between 0 (fully logical) and 1 (fully emotional)
 */
function calculateLogicalEmotionalBalance(messages: Message[], avatars: Avatar[]): number {
  if (messages.length === 0) return 0.5;

  let totalEmotionalFocus = 0;

  messages.forEach(message => {
    const avatar = avatars.find(a => a.id === message.avatarId);
    if (avatar) {
      totalEmotionalFocus += avatar.behavior.emotionalFocus;
    }
  });

  return totalEmotionalFocus / messages.length;
}
