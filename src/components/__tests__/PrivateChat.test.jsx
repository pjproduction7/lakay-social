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

test('prevents duplicate sends when triggered quickly', async () => {
  const user = userEvent.setup();
  let resolveSend;
  const sendPromise = new Promise((r) => (resolveSend = r));
  const onSendMessage = vi.fn().mockImplementation(() => sendPromise);

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
  await user.type(input, 'Ping');
  const sendButton = screen.getByRole('button');

  // Trigger Enter and click almost simultaneously
  const p1 = user.keyboard('{Enter}');
  const p2 = user.click(sendButton);
  await Promise.all([p1, p2]);

  // Ensure the handler started only once
  expect(onSendMessage).toHaveBeenCalledTimes(1);
  expect(onSendMessage).toHaveBeenCalledWith('Ping');

  // Finish the pending send
  resolveSend();
  await sendPromise;

  // Still only one call
  expect(onSendMessage).toHaveBeenCalledTimes(1);
});