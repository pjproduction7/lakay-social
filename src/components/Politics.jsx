import React, { useState } from 'react';
import PropTypes from 'prop-types';

export default function Politics({ politicalOpinions, handleVoteOpinion, handleCommentOpinion, handleLikeComment, BLACKLISTED_POLITICIANS, cardBg, currentUser }) {
  const [commentTexts, setCommentTexts] = useState({});

  return (
    <div>
      <div className="bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-xl p-6 mb-4 shadow-lg">
        <h2 className="text-2xl font-bold mb-2">🇭🇹 Voice Your Opinion</h2>
        <p className="text-sm">Share your views on the political future of Haiti. Your vote counts!</p>
      </div>

      <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 mb-6">
        <h3 className="font-bold text-red-900 mb-2">❌ Politicians Who Should Not Run Again</h3>
        <p className="text-sm text-red-800 mb-2">Based on 10+ years in office or failed leadership:</p>
        <div className="grid grid-cols-2 gap-2">
          {BLACKLISTED_POLITICIANS.map(name => (
            <div key={name} className="bg-white p-2 rounded text-sm text-gray-900">🚫 {name}</div>
          ))}
        </div>
      </div>

      {politicalOpinions.map(opinion => {
        const total = opinion.agree + opinion.disagree + opinion.neutral;
        const agreePercent = total > 0 ? Math.round((opinion.agree / total) * 100) : 0;
        const disagreePercent = total > 0 ? Math.round((opinion.disagree / total) * 100) : 0;
        const neutralPercent = total > 0 ? Math.round((opinion.neutral / total) * 100) : 0;
        const userVote = opinion.userVotes[currentUser];

        return (
          <div key={opinion.id} className={`${cardBg} rounded-xl p-6 mb-6 shadow-lg border-2 ${userVote ? 'border-blue-500' : 'border-transparent'}`}>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{opinion.question}</h3>
            <p className="text-sm text-gray-700 mb-4">{opinion.description}</p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <button onClick={() => handleVoteOpinion(opinion.id, 'agree')} className={`px-3 py-2 rounded ${userVote === 'agree' ? 'bg-green-600 text-white' : 'bg-white text-gray-900'} font-semibold`}>Agree ({opinion.agree})</button>
              <button onClick={() => handleVoteOpinion(opinion.id, 'neutral')} className={`px-3 py-2 rounded ${userVote === 'neutral' ? 'bg-yellow-400 text-white' : 'bg-white text-gray-900'} font-semibold`}>Neutral ({opinion.neutral})</button>
              <button onClick={() => handleVoteOpinion(opinion.id, 'disagree')} className={`px-3 py-2 rounded ${userVote === 'disagree' ? 'bg-red-600 text-white' : 'bg-white text-gray-900'} font-semibold`}>Disagree ({opinion.disagree})</button>
            </div>

            <div className="mb-4">
              <div className="font-bold mb-2">Comments ({opinion.comments.length})</div>
              {opinion.comments.map(c => (
                <div key={c.id} className="bg-white p-3 rounded mb-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm">{c.user}</div>
                    <div className="text-xs text-gray-500">{new Date(c.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="text-sm text-gray-700">{c.text}</div>
                  <div className="mt-2"><button onClick={() => handleLikeComment(opinion.id, c.id)} className="text-sm text-blue-600">Like ({c.likes || 0})</button></div>
                </div>
              ))}

              <div className="flex gap-2 mt-2">
                <input value={commentTexts[opinion.id] || ''} onChange={(e) => setCommentTexts(prev => ({ ...prev, [opinion.id]: e.target.value }))} placeholder="Write a comment..." className="flex-1 p-3 rounded border" />
                <button onClick={() => { handleCommentOpinion(opinion.id, commentTexts[opinion.id] || ''); setCommentTexts(prev => ({ ...prev, [opinion.id]: '' })); }} className="px-4 py-2 bg-blue-600 text-white rounded">Comment</button>
              </div>
            </div>

            <div className="text-xs text-gray-600">Stats: Agree {agreePercent}% • Neutral {neutralPercent}% • Disagree {disagreePercent}%</div>
          </div>
        );
      })}
    </div>
  );
}

Politics.propTypes = {
  politicalOpinions: PropTypes.array.isRequired,
  handleVoteOpinion: PropTypes.func.isRequired,
  handleCommentOpinion: PropTypes.func.isRequired,
  handleLikeComment: PropTypes.func.isRequired,
  BLACKLISTED_POLITICIANS: PropTypes.array.isRequired,
  cardBg: PropTypes.string,
  currentUser: PropTypes.string,
};