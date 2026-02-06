/* global test, expect, vi */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileView from '../ProfileView';

test('clicking Save Profile calls onSaveProfile', async () => {
  const user = userEvent.setup();
  const onSaveProfile = vi.fn();

  const p = { displayName: 'Alice', photos: [] };

  render(
    <ProfileView
      u={'alice'}
      isMe={true}
      p={p}
      editBio={""}
      onEditBioChange={() => {}}
      editDisplayName={"Alice"}
      onEditDisplayNameChange={() => {}}
      editLocation={""}
      onEditLocationChange={() => {}}
      isUploadingPhotos={false}
      handleProfilePhotoUpload={() => {}}
      PHOTO_FILTERS={[]}
      aiFiltersEnabled={false}
      selectedFilterStyle={'original'}
      setSelectedFilterStyle={() => {}}
      MAX_PROFILE_PHOTOS={5}
      FILTER_LABEL_LOOKUP={{}}
      pendingDelete={null}
      openDeleteModal={() => {}}
      deleteModalOpen={false}
      closeDeleteModal={() => {}}
      confirmDelete={() => {}}
      deleteLoading={false}
      handleSetPrimaryPhoto={() => {}}
      onSaveProfile={onSaveProfile}
      onChangePassword={() => {}}
      onMessage={() => {}}
    />
  );

  const saveBtn = screen.getByText(/Save Profile/i);
  await user.click(saveBtn);

  expect(onSaveProfile).toHaveBeenCalledTimes(1);
});