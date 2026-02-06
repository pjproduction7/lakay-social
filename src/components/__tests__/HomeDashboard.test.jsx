/* global test, expect, vi */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomeDashboard from '../HomeDashboard';

test('clicking Memorials calls setScreen with memorials', async () => {
  const user = userEvent.setup();
  const setScreen = vi.fn();
  const pushNotif = vi.fn();

  render(
    <HomeDashboard
      darkMode={true}
      setDarkMode={() => {}}
      language={'en'}
      setLanguage={() => {}}
      showPhoneModal={false}
      setShowPhoneModal={() => {}}
      notifications={[]}
      getTotalUnreadCount={() => 0}
      setScreen={setScreen}
      openProfile={() => {}}
      currentUser={'alice'}
      isAdmin={false}
      ADMIN_PANEL_ENABLED={true}
      pushNotif={pushNotif}
      handleLogout={() => {}}
      setShowAdminPanel={() => {}}
    />
  );

  const memorialBtn = screen.getByText(/Memorials/i);
  await user.click(memorialBtn);
  expect(setScreen).toHaveBeenCalledWith('memorials');
});