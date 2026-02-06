/* global test, expect, vi */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GamesMenu from '../GamesMenu';

test('select game calls handler with correct id', async () => {
  const user = userEvent.setup();
  const onSelectGame = vi.fn();
  render(<GamesMenu onSelectGame={onSelectGame} />);

  const snakeBtn = screen.getByText(/Snake/i);
  await user.click(snakeBtn);
  expect(onSelectGame).toHaveBeenCalledWith('snake');
});