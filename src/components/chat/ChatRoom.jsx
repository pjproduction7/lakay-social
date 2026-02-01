import React, { useState, useEffect, useRef } from "react";

export default function ChatRoom({ currentUser, isAdmin }) {
  const [room, setRoom] = useState("Haiti");
  const [messages, setMessages] = useState({
    Haiti: [{ user: "Admin", text: "Welcome to the Haiti chat! 🇭🇹", timestamp: Date.now() }],
    Diaspora: [{ user: "Admin", text: "Chat with Haitians around the world! 🌍", timestamp: Date.now() }],
    Gaming: [{ user: "Admin", text: "Let's talk games 🎮", timestamp: Date.now() }],
  });
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('chatroom_messages');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.log("Could not load saved messages");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chatroom_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, room]);

  const sendMessage = () => {
    if (input.trim() === "") return;
    
    const senderName = currentUser?.username || currentUser || "Guest";
    
    const newMsg = { 
      user: senderName, 
      text: input,
      timestamp: Date.now()
    };
    
    setMessages((prev) => ({
      ...prev,
      [room]: [...(prev[room] || []), newMsg],
    }));
    setInput("");
  };

  const clearRoomMessages = () => {
    if (!isAdmin) return;
    if (window.confirm(`Clear all messages in ${room}?`)) {
      setMessages(prev => ({
        ...prev,
        [room]: [{ user: "Admin", text: `${room} chat has been cleared by admin.`, timestamp: Date.now() }]
      }));
    }
  };

  const roomColors = {
    Haiti: "from-blue-600 to-red-600",
    Diaspora: "from-green-600 to-teal-600",
    Gaming: "from-purple-600 to-pink-600",
  };

  return (
    <div className={`bg-gradient-to-br ${roomColors[room]} shadow-2xl rounded-2xl p-4 md:p-6 max-w-4xl mx-auto relative transition-all duration-500`}>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-black text-white italic">#{room}</h2>
          {isAdmin && (
            <button
              onClick={clearRoomMessages}
              className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-full font-bold"
              title="Clear all messages (Admin only)"
            >
              🗑️ Clear
            </button>
          )}
        </div>
        
        <select
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          className="bg-white/20 backdrop-blur text-white font-bold border-2 border-white/50 rounded-xl px-2 py-2 cursor-pointer outline-none text-sm"
        >
          <option value="Haiti" className="text-gray-900">🇭🇹 Haiti</option>
          <option value="Diaspora" className="text-gray-900">🌍 Diaspora</option>
          <option value="Gaming" className="text-gray-900">🎮 Gaming</option>
        </select>
      </div>
      
      {/* Messages */}
      <div className="h-96 overflow-y-auto rounded-xl p-4 mb-4 shadow-inner bg-white/95 backdrop-blur">
        {(messages[room] || []).map((msg, index) => (
          <div key={index} className="mb-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-xs uppercase border-2 border-blue-500">
                {msg.user[0]}
              </div>
              <div className="flex-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <p className="font-bold text-blue-600 text-xs">{msg.user}</p>
                <p className="text-gray-800 text-sm leading-relaxed">{msg.text}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 bg-white border-2 border-white/50 rounded-xl px-4 py-3 text-gray-900 font-semibold focus:outline-none shadow-lg placeholder:text-gray-400"
          placeholder={`Write to ${room}...`}
        />
        <button
          onClick={sendMessage}
          className="bg-white text-blue-600 font-black px-6 py-3 rounded-xl hover:bg-blue-50 transition-all shadow-lg active:scale-95"
        >
          🚀
        </button>
      </div>
    </div>
  );
}