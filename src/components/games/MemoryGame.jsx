import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';

export default function MemoryGame({ onWin }) {
  const emojis = ["🇭🇹", "🥥", "🌴", "🎸", "⚽", "🎲", "🌶️", "🥁"];
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    const shuffled = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, id) => ({ id, emoji }));
    setCards(shuffled);
  }, []);

  const handleCardClick = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      if (cards[newFlipped[0]].emoji === cards[newFlipped[1]].emoji) {
        const newMatched = [...matched, ...newFlipped];
        setMatched(newMatched);
        setFlipped([]);
        if (newMatched.length === cards.length) onWin?.();
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  const resetGame = () => {
    setMatched([]);
    setFlipped([]);
    setMoves(0);
    setCards([...emojis, ...emojis].sort(() => Math.random() - 0.5).map((emoji, id) => ({ id, emoji })));
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-xl font-bold text-gray-900">Moves: {moves}</div>
      <div className="grid grid-cols-4 gap-3">
        {cards.map((card, i) => {
          const isFlipped = flipped.includes(i) || matched.includes(i);
          return (
            <button
              key={i}
              onClick={() => handleCardClick(i)}
              className={`w-16 h-20 text-3xl flex items-center justify-center rounded-xl shadow-md transition-all transform ${
                isFlipped ? "bg-white rotate-y-180" : "bg-gradient-to-br from-blue-600 to-purple-600"
              }`}
            >
              {isFlipped ? card.emoji : "❓"}
            </button>
          );
        })}
      </div>
      <button
        onClick={resetGame}
        className="mt-6 bg-green-600 text-white px-6 py-2 rounded-lg font-bold"
      >
        Restart 🔄
      </button>
    </div>
  );
}

MemoryGame.propTypes = {
  onWin: PropTypes.func,
};