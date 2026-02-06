import React from 'react';
import PropTypes from 'prop-types';

export default function GamesMenu({ onSelectGame }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {['snake', 'memory', 'tictactoe'].map((game) => (
        <button
          key={game}
          onClick={() => onSelectGame(game)}
          className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl p-8 shadow-lg hover:scale-105 transition"
        >
          <div className="text-6xl mb-3">
            {game === 'snake' ? '🐍' : game === 'memory' ? '🧠' : '⭕'}
          </div>
          <div className="font-bold text-lg">
            {game === 'snake' ? 'Snake' : game === 'memory' ? 'Memory' : 'Tic Tac Toe'}
          </div>
        </button>
      ))}
    </div>
  );
}

GamesMenu.propTypes = {
  onSelectGame: PropTypes.func.isRequired,
};