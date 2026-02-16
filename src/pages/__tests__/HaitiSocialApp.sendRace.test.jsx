import React from 'react';
import { render, screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mocks
let triggerPrivateMessage = null;
vi.mock('../../hooks/useChatSocket', () => ({
  default: ({ onPrivateMessage }) => {
    triggerPrivateMessage = onPrivateMessage;
    return {
      sendMessage: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      isConnected: false,
    };
  },
}));

const sendPromiseControls = {};
vi.mock('../../services/messages', () => ({
  fetchAllPrivateMessages: vi.fn().mockResolvedValue([]),
  sendPrivateMessage: vi.fn().mockImplementation(() => {
    return new Promise((resolve) => {
      sendPromiseControls.resolve = resolve;
    });
  }),
}));

vi.mock('../../services/feed', () => ({ fetchPosts: vi.fn().mockResolvedValue([]), createPost: vi.fn(), toggleLike: vi.fn(), reactToPost: vi.fn(), addComment: vi.fn() }));
vi.mock('../../services/auth', () => ({ login: vi.fn(), signup: vi.fn(), logout: vi.fn(), getSession: vi.fn().mockReturnValue({ username: 'alice', token: 'tok' }), getAllUsers: vi.fn().mockResolvedValue(['bob']), getUser: vi.fn().mockResolvedValue({ username: 'alice', display_name: 'Alice' }), updateUserProfile: vi.fn() }));
vi.mock('../../services/profilePhotos', () => ({ uploadProfilePhotos: vi.fn(), setPrimaryProfilePhoto: vi.fn(), deleteProfilePhoto: vi.fn() }));

import HaitiSocialApp from '../HaitiSocialApp';

test('app-level: no duplicate when realtime arrives during send', async () => {
  // Put a logged-in session in localStorage so the app auto-logs in
  localStorage.setItem('lakay_session', JSON.stringify({ username: 'alice', token: 'tok' }));
  // Accept the policy so the onboarding modal doesn't block the app in tests
  localStorage.setItem('lakay_social_v1', JSON.stringify({ policyAccepted: true }));

  const user = userEvent.setup();
  render(<HaitiSocialApp />);

  // Wait for app to navigate to home
  await waitFor(() => expect(screen.queryByText(/Messages|Messages/)).toBeTruthy());

  // Open Messages panel
  const messagesNav = screen.getByText(/Messages/i);
  await user.click(messagesNav);

  // Click Message button for 'bob' (AllUsers should be visible)
  // target the "Send private message" label which uniquely identifies the user card
  const msgBtn = await screen.findByText(/Send private message/i);
  await user.click(msgBtn);

  // Private chat input should appear
  const input = await screen.findByPlaceholderText(/Type your message/i);
  await user.type(input, 'Ping');

  // Trigger send (this returns a promise we control)
  const sendBtn = within(input.parentElement).getByRole('button');
  expect(sendBtn).toBeInTheDocument();
  // Trigger send by pressing Enter
  const p = user.keyboard('{Enter}');

  // While send is pending, simulate realtime arrival of the same message with id 'abc'
  const payload = { id: 'abc', sender: 'alice', recipient: 'bob', content: 'Ping', created_at: new Date().toISOString() };
  // Ensure the hook has registered the callback
  await waitFor(() => expect(typeof triggerPrivateMessage).toBe('function'));
  act(() => triggerPrivateMessage(payload));

  // Now resolve the HTTP send with the same id
  act(() => sendPromiseControls.resolve(payload));
  await p;

  // Wait for UI to show only one message
  const items = await screen.findAllByText('Ping');
  expect(items).toHaveLength(1);
});