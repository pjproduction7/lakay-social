import React from 'react';
import PropTypes from 'prop-types';

export default function Classmates({
  schools,
  showAddSchool,
  setShowAddSchool,
  newSchoolName,
  setNewSchoolName,
  newSchoolCity,
  setNewSchoolCity,
  newSchoolDepartment,
  setNewSchoolDepartment,
  selectedSchoolId,
  setSelectedSchoolId,
  classmateName,
  setClassmateName,
  classmateYear,
  setClassmateYear,
  classmateMessage,
  setClassmateMessage,
  handleAddSchool,
  handleCreateClassmatePost,
  classmatesPosts,
  replyTexts,
  setReplyTexts,
  handleReplyToPost,
}) {
  return (
    <div>
      <div className="bg-white rounded-xl p-4 shadow-lg mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="font-bold text-gray-900">Choose a school</div>
          <button onClick={() => setShowAddSchool(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold text-sm flex items-center gap-2">➕ Add School</button>
        </div>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {schools.map((s) => (
            <button key={s.id} onClick={() => setSelectedSchoolId(s.id)} className={`w-full p-3 rounded-lg border-2 text-left transition ${selectedSchoolId === s.id ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
              <div className="font-bold text-gray-900">{s.name}</div>
              <div className="text-sm text-gray-600">{s.city} • {s.department}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow mb-4">
        <div className="font-bold text-gray-900 mb-2">Post a classmate request</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
          <input value={classmateName} onChange={(e) => setClassmateName(e.target.value)} className="p-3 rounded-lg border-2 text-gray-900" placeholder="Classmate name (required)" />
          <input value={classmateYear} onChange={(e) => setClassmateYear(e.target.value)} className="p-3 rounded-lg border-2 text-gray-900" placeholder="Year (e.g., 2012)" />
          <button onClick={handleCreateClassmatePost} className="bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold">Post</button>
        </div>
        <textarea value={classmateMessage} onChange={(e) => setClassmateMessage(e.target.value)} className="w-full p-3 rounded-lg border-2 text-gray-900" rows={3} placeholder="Message (optional)" />
      </div>

      <div className="bg-white rounded-xl p-4 shadow">
        <div className="font-bold text-gray-900 text-lg mb-3">Requests ({classmatesPosts.length})</div>

        {classmatesPosts.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No requests yet. Be the first to post!</div>
        ) : (
          <div className="space-y-4">
            {classmatesPosts.map((p) => (
              <div key={p.id} className="border-2 border-gray-200 rounded-xl p-4">
                <div className="font-bold text-gray-900">{p.lookingFor}</div>
                <div className="text-sm text-gray-600">School: {p.schoolName}{p.year ? ` • Year: ${p.year}` : ""}</div>
                <div className="text-sm text-gray-600">Posted by {p.postedBy}</div>
                {p.message && <div className="mt-3 text-gray-900">{p.message}</div>}

                <div className="mt-4">
                  <div className="text-sm font-bold text-gray-900 mb-2">Replies ({p.replies.length})</div>

                  {p.replies.length === 0 ? (
                    <div className="text-sm text-gray-500">No replies yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {p.replies.map((r) => (
                        <div key={r.id} className="bg-gray-100 rounded-lg p-3">
                          <div className="text-sm font-bold text-gray-900">{r.by}</div>
                          <div className="text-sm text-gray-800">{r.text}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <input value={replyTexts[p.id] || ""} onChange={(e) => setReplyTexts(prev => ({ ...prev, [p.id]: e.target.value }))} className="flex-1 p-3 rounded-lg border-2 text-gray-900" placeholder="Write a reply..." onKeyDown={(e) => e.key === 'Enter' && handleReplyToPost(p.id)} />
                    <button onClick={() => handleReplyToPost(p.id)} className="px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold">Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add School Modal */}
      {showAddSchool && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">➕ Add New School</h3>
            <input value={newSchoolName} onChange={(e) => setNewSchoolName(e.target.value)} className="w-full p-3 rounded-lg border-2 text-gray-900 mb-3" placeholder="School Name (e.g., Lycée Toussaint Louverture)" />
            <input value={newSchoolCity} onChange={(e) => setNewSchoolCity(e.target.value)} className="w-full p-3 rounded-lg border-2 text-gray-900 mb-3" placeholder="City (e.g., Port-au-Prince)" />
            <select value={newSchoolDepartment} onChange={(e) => setNewSchoolDepartment(e.target.value)} className="w-full p-3 rounded-lg border-2 text-gray-900 mb-4">
              <option value="">Select Department</option>
              <option value="Artibonite">Artibonite</option>
              <option value="Centre">Centre</option>
              <option value="Grand'Anse">Grand&apos;Anse</option>
              <option value="Nippes">Nippes</option>
              <option value="Nord">Nord</option>
              <option value="Nord-Est">Nord-Est</option>
              <option value="Nord-Ouest">Nord-Ouest</option>
              <option value="Ouest">Ouest</option>
              <option value="Sud">Sud</option>
              <option value="Sud-Est">Sud-Est</option>
            </select>

            <div className="flex gap-2">
              <button onClick={handleAddSchool} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700">Add School</button>
              <button onClick={() => { setShowAddSchool(false); setNewSchoolName(''); setNewSchoolCity(''); setNewSchoolDepartment(''); }} className="flex-1 bg-gray-500 text-white font-bold py-3 rounded-lg hover:bg-gray-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Classmates.propTypes = {
  schools: PropTypes.array.isRequired,
  showAddSchool: PropTypes.bool,
  setShowAddSchool: PropTypes.func,
  newSchoolName: PropTypes.string,
  setNewSchoolName: PropTypes.func,
  newSchoolCity: PropTypes.string,
  setNewSchoolCity: PropTypes.func,
  newSchoolDepartment: PropTypes.string,
  setNewSchoolDepartment: PropTypes.func,
  selectedSchoolId: PropTypes.string,
  setSelectedSchoolId: PropTypes.func,
  classmateName: PropTypes.string,
  setClassmateName: PropTypes.func,
  classmateYear: PropTypes.string,
  setClassmateYear: PropTypes.func,
  classmateMessage: PropTypes.string,
  setClassmateMessage: PropTypes.func,
  handleAddSchool: PropTypes.func,
  handleCreateClassmatePost: PropTypes.func,
  classmatesPosts: PropTypes.array,
  replyTexts: PropTypes.object,
  setReplyTexts: PropTypes.func,
  handleReplyToPost: PropTypes.func,
};