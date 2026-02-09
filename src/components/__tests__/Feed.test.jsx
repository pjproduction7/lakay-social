/* global test, expect */
import React from 'react';
import { render, screen } from '@testing-library/react';
import Feed from '../Feed';

test('renders create post header', () => {
  render(<Feed trans={{ createPostPlaceholder: "What's on your mind?" }} posts={[]} handleImageUpload={() => {}} handleCreatePost={() => {}} commentRefs={{ current: {} }} commentTexts={{}} handleAddComment={() => {}} openProfile={() => {}} currentUser={"alice"} isAdmin={false} toggleSave={() => {}} handleToggleLike={() => {}} handleReaction={() => {}} onEditPost={() => {}} onDeletePost={() => {}} />);
  expect(screen.getByText(/Create a Post/i)).toBeInTheDocument();
});