import { useEffect } from 'react';
import type { Avatar } from '../../types';
import { FUNCTION_DESCRIPTIONS } from '../../lib/mbtiData';
import { describeBehavior } from '../../lib/behaviorDerivation';

interface AvatarDetailDrawerProps {
  avatar: Avatar;
  isOpen: boolean;
  onClose: () => void;
}

export default function AvatarDetailDrawer({ avatar, isOpen, onClose }: AvatarDetailDrawerProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const roleLabels = {
    dominant: 'Dominant',
    auxiliary: 'Auxiliary',
    tertiary: 'Tertiary',
    inferior: 'Inferior'
  };

  const roleColors = {
    dominant: 'bg-purple-100 text-purple-800 border-purple-300',
    auxiliary: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    tertiary: 'bg-blue-100 text-blue-800 border-blue-300',
    inferior: 'bg-gray-100 text-gray-800 border-gray-300'
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{avatar.mbtiType}</h2>
            <p className="text-sm text-gray-600">{avatar.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Description */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Overview
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {avatar.description}
            </p>
          </section>

          {/* Cognitive Function Stack */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Cognitive Function Stack
            </h3>
            <div className="space-y-3">
              {avatar.functions.map((func, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border-2 ${roleColors[func.role]}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">{func.code}</span>
                    <span className="text-xs font-medium uppercase">
                      {roleLabels[func.role]}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {FUNCTION_DESCRIPTIONS[func.code]}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Behavior Profile */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Communication Style
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              {describeBehavior(avatar.behavior)}
            </p>
            
            <div className="space-y-3">
              <BehaviorDetail
                label="Abstractness"
                value={avatar.behavior.abstractness}
                lowLabel="Concrete"
                highLabel="Abstract"
              />
              <BehaviorDetail
                label="Emotional Focus"
                value={avatar.behavior.emotionalFocus}
                lowLabel="Logical"
                highLabel="Emotional"
              />
              <BehaviorDetail
                label="Structure"
                value={avatar.behavior.structure}
                lowLabel="Flexible"
                highLabel="Organized"
              />
              <BehaviorDetail
                label="Risk Taking"
                value={avatar.behavior.riskTaking}
                lowLabel="Cautious"
                highLabel="Bold"
              />
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs font-medium text-gray-500 mb-1">Temporal Focus</div>
              <div className="text-sm font-semibold text-gray-900 capitalize">
                {avatar.behavior.temporalFocus}
              </div>
            </div>
          </section>

          {/* Discussion Tendencies */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Discussion Tendencies
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <TendencyItem tendency={getStrengths(avatar)} label="Strengths" />
              <TendencyItem tendency={getBlindSpots(avatar)} label="Blind Spots" />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

interface BehaviorDetailProps {
  label: string;
  value: number;
  lowLabel: string;
  highLabel: string;
}

function BehaviorDetail({ label, value, lowLabel, highLabel }: BehaviorDetailProps) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all"
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

interface TendencyItemProps {
  tendency: string;
  label: string;
}

function TendencyItem({ tendency, label }: TendencyItemProps) {
  return (
    <div>
      <span className="font-medium text-gray-700">{label}:</span>{' '}
      <span>{tendency}</span>
    </div>
  );
}

function getStrengths(avatar: Avatar): string {
  const strengths: string[] = [];
  const { behavior, functions } = avatar;

  const dominant = functions.find(f => f.role === 'dominant')?.code;

  if (behavior.abstractness > 0.7) strengths.push("seeing big picture patterns");
  if (behavior.emotionalFocus > 0.7) strengths.push("reading group dynamics");
  if (behavior.structure > 0.7) strengths.push("organizing ideas systematically");
  if (behavior.riskTaking > 0.7) strengths.push("proposing bold solutions");
  
  if (dominant === 'Ni') strengths.push("synthesizing insights");
  if (dominant === 'Ne') strengths.push("generating possibilities");
  if (dominant === 'Ti') strengths.push("logical analysis");
  if (dominant === 'Te') strengths.push("efficient execution");
  if (dominant === 'Fi') strengths.push("authentic values");
  if (dominant === 'Fe') strengths.push("harmonizing group");
  if (dominant === 'Si') strengths.push("recalling precedents");
  if (dominant === 'Se') strengths.push("responding to present");

  return strengths.slice(0, 3).join(", ") || "balanced approach";
}

function getBlindSpots(avatar: Avatar): string {
  const blindSpots: string[] = [];
  const { behavior, functions } = avatar;

  const inferior = functions.find(f => f.role === 'inferior')?.code;

  if (behavior.abstractness > 0.7) blindSpots.push("practical details");
  if (behavior.abstractness < 0.3) blindSpots.push("abstract implications");
  if (behavior.emotionalFocus > 0.7) blindSpots.push("impersonal logic");
  if (behavior.emotionalFocus < 0.3) blindSpots.push("emotional nuances");
  if (behavior.structure > 0.7) blindSpots.push("spontaneous adaptation");
  if (behavior.structure < 0.3) blindSpots.push("systematic planning");

  if (inferior === 'Se') blindSpots.push("immediate sensory reality");
  if (inferior === 'Si') blindSpots.push("past experiences");
  if (inferior === 'Ne') blindSpots.push("alternative possibilities");
  if (inferior === 'Ni') blindSpots.push("long-term implications");
  if (inferior === 'Fe') blindSpots.push("group harmony");
  if (inferior === 'Fi') blindSpots.push("personal values");
  if (inferior === 'Te') blindSpots.push("efficient systems");
  if (inferior === 'Ti') blindSpots.push("logical consistency");

  return blindSpots.slice(0, 3).join(", ") || "well-rounded";
}
