import React from 'react';
import PropTypes from 'prop-types';
import { Bookmark, ThumbsUp, Trash2 } from 'lucide-react';

export default function Music({ tracks, onUpload, onToggleSave, onLike, onDislike, onDelete, openProfile, currentUser }) {
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={onUpload} className="bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-pink-700">
          Upload Music
        </button>
      </div>

      {tracks.map((track) => (
        <div key={track.id} className="rounded-xl p-4 mb-4 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center text-3xl">🎵</div>
            <div className="flex-1">
              <h3 className="font-bold text-lg glow-title">{track.title}</h3>
              <p className="text-sm text-blue-600 cursor-pointer hover:underline" onClick={() => openProfile(track.artist)}>by {track.artist}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onToggleSave(`music:${track.id}`)} title="Save">
                <Bookmark className="text-gray-600 hover:text-black" />
              </button>
              {track.artist === currentUser && (
                <button onClick={() => onDelete(track.id)} title="Delete" className="text-red-600 hover:text-red-800">
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>

          {track.audioUrl && (
            <div className="mb-3">
              <audio controls className="w-full">
                <source src={track.audioUrl} type="audio/mpeg" />
                Your browser does not support audio playback.
              </audio>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => onLike(track.id)} className="flex-1 bg-green-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600">
              <ThumbsUp size={18} /> {track.likes}
            </button>
            <button onClick={() => onDislike(track.id)} className="flex-1 bg-red-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-red-600">
              <ThumbsUp size={18} className="rotate-180" /> {track.dislikes}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

Music.propTypes = {
  tracks: PropTypes.array.isRequired,
  onUpload: PropTypes.func.isRequired,
  onToggleSave: PropTypes.func.isRequired,
  onLike: PropTypes.func.isRequired,
  onDislike: PropTypes.func.isRequired,
  openProfile: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  currentUser: PropTypes.string.isRequired,
};
