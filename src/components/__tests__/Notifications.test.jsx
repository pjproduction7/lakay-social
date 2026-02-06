/* global test, expect, vi */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Notifications from '../Notifications';

test('renders empty state and action button works', async () => {
  const user = userEvent.setup();
  const removeNotification = vi.fn();

  render(<Notifications notifications={[]} removeNotification={removeNotification} />);
  expect(screen.getByText(/No notifications yet/i)).toBeInTheDocument();

  // render with a notification that has action
  const notif = { id: Date.now().toString(), text: 'Photo deleted', actionLabel: 'Undo', action: vi.fn() };
  render(<Notifications notifications={[notif]} removeNotification={removeNotification} />);

  const actionBtn = screen.getByText(/Undo/i);
  await user.click(actionBtn);

  expect(notif.action).toHaveBeenCalled();
  expect(removeNotification).toHaveBeenCalledWith(notif.id);
});