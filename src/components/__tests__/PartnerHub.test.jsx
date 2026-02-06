/* global test, expect, vi */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PartnerHub from '../PartnerHub';

test('renders CTAs and clicking one triggers pushNotif', async () => {
  const user = userEvent.setup();
  const pushNotif = vi.fn();
  render(<PartnerHub pushNotif={pushNotif} />);

  const cta = screen.getByText(/Request media kit/i);
  await user.click(cta);
  expect(pushNotif).toHaveBeenCalled();
});