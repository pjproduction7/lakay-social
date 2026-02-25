import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

const DEFAULT_EMOJIS = [
  '😀','😁','😂','🤣','😊','😍','😘','😎','🤔','😇',
  '😢','😭','😡','😴','🤯','😱','👍','🙏','🔥','💯',
  '🎉','✨','💐','🕊️','🕯️','❤️','💔','🌹','🎶','📸',
];

export default function EmojiPicker({ onSelect, emojis = DEFAULT_EMOJIS }) {
  const items = useMemo(() => emojis.filter(Boolean), [emojis]);

  return (
    <div className="grid grid-cols-10 gap-2 p-3 bg-white rounded-lg shadow-lg border">
      {items.map((emoji, idx) => (
        <button
          key={`${emoji}-${idx}`}
          type="button"
          onClick={() => onSelect(emoji)}
          className="text-xl hover:scale-110 transition"
          aria-label={`Insert ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

EmojiPicker.propTypes = {
  onSelect: PropTypes.func.isRequired,
  emojis: PropTypes.array,
};
