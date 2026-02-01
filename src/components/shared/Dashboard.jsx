import React from 'react';
import { Users, MessageSquare, Music, Gamepad2 } from 'lucide-react';

export default function Dashboard({ stats }) {
  const { totalUsers, totalPosts, totalMessages, totalMusic } = stats;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard icon={<Users size={32} />} label="Users" value={totalUsers} color="bg-blue-600" />
      <StatCard icon={<MessageSquare size={32} />} label="Posts" value={totalPosts} color="bg-green-600" />
      <StatCard icon={<MessageSquare size={32} />} label="Messages" value={totalMessages} color="bg-purple-600" />
      <StatCard icon={<Music size={32} />} label="Music" value={totalMusic} color="bg-pink-600" />
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`${color} rounded-xl p-4 shadow-lg text-white`}>
      <div className="mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}