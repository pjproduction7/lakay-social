import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';

export default function SnakeGame({ onGameOver }) {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [direction, setDirection] = useState("RIGHT");
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(300);
  const boardSize = 20;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
      }

      switch (e.key) {
        case "ArrowUp": if (direction !== "DOWN") setDirection("UP"); break;
        case "ArrowDown": if (direction !== "UP") setDirection("DOWN"); break;
        case "ArrowLeft": if (direction !== "RIGHT") setDirection("LEFT"); break;
        case "ArrowRight": if (direction !== "LEFT") setDirection("RIGHT"); break;
        case " ": setIsPaused(prev => !prev); break;
        default: break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [direction]);

  useEffect(() => {
    if (isPaused) return;

    const moveSnake = setInterval(() => {
      setSnake((prevSnake) => {
        const newHead = { ...prevSnake[0] };

        if (direction === "UP") newHead.y -= 1;
        if (direction === "DOWN") newHead.y += 1;
        if (direction === "LEFT") newHead.x -= 1;
        if (direction === "RIGHT") newHead.x += 1;

        if (newHead.x < 0 || newHead.x >= boardSize || newHead.y < 0 || newHead.y >= boardSize) {
          onGameOver(score);
          return prevSnake;
        }

        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          onGameOver(score);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setSpeed(s => Math.max(100, s * 0.98));
          let newFood;
          do {
            newFood = {
              x: Math.floor(Math.random() * boardSize),
              y: Math.floor(Math.random() * boardSize)
            };
          } while (newSnake.some(s => s.x === newFood.x && s.y === newFood.y));
          setFood(newFood);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, speed);

    return () => clearInterval(moveSnake);
  }, [direction, food, isPaused, onGameOver, score, speed]);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-white font-bold text-xl flex gap-4">
        <span>🍎 Score: {score}</span>
        <span>{isPaused ? "⏸️ PAUSED" : "🟢 PLAYING"}</span>
      </div>

      <div
        className="bg-gray-900 border-4 border-gray-700 rounded-lg relative shadow-2xl"
        style={{
          width: '300px',
          height: '300px',
          display: 'grid',
          gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
          gridTemplateRows: `repeat(${boardSize}, 1fr)`
        }}
      >
        {snake.map((segment, i) => (
          <div
            key={i}
            style={{
              gridColumnStart: segment.x + 1,
              gridRowStart: segment.y + 1,
            }}
            className={`${i === 0 ? 'bg-green-400 z-10 rounded-sm' : 'bg-green-600 rounded-sm'} w-full h-full border border-gray-900`}
          />
        ))}

        <div
          style={{
            gridColumnStart: food.x + 1,
            gridRowStart: food.y + 1,
          }}
          className="bg-red-500 w-full h-full rounded-full animate-pulse shadow-[0_0_10px_red] border-2 border-white"
        />
      </div>

      <div className="mt-6 flex gap-4">
        <div className="grid grid-cols-3 gap-2">
          <div />
          <button onMouseDown={() => direction !== "DOWN" && setDirection("UP")} className="bg-gray-700 p-4 rounded-lg text-white active:bg-gray-600">⬆️</button>
          <div />
          <button onMouseDown={() => direction !== "RIGHT" && setDirection("LEFT")} className="bg-gray-700 p-4 rounded-lg text-white active:bg-gray-600">⬅️</button>
          <button onClick={() => setIsPaused(!isPaused)} className="bg-yellow-600 p-4 rounded-lg text-white font-bold">{isPaused ? "▶️" : "⏸️"}</button>
          <button onMouseDown={() => direction !== "LEFT" && setDirection("RIGHT")} className="bg-gray-700 p-4 rounded-lg text-white active:bg-gray-600">➡️</button>
          <div />
          <button onMouseDown={() => direction !== "UP" && setDirection("DOWN")} className="bg-gray-700 p-4 rounded-lg text-white active:bg-gray-600">⬇️</button>
          <div />
        </div>
      </div>
      <p className="mt-4 text-white/70 text-sm">Use Arrow Keys or Buttons to move</p>
    </div>
  );
}

SnakeGame.propTypes = {
  onGameOver: PropTypes.func,
};