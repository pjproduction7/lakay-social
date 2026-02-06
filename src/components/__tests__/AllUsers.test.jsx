/* global test, expect, vi */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AllUsers from '../AllUsers';

test('renders users and triggers message flow', async () => {
  const user = userEvent.setup();
  const openProfile = vi.fn();
  const setFollowing = vi.fn();
  const setCurrentChatUser = vi.fn();
  const setScreen = vi.fn();

  const users = ['alice', 'bob'];
  const posts = [{ id: 1, user: 'alice' }];
  const following = {};

  render(
    <AllUsers
      allUsers={users}
      posts={posts}
      currentUser={'alice'}
      following={following}
      setFollowing={setFollowing}
      openProfile={openProfile}
      setCurrentChatUser={setCurrentChatUser}
      setScreen={setScreen}
      cardBg={'bg-white'}
    />
  );

  const viewBtn = screen.getAllByText(/View Profile/i)[0];
  await user.click(viewBtn);
  expect(openProfile).toHaveBeenCalledWith('alice');

  // The current user should not have a Message button, so the available Message button belongs to 'bob'
  const msgBtn = screen.getByText(/Message/i);
  await user.click(msgBtn);
  expect(setCurrentChatUser).toHaveBeenCalledWith('bob');
  expect(setScreen).toHaveBeenCalledWith('privateMessages');
});