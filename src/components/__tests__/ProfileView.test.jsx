/* global test, expect */
import React from 'react';
import { render, screen } from '@testing-library/react';
import ProfileView from '../ProfileView';

test('renders profile heading', () => {
  const p = { displayName: 'Alice', photos: [] };
  render(<ProfileView u={'alice'} isMe={true} p={p} editBio={""} onEditBioChange={() => {}} editDisplayName={"Alice"} onEditDisplayNameChange={() => {}} editLocation={""} onEditLocationChange={() => {}} isUploadingPhotos={false} handleProfilePhotoUpload={() => {}} PHOTO_FILTERS={[]} selectedFilterStyle={'original'} setSelectedFilterStyle={() => {}} MAX_PROFILE_PHOTOS={5} FILTER_LABEL_LOOKUP={{}} pendingDelete={null} openDeleteModal={() => {}} deleteModalOpen={false} closeDeleteModal={() => {}} confirmDelete={() => {}} deleteLoading={false} handleSetPrimaryPhoto={() => {}} onSaveProfile={() => {}} onChangePassword={() => {}} onMessage={() => {}} />);
  expect(screen.getByText(/Display Name/i)).toBeInTheDocument();
});