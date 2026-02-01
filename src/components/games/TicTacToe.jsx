import React, { useState } from "react";

export default function TicTacToeGame({ onGameOver }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);

  function calculateWinner(squares) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  }

  const winner = calculateWinner(board);

  const handleClick = (i) => {
    if (board[i] || winner) return;
    const newBoard = [...board];
    newBoard[i] = isXNext ? "X" : "O";
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 text-2xl font-bold text-gray-900">
        {winner ? (
          <span className="text-green-600">🎉 Winner: {winner}!</span>
        ) : board.every(Boolean) ? (
          <span className="text-orange-600">🤝 It's a Draw!</span>
        ) : (
          <span>Player Turn: <span className={isXNext ? "text-blue-600" : "text-red-600"}>{isXNext ? "X" : "O"}</span></span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 bg-gray-800 p-3 rounded-xl shadow-2xl">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className={`w-24 h-24 text-5xl font-bold rounded-lg transition-all ${
              cell === "X" ? "bg-blue-100 text-blue-600" : cell === "O" ? "bg-red-100 text-red-600" : "bg-white hover:bg-gray-200"
            }`}
          >
            {cell}
          </button>
        ))}
      </div>

      <button onClick={resetGame} className="mt-6 bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition shadow-lg">
        Restart Game 🔄
      </button>
    </div>
  );
}