import React, { useState } from "react";
import PropTypes from 'prop-types';

const AVATAR_STYLES = [
  { id: 'avataaars', name: 'Avataaars', description: 'Cartoon style' },
  { id: 'bottts', name: 'Bottts', description: 'Robot avatars' },
  { id: 'fun-emoji', name: 'Fun Emoji', description: 'Playful emojis' },
  { id: 'lorelei', name: 'Lorelei', description: 'Illustrated faces' },
  { id: 'micah', name: 'Micah', description: 'Simple geometric' },
  { id: 'miniavs', name: 'Miniavs', description: 'Pixel art' },
  { id: 'notionists', name: 'Notionists', description: 'Notion-style' },
  { id: 'personas', name: 'Personas', description: 'Professional' },
  { id: 'thumbs', name: 'Thumbs', description: 'Thumbs up' },
  { id: 'adventurer', name: 'Adventurer', description: 'Adventure style' }
];

const seeds = [
  'default', 'variant1', 'variant2', 'variant3', 'variant4',
  'variant5', 'variant6', 'variant7', 'variant8', 'variant9',
  'variant10', 'variant11', 'variant12', 'variant13', 'variant14', 'variant15'
];

const generateAvatarUrl = (style, seed, currentUser) =>
  `https://api.dicebear.com/7.x/${style}/svg?seed=${currentUser}-${seed}`;

const AvatarPicker = ({ currentUser, currentAvatar, onSelect, onClose }) => {
  const [selectedStyle, setSelectedStyle] = useState(null);

  return (
    <div className="avatar-picker-overlay" onClick={onClose}>
      <div className="avatar-picker" onClick={e => e.stopPropagation()}>
        <h3>Choose Your Avatar</h3>
        {!selectedStyle ? (
          <>
            <p>Select a style:</p>
            <div className="avatar-styles-grid">
              {AVATAR_STYLES.map((style) => (
                <button
                  key={style.id}
                  className="avatar-style-option"
                  onClick={() => setSelectedStyle(style.id)}
                >
                  <img src={generateAvatarUrl(style.id, 'preview', currentUser)} alt={style.name} />
                  <div className="style-info">
                    <strong>{style.name}</strong>
                    <small>{style.description}</small>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button className="back-button" onClick={() => setSelectedStyle(null)}>
              ← Back to styles
            </button>
            <p>Choose a variation:</p>
            <div className="avatar-grid">
              {seeds.map((seed) => {
                const url = generateAvatarUrl(selectedStyle, seed, currentUser);
                return (
                  <button
                    key={seed}
                    className={`avatar-option ${currentAvatar === url ? 'selected' : ''}`}
                    onClick={() => onSelect(url)}
                  >
                    <img src={url} alt={`Avatar ${seed}`} />
                  </button>
                );
              })}
            </div>
          </>
        )}
        <button className="cancel-button" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

AvatarPicker.propTypes = {
  currentUser: PropTypes.string,
  currentAvatar: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AvatarPicker;
