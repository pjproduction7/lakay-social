import React from 'react';
import PropTypes from 'prop-types';
import Modal from './shared/Modal';

export default function ProfileView({
  u,
  isMe,
  p,
  editBio,
  onEditBioChange,
  editDisplayName,
  onEditDisplayNameChange,
  editLocation,
  onEditLocationChange,
  isUploadingPhotos,
  handleProfilePhotoUpload,
  PHOTO_FILTERS,
  selectedFilterStyle,
  setSelectedFilterStyle,
  MAX_PROFILE_PHOTOS,
  FILTER_LABEL_LOOKUP,
  pendingDelete,
  openDeleteModal,
  deleteModalOpen,
  closeDeleteModal,
  confirmDelete,
  deleteLoading,
  handleSetPrimaryPhoto,
  onSaveProfile,
  onChangePassword,
  onMessage,
}) {
  return (
    <div className={`${/* cardBg is passed by parent wrapper */ ''}`}> 
      <div className="rounded-xl p-5 shadow">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-3xl">
            {p.photoDataUrl ? (
              <img src={p.photoDataUrl} alt="profile" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              '👤'
            )}
          </div>

          <div className="flex-1">
            <div className="text-xl font-bold text-gray-900">{p.displayName || u}</div>
            <div className="text-sm text-gray-600">@{u}</div>
            <div className="text-sm text-gray-600 mt-1">{p.location || 'No location set'}</div>
          </div>
        </div>

        {isMe && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="font-bold text-gray-900">Photo Gallery</div>
              <div className="text-sm text-gray-600">{(p.photos?.length || 0)} / {MAX_PROFILE_PHOTOS} photos</div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className={`px-4 py-2 rounded-lg font-semibold text-white cursor-pointer ${isUploadingPhotos ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {isUploadingPhotos ? 'Uploading...' : 'Upload Photos'}
                <input type="file" accept="image/*" multiple className="hidden" disabled={isUploadingPhotos} onChange={(e) => handleProfilePhotoUpload(e.target.files)} />
              </label>
              <div className="text-sm text-gray-600">Supports JPG, PNG, WEBP. Maximum {MAX_PROFILE_PHOTOS} photos.</div>
              <div className="text-xs text-gray-500">Tip: Hold Ctrl (or Command on Mac) to select multiple photos at once.</div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="font-bold text-gray-900 mb-2">Bio</div>
          {isMe ? (
            <textarea className="w-full p-3 rounded-lg border-2 text-gray-900" rows={3} value={editBio} onChange={(e) => onEditBioChange(e.target.value)} placeholder="Tell me about you..." />
          ) : (
            <div className="text-gray-800 bg-gray-100 p-3 rounded-lg">{p.bio || 'No bio yet.'}</div>
          )}
        </div>

        <div className="mt-6">
          <div className="font-bold text-gray-900 mb-2">Photo Gallery</div>
          {p.photos?.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {p.photos.map((photo) => {
                const isPending = pendingDelete?.photoId === photo.id;
                return (
                  <div key={photo.id} className={`rounded-xl border border-gray-200 p-3 relative transition-all duration-300 ${isPending ? 'opacity-40 scale-95 blur-sm pointer-events-none' : 'opacity-100'}`}>
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img src={photo.photo_url} alt="Profile" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-700">
                      <span>{FILTER_LABEL_LOOKUP[photo.filter_style] || 'Original'}</span>
                      {photo.is_primary && <span className="text-green-600 font-semibold">Primary</span>}
                    </div>

                    {isPending && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/90 p-2 rounded-md text-sm font-semibold">Deleting...</div>
                      </div>
                    )}

                    {isMe && !isPending && (
                      <div className="flex gap-2 mt-3">
                        {!photo.is_primary && (
                          <button onClick={() => handleSetPrimaryPhoto(photo.id)} className="flex-1 rounded-lg border border-blue-600 text-blue-600 px-3 py-1 text-sm hover:bg-blue-50">Make Primary</button>
                        )}
                        <button onClick={() => openDeleteModal(photo.id)} className="flex-1 rounded-lg border border-red-500 text-red-500 px-3 py-1 text-sm hover:bg-red-50">Remove</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-gray-600 bg-gray-100 rounded-lg p-4">No photos yet.</div>
          )}

          <Modal isOpen={deleteModalOpen} onClose={closeDeleteModal} title="Delete Photo">
            <p className="text-sm text-gray-700 mb-4">Are you sure you want to delete this photo? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={closeDeleteModal} className="px-4 py-2 rounded-lg border">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-red-500 text-white flex items-center gap-2" disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Delete'}</button>
            </div>
          </Modal>

          {isMe && (
            <>
              <div className="mt-4">
                <div className="font-bold text-gray-900 mb-2">Display Name</div>
                <input className="w-full p-3 rounded-lg border-2 text-gray-900" value={editDisplayName} onChange={(e) => onEditDisplayNameChange(e.target.value)} placeholder="Your display name" />
              </div>
              <div className="mt-4">
                <div className="font-bold text-gray-900 mb-2">Location</div>
                <input className="w-full p-3 rounded-lg border-2 text-gray-900" value={editLocation} onChange={(e) => onEditLocationChange(e.target.value)} placeholder="City / Country" />
              </div>
              <button onClick={onSaveProfile} className="mt-4 w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700">Save Profile</button>
              <button onClick={onChangePassword} className="mt-3 w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700">Change Password</button>
            </>
          )}

          {!isMe && (
            <div className="mt-4">
              <button onClick={onMessage} className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700">Send Message</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

ProfileView.propTypes = {
  u: PropTypes.string.isRequired,
  isMe: PropTypes.bool,
  p: PropTypes.object.isRequired,
  editBio: PropTypes.string,
  onEditBioChange: PropTypes.func,
  editDisplayName: PropTypes.string,
  onEditDisplayNameChange: PropTypes.func,
  editLocation: PropTypes.string,
  onEditLocationChange: PropTypes.func,
  isUploadingPhotos: PropTypes.bool,
  handleProfilePhotoUpload: PropTypes.func.isRequired,
  PHOTO_FILTERS: PropTypes.array,
  selectedFilterStyle: PropTypes.string,
  setSelectedFilterStyle: PropTypes.func,
  MAX_PROFILE_PHOTOS: PropTypes.number,
  FILTER_LABEL_LOOKUP: PropTypes.object,
  pendingDelete: PropTypes.object,
  openDeleteModal: PropTypes.func,
  deleteModalOpen: PropTypes.bool,
  closeDeleteModal: PropTypes.func,
  confirmDelete: PropTypes.func,
  deleteLoading: PropTypes.bool,
  handleSetPrimaryPhoto: PropTypes.func,
  onSaveProfile: PropTypes.func,
  onChangePassword: PropTypes.func,
  onMessage: PropTypes.func,
};
