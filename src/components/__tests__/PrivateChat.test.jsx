/* global test, expect, vi */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrivateChat from '../chat/PrivateChat';

test('sends message when clicking send', async () => {
  const user = userEvent.setup();
  const onSendMessage = vi.fn().mockResolvedValue(undefined);

  render(
    <PrivateChat
      currentUser={'alice'}
      otherUser={'bob'}
      privateMessages={[]}
      bannedWords={[]}
      onSendMessage={onSendMessage}
      isLoading={false}
    />
  );

  const input = screen.getByPlaceholderText(/Type your message/i);
  await user.type(input, 'Hello Bob');
  await user.keyboard('{Enter}');

  expect(onSendMessage).toHaveBeenCalledTimes(1);
  expect(onSendMessage).toHaveBeenCalledWith('Hello Bob');
});