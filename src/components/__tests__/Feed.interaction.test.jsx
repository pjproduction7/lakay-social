/* global test, expect, vi */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Feed from '../Feed';

test('clicking Post calls handleCreatePost', async () => {
  const user = userEvent.setup();
  const handleCreatePost = vi.fn();

  render(
    <Feed
      trans={{ createPostPlaceholder: "What's on your mind?" }}
      postTextRef={{ current: null }}
      postText=""
      postImage={null}
      postImageInputId="img-input"
      handleImageUpload={() => {}}
      handleCreatePost={handleCreatePost}
      posts={[]}
      openProfile={() => {}}
      currentUser={'alice'}
      toggleSave={() => {}}
      handleToggleLike={() => {}}
      handleReaction={() => {}}
      commentRefs={{ current: {} }}
      commentTexts={{}}
      handleAddComment={() => {}}
    />
  );

  const postButton = screen.getByRole('button', { name: /Post/i });
  await user.click(postButton);

  expect(handleCreatePost).toHaveBeenCalledTimes(1);
});

test('pressing Enter in comment input calls handleAddComment', async () => {
  const user = userEvent.setup();
  const handleAddComment = vi.fn();
  const posts = [
    { id: 'p1', user: 'bob', timestamp: Date.now(), content: 'Hello', likes: [], comments: [], reactions: { like: 0, love: 0, haha: 0, fire: 0 } }
  ];

  render(
    <Feed
      trans={{ createPostPlaceholder: "What's on your mind?" }}
      postTextRef={{ current: null }}
      postText=""
      postImage={null}
      postImageInputId="img-input"
      handleImageUpload={() => {}}
      handleCreatePost={() => {}}
      posts={posts}
      openProfile={() => {}}
      currentUser={'alice'}
      toggleSave={() => {}}
      handleToggleLike={() => {}}
      handleReaction={() => {}}
      commentRefs={{ current: {} }}
      commentTexts={{}}
      handleAddComment={handleAddComment}
    />
  );

  const commentInput = screen.getByPlaceholderText(/Write a comment/i);
  await user.type(commentInput, 'Nice post{Enter}');

  expect(handleAddComment).toHaveBeenCalledTimes(1);
  expect(handleAddComment).toHaveBeenCalledWith('p1');
});