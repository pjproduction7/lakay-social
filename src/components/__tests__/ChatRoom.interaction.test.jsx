/* global test, expect */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatRoom from '../chat/ChatRoom';

test('sending a message displays it in the chat', async () => {
  const user = userEvent.setup();

  render(<ChatRoom currentUser={'alice'} isAdmin={true} />);

  const input = screen.getByPlaceholderText(/Write to Haiti/i);
  await user.type(input, 'Hello everyone');
  const sendBtn = screen.getByRole('button', { name: /🚀/i });
  await user.click(sendBtn);

  expect(screen.getByText(/Hello everyone/i)).toBeInTheDocument();
});