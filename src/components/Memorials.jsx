import React from 'react';
import PropTypes from 'prop-types';

export default function Memorials({
  memorials,
  memorialPhoto,
  memorialNameRef,
  memorialYearsRef,
  memorialTributeRef,
  setMemorialPhoto,
  setMemorialFile,
  handleCreateMemorial,
  handleAddCondolence,
}) {
  return (
    <div>
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6 mb-4 shadow-lg">
        <h2 className="text-2xl font-bold mb-2">💐 Honor Their Memory</h2>
        <p className="text-sm">Create tributes for loved ones who have passed away.</p>
      </div>

      <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Create Memorial</h3>

        <input placeholder="Person's Full Name" ref={memorialNameRef} className="w-full p-3 border-2 rounded-lg mb-3 text-gray-900" />
        <input placeholder="Years (e.g., 1950-2023)" ref={memorialYearsRef} className="w-full p-3 border-2 rounded-lg mb-3 text-gray-900" />

        <div className="mb-3">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Upload Photo</label>
          <input type="file" accept="image/*" onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => setMemorialPhoto(reader.result);
              reader.readAsDataURL(file);
              setMemorialFile(file);
            }
          }} className="w-full p-2 border-2 rounded-lg" />
        </div>

        {memorialPhoto && (
          <div className="mb-3">
            <img src={memorialPhoto} alt="Preview" className="w-32 h-32 rounded-lg object-cover" loading="lazy" />
          </div>
        )}

        <textarea ref={memorialTributeRef} placeholder="Write a tribute..." className="w-full p-3 border-2 rounded-lg mb-3 text-gray-900" rows={6} />

        <button onClick={handleCreateMemorial} className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700">Create Memorial</button>
      </div>

      {memorials.map(memorial => (
        <div key={memorial.id} className="bg-white rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex gap-4 mb-4">
            {memorial.photo ? (
              <img src={memorial.photo} alt={memorial.name} className="w-24 h-24 rounded-full object-cover border-4 border-purple-500" loading="lazy" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl">💐</div>
            )}
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">{memorial.name}</h3>
              <p className="text-lg text-gray-600">{memorial.years}</p>
              <p className="text-sm text-gray-500">Posted by {memorial.author}</p>
            </div>
          </div>

          <p className="text-gray-800 whitespace-pre-wrap mb-4">{memorial.tribute}</p>

          <div className="border-t-2 pt-4">
            <h4 className="font-bold text-gray-900 mb-3">💬 Condolences ({(memorial.condolences || []).length})</h4>
            <div className="flex gap-2 mb-3">
              <input
                data-id-input={memorial.id}
                placeholder="Leave your condolences..."
                className="flex-1 p-3 border-2 rounded-lg text-gray-900"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    handleAddCondolence(memorial.id, e.target.value);
                    e.target.value = '';
                  }
                }}
              />
              <button
                onClick={() => {
                  const el = document.querySelector(`[data-id-input="${memorial.id}"]`);
                  if (el && el.value && el.value.trim()) {
                    handleAddCondolence(memorial.id, el.value);
                    el.value = '';
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
              >
                Post
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(memorial.condolences || []).map(cond => (
                <div key={cond.id} className="bg-purple-50 p-3 rounded-lg">
                  <div className="font-bold text-sm text-purple-700">{cond.author}</div>
                  <div className="text-sm text-gray-800">{cond.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

Memorials.propTypes = {
  memorials: PropTypes.array.isRequired,
  memorialPhoto: PropTypes.string,
  memorialNameRef: PropTypes.object,
  memorialYearsRef: PropTypes.object,
  memorialTributeRef: PropTypes.object,
  setMemorialPhoto: PropTypes.func.isRequired,
  setMemorialFile: PropTypes.func,
  handleCreateMemorial: PropTypes.func.isRequired,
  handleAddCondolence: PropTypes.func.isRequired,
};