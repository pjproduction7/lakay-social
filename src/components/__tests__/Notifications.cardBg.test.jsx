/* global test, expect */
import React from 'react';
import { render, screen } from '@testing-library/react';
import Notifications from '../Notifications';

test('applies cardBg when provided', () => {
  const notifs = [{ id: Date.now().toString(), text: 'Hello' }];
  render(<Notifications notifications={notifs} removeNotification={() => {}} cardBg={'bg-gray-800/60'} />);
  const heading = screen.getByText(/Recent Notifications/i);
  const container = heading.closest('.rounded-xl');
  expect(container).toHaveClass('bg-gray-800/60');
});