/* global test, expect, vi */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Music from '../Music';

test('clicking like and dislike calls handlers', async () => {
  const user = userEvent.setup();
  const onUpload = vi.fn();
  const onToggleSave = vi.fn();
  const onLike = vi.fn();
  const onDislike = vi.fn();
  const openProfile = vi.fn();
  const onDelete = vi.fn();

  const tracks = [{ id: 1, title: 'Song', artist: 'Alice', likes: 0, dislikes: 0, audioUrl: null }];

  render(<Music tracks={tracks} onUpload={onUpload} onToggleSave={onToggleSave} onLike={onLike} onDislike={onDislike} openProfile={openProfile} onDelete={onDelete} currentUser="Alice" />);

  const zeros = screen.getAllByText(/0/);
  // first zero is like, second is dislike
  await user.click(zeros[0]);
  expect(onLike).toHaveBeenCalledWith(1);

  await user.click(zeros[1]);
  expect(onDislike).toHaveBeenCalledWith(1);
});