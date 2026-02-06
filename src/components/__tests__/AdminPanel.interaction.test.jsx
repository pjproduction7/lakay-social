/* global test, expect, vi */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminPanel from '../admin/AdminPanel';

test('banning a user calls setBannedUsers and pushNotif', async () => {
  const user = userEvent.setup();
  const setBannedUsers = vi.fn();
  const pushNotif = vi.fn();
  const refreshUsers = vi.fn();

  render(
    <AdminPanel
      currentUser={'admin'}
      isAdmin={true}
      allUsers={['admin','bob']}
      bannedUsers={[]}
      setBannedUsers={setBannedUsers}
      shadowBannedUsers={[]}
      setShadowBannedUsers={() => {}}
      moderators={[]}
      setModerators={() => {}}
      setMessages={() => {}}
      refreshUsers={refreshUsers}
      onClose={() => {}}
      pushNotif={pushNotif}
    />
  );

  // Find the Ban button for user 'bob'
  const banButton = screen.getByRole('button', { name: /🚫 Ban/i });
  await user.click(banButton);

  expect(setBannedUsers).toHaveBeenCalled();
  expect(pushNotif).toHaveBeenCalled();
});