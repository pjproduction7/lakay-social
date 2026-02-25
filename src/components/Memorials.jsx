import React, { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';
import EmojiPicker from './shared/EmojiPicker';

export default function Memorials({
  memorials,
  memorialPhotos,
  memorialNameRef,
  memorialYearsRef,
  memorialTributeRef,
  setMemorialPhotos,
  setMemorialFiles,
  memorialTextColor,
  memorialFontFamily,
  onMemorialTextColorChange,
  onMemorialFontFamilyChange,
  handleCreateMemorial,
  handleAddCondolence,
  isAdmin,
  currentUser,
  onEditMemorial,
  onDeleteMemorial,
}) {
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const handleInsertEmoji = (emoji) => {
    const el = memorialTributeRef?.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = `${el.value.slice(0, start)}${emoji}${el.value.slice(end)}`;
    el.value = next;
    el.focus();
    const cursor = start + emoji.length;
    el.setSelectionRange(cursor, cursor);
  };
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
          <label className="block text-sm font-semibold text-gray-900 mb-2">Upload Photos</label>
          <input type="file" accept="image/*" multiple onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
              const readers = files.map((file) => new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(file);
              }));
              Promise.all(readers).then((results) => {
                setMemorialPhotos(results.filter(Boolean));
              });
              setMemorialFiles(files);
            } else {
              setMemorialPhotos([]);
              setMemorialFiles([]);
            }
          }} className="w-full p-2 border-2 rounded-lg" />
        </div>

        {Array.isArray(memorialPhotos) && memorialPhotos.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {memorialPhotos.map((photo, idx) => (
              <img key={idx} src={photo} alt={`Preview ${idx + 1}`} className="w-24 h-24 rounded-lg object-cover" loading="lazy" />
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-3">
          <label className="text-sm font-semibold text-gray-900">Text color</label>
          <input
            type="color"
            value={memorialTextColor}
            onChange={(e) => onMemorialTextColorChange(e.target.value)}
            className="h-10 w-12 rounded border-2 border-gray-300 bg-white"
          />
          <label className="text-sm font-semibold text-gray-900">Font</label>
          <select
            value={memorialFontFamily}
            onChange={(e) => onMemorialFontFamilyChange(e.target.value)}
            className="px-3 py-2 rounded-lg border-2 border-gray-300 text-gray-900 bg-white"
          >
            <option value="inherit">Default</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="'Trebuchet MS', sans-serif">Trebuchet</option>
            <option value="Verdana, sans-serif">Verdana</option>
            <option value="'Courier New', monospace">Courier</option>
            <option value="'Times New Roman', serif">Times</option>
          </select>
          <button
            type="button"
            onClick={() => setEmojiPickerOpen((prev) => !prev)}
            className="ml-auto bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700"
          >
            😀 Emoji
          </button>
        </div>

        {emojiPickerOpen && (
          <div className="mb-3">
            <EmojiPicker onSelect={handleInsertEmoji} />
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
            <div className="flex gap-2">
              {(currentUser === memorial.author) && (
                <button
                  onClick={() => {
                    const newName = prompt("Edit person's name:", memorial.name);
                    const newYears = prompt("Edit years (e.g., 1950-2023):", memorial.years);
                    const newTribute = prompt("Edit tribute:", memorial.tribute);
                    if (newName && newTribute && newName.trim() !== memorial.name || newYears !== memorial.years || newTribute.trim() !== memorial.tribute) {
                      onEditMemorial(memorial.id, newName.trim(), newYears?.trim() || "", newTribute.trim());
                    }
                  }}
                  className="text-purple-600 hover:text-purple-800 hover:scale-110 transition p-2"
                  title="Edit memorial"
                >
                  <Edit size={20} />
                </button>
              )}
              {(currentUser === memorial.author) && (
                <button
                  onClick={() => onDeleteMemorial(memorial.id)}
                  className="text-red-600 hover:text-red-800 hover:scale-110 transition p-2"
                  title="Delete memorial"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>

          <p
            className="text-gray-800 whitespace-pre-wrap mb-4"
            style={{ color: memorial.textColor || undefined, fontFamily: memorial.fontFamily || undefined }}
          >
            {memorial.tribute}
          </p>

          {Array.isArray(memorial.photos) && memorial.photos.length > 1 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-4">
              {memorial.photos.map((photo, idx) => (
                <img key={`${memorial.id}-${idx}`} src={photo} alt={`${memorial.name} photo ${idx + 1}`} className="w-full h-48 rounded-lg object-cover" loading="lazy" />
              ))}
            </div>
          )}

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
  memorialPhotos: PropTypes.array,
  memorialNameRef: PropTypes.object,
  memorialYearsRef: PropTypes.object,
  memorialTributeRef: PropTypes.object,
  setMemorialPhotos: PropTypes.func.isRequired,
  setMemorialFiles: PropTypes.func,
  memorialTextColor: PropTypes.string,
  memorialFontFamily: PropTypes.string,
  onMemorialTextColorChange: PropTypes.func,
  onMemorialFontFamilyChange: PropTypes.func,
  handleCreateMemorial: PropTypes.func.isRequired,
  handleAddCondolence: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool,
  currentUser: PropTypes.string,
  onEditMemorial: PropTypes.func.isRequired,
  onDeleteMemorial: PropTypes.func.isRequired,
};
