/* global test, expect, vi */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminPanel from '../admin/AdminPanel';
import * as authService from '../../services/auth';

test('quick create user calls adminCreateUser and refreshes users', async () => {
  const user = userEvent.setup();
  const pushNotif = vi.fn();
  const refreshUsers = vi.fn();

  const mockCreate = vi.spyOn(authService, 'adminCreateUser').mockResolvedValue({ user: { id: 1, username: 'newuser' }});

  render(
    <AdminPanel
      currentUser={'admin'}
      isAdmin={true}
      allUsers={['admin']}
      bannedUsers={[]}
      setBannedUsers={() => {}}
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

  const username = screen.getByPlaceholderText(/Username/i);
  const createBtn = screen.getByRole('button', { name: /Create User/i });

  await user.type(username, 'newuser');
  await user.click(createBtn);

  expect(mockCreate).toHaveBeenCalled();
  expect(refreshUsers).toHaveBeenCalled();
  expect(pushNotif).toHaveBeenCalled();

  mockCreate.mockRestore();
});