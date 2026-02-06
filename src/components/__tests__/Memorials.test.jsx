/* global test, expect, vi */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Memorials from '../Memorials';

test('calls handleAddCondolence when pressing Enter in condolence input', async () => {
  const user = userEvent.setup();
  const mem = [{ id: 'm1', name: 'John Doe', years: '1950-2020', author: 'alice', tribute: 'Rest in peace', condolences: [] }];
  const handleAddCondolence = vi.fn();

  render(
    <Memorials
      memorials={mem}
      memorialPhoto={null}
      memorialNameRef={{ current: null }}
      memorialYearsRef={{ current: null }}
      memorialTributeRef={{ current: null }}
      setMemorialPhoto={() => {}}
      setMemorialFile={() => {}}
      handleCreateMemorial={() => {}}
      handleAddCondolence={handleAddCondolence}
    />
  );

  const input = screen.getByPlaceholderText(/Leave your condolences/i);
  await user.type(input, 'So sorry{Enter}');

  expect(handleAddCondolence).toHaveBeenCalledTimes(1);
  expect(handleAddCondolence).toHaveBeenCalledWith('m1', 'So sorry');

  // Also test clicking Post button
  const postBtn = screen.getByRole('button', { name: /Post/i });
  await user.type(input, 'Condolences');
  await user.click(postBtn);
  expect(handleAddCondolence).toHaveBeenCalledWith('m1', 'Condolences');
});