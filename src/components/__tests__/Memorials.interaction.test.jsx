/* global test, expect, vi */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Memorials from '../Memorials';

test('clicking Create Memorial calls handleCreateMemorial', async () => {
  const user = userEvent.setup();
  const handleCreateMemorial = vi.fn();

  render(
    <Memorials
      memorials={[]}
      memorialPhoto={null}
      memorialNameRef={{ current: null }}
      memorialYearsRef={{ current: null }}
      memorialTributeRef={{ current: null }}
      setMemorialPhoto={() => {}}
      setMemorialFile={() => {}}
      handleCreateMemorial={handleCreateMemorial}
      handleAddCondolence={() => {}}
    />
  );

  const createBtn = screen.getByRole('button', { name: /Create Memorial/i });
  await user.click(createBtn);

  expect(handleCreateMemorial).toHaveBeenCalledTimes(1);
});