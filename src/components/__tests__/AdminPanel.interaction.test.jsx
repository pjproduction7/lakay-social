/* global test, expect, vi */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminPanel from '../admin/AdminPanel';
import * as authService from '../../services/auth';

vi.mock('../../services/auth', () => ({
  assignUserRole: vi.fn(),
  removeUserRole: vi.fn(),
}));

test('banning a user calls setBannedUsers and pushNotif', async () => {
  const user = userEvent.setup();
  const setBannedUsers = vi.fn();
  const pushNotif = vi.fn();
  const refreshUsers = vi.fn();

  const mockAssign = vi.spyOn(authService, 'assignUserRole').mockResolvedValue();

  render(
    <AdminPanel
      currentUser={'admin'}
      isAdmin={true}
      allUsers={['admin','bob']}
      adminUsers={[]}
      userRoles={{}}
      adminStats={{ totalUsers: 2, totalPosts: 0, totalMessages: 0 }}
      adminLogs={{ recentUsers: [], recentRoleChanges: [] }}
      bannedUsers={[]}
      setBannedUsers={setBannedUsers}
      shadowBannedUsers={[]}
      setShadowBannedUsers={() => {}}
      moderators={[]}
      setModerators={() => {}}
      setMessages={() => {}}
      refreshUsers={refreshUsers}
      refreshAdminData={() => {}}
      onClose={() => {}}
      pushNotif={pushNotif}
    />
  );

  // Find the Ban button for user 'bob'
  const banButton = screen.getByRole('button', { name: /🚫 Ban/i });
  await user.click(banButton);

  expect(mockAssign).toHaveBeenCalledWith('bob', 'banned');
  expect(setBannedUsers).toHaveBeenCalled();
  expect(pushNotif).toHaveBeenCalledWith('🚫 Banned bob');
});