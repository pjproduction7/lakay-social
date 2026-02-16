import React, { useState } from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mergePrivateMessage } from '../../utils/privateMessages';

let _sendResolvers = [];
function TestComponent() {
  const [privateMessages, setPrivateMessages] = useState([]);

  const sendPrivateMessage = (mapped) => {
    // Return a controllable promise — push resolver into shared array
    return new Promise((resolve) => {
      _sendResolvers.push((result) => {
        setPrivateMessages((prev) => mergePrivateMessage(prev, result));
        resolve(result);
      });
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
  const user = userEvent.setup();

  render(<TestComponent />);

  const receiveBtn = screen.getByText('Receive');
  const sendBtn = screen.getByText('Send');

  // Start send (pending)
  await user.click(sendBtn);

  // While send is pending, receive the same message via realtime
  await user.click(receiveBtn);

  // Resolve the pending HTTP send using the test-controlled resolver
  act(() => {
    const resolver = _sendResolvers.shift();
    resolver({ id: 'abc', message: 'hello', from: 'bob', to: 'alice' });
  });

  const items = await screen.findAllByRole('listitem');
  expect(items).toHaveLength(1);
  expect(items[0].textContent).toBe('hello');
});