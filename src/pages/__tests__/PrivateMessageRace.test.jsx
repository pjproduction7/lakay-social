import React, { useState } from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mergePrivateMessage } from '../../utils/privateMessages';

function TestComponent() {
  const [privateMessages, setPrivateMessages] = useState([]);

  const sendPrivateMessage = (mapped, delay = 100) => {
    // Simulates an HTTP request that resolves after a delay
    return new Promise((resolve) => {
      setTimeout(() => {
        setPrivateMessages((prev) => mergePrivateMessage(prev, mapped));
        resolve(mapped);
      }, delay);
    });
  };

  const receiveRealtimeMessage = (mapped) => {
    // Simulates receiving a websocket event
    setPrivateMessages((prev) => mergePrivateMessage(prev, mapped));
  };

  return (
    <div>
      <button onClick={() => receiveRealtimeMessage({ id: 'abc', message: 'hello', from: 'bob', to: 'alice' })}>
        Receive
      </button>
      <button onClick={() => sendPrivateMessage({ id: 'abc', message: 'hello', from: 'bob', to: 'alice' })}>
        Send
      </button>
      <ul data-testid="list">
        {privateMessages.map((m) => (
          <li key={m.id}>{m.message}</li>
        ))}
      </ul>
    </div>
  );
}

test('no duplicate when realtime arrives during send', async () => {
  vi.useFakeTimers();
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  render(<TestComponent />);

  const receiveBtn = screen.getByText('Receive');
  const sendBtn = screen.getByText('Send');

  // Start send (pending)
  await user.click(sendBtn);

  // While send is pending, receive the same message via realtime
  await user.click(receiveBtn);

  // Fast-forward timers to resolve the send
  act(() => { vi.runAllTimers(); });

  const items = await screen.findAllByRole('listitem');
  expect(items).toHaveLength(1);
  expect(items[0].textContent).toBe('hello');

  vi.useRealTimers();
});