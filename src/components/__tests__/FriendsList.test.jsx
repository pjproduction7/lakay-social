/* global test, expect, vi */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FriendsList from '../FriendsList';

test('renders friends and triggers actions', async () => {
  const user = userEvent.setup();
  const openProfile = vi.fn();
  const setFollowing = vi.fn();
  const setCurrentChatUser = vi.fn();
  const setScreen = vi.fn();

  const otherUsers = ['bob'];
  const following = {};

  render(<FriendsList otherUsers={otherUsers} currentUser={'alice'} following={following} setFollowing={setFollowing} openProfile={openProfile} setScreen={setScreen} setCurrentChatUser={setCurrentChatUser} cardBg={'bg-white'} />);

  const viewBtn = screen.getByText(/View/i);
  await user.click(viewBtn);
  expect(openProfile).toHaveBeenCalledWith('bob');

  const followBtn = screen.getByText(/Follow/i);
  await user.click(followBtn);
  expect(setFollowing).toHaveBeenCalled();

  const msgBtn = screen.getByText(/Message/i);
  await user.click(msgBtn);
  expect(setCurrentChatUser).toHaveBeenCalledWith('bob');
  expect(setScreen).toHaveBeenCalledWith('privateMessages');
});