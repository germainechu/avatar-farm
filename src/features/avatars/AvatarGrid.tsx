import { useState } from 'react';
import type { Avatar } from '../../types';
import AvatarCard from './AvatarCard';
import AvatarDetailDrawer from './AvatarDetailDrawer';

interface AvatarGridProps {
  avatars: Avatar[];
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  selectionMode?: boolean;
  maxSelection?: number;
}

export default function AvatarGrid({ 
  avatars, 
  selectedIds = [],
  onSelectionChange,
  selectionMode = false,
  maxSelection = 8
}: AvatarGridProps) {
  const [detailAvatarId, setDetailAvatarId] = useState<string | null>(null);

  const handleCardClick = (avatar: Avatar) => {
    if (selectionMode && onSelectionChange) {
      // Toggle selection
      const isSelected = selectedIds.includes(avatar.id);
      
      if (isSelected) {
        // Deselect
        onSelectionChange(selectedIds.filter(id => id !== avatar.id));
      } else {
        // Select if under max
        if (selectedIds.length < maxSelection) {
          onSelectionChange([...selectedIds, avatar.id]);
        }
      }
    } else {
      // Show detail drawer
      setDetailAvatarId(avatar.id);
    }
  };

  const detailAvatar = avatars.find(a => a.id === detailAvatarId);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {avatars.map(avatar => (
          <AvatarCard
            key={avatar.id}
            avatar={avatar}
            onClick={() => handleCardClick(avatar)}
            isSelected={selectedIds.includes(avatar.id)}
          />
        ))}
      </div>

      {/* Detail Drawer */}
      {detailAvatar && (
        <AvatarDetailDrawer
          avatar={detailAvatar}
          isOpen={!!detailAvatarId}
          onClose={() => setDetailAvatarId(null)}
        />
      )}
    </>
  );
}
