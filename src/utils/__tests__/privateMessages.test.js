import { mergePrivateMessage } from '../privateMessages';

test('appends a new message when id not present', () => {
  const prev = [{ id: '1', message: 'hi' }];
  const mapped = { id: '2', message: 'hello' };
  const res = mergePrivateMessage(prev, mapped);
  expect(res).toHaveLength(2);
  expect(res[1]).toEqual(mapped);
});

test('updates existing message when id present', () => {
  const prev = [{ id: '1', message: 'hi', read: false }];
  const mapped = { id: '1', message: 'hi there', read: true };
  const res = mergePrivateMessage(prev, mapped);
  expect(res).toHaveLength(1);
  expect(res[0]).toEqual({ id: '1', message: 'hi there', read: true });
});

test('ignores null mapped', () => {
  const prev = [{ id: '1', message: 'hi' }];
  const res = mergePrivateMessage(prev, null);
  expect(res).toBe(prev);
});