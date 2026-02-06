/* global test, expect, vi */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Politics from '../Politics';

test('voting calls handleVoteOpinion', async () => {
  const user = userEvent.setup();
  const handleVoteOpinion = vi.fn();
  const handleCommentOpinion = vi.fn();
  const handleLikeComment = vi.fn();

  const opinions = [{ id: 1, question: 'Test?', description: 'desc', agree: 0, neutral: 0, disagree: 0, userVotes: {}, comments: [] }];

  render(<Politics politicalOpinions={opinions} handleVoteOpinion={handleVoteOpinion} handleCommentOpinion={handleCommentOpinion} handleLikeComment={handleLikeComment} BLACKLISTED_POLITICIANS={[]} cardBg={'bg-white'} currentUser={'alice'} />);

  const agreeBtns = screen.getAllByRole('button', { name: /Agree|Agree \(/i });
  await user.click(agreeBtns[0]);
  expect(handleVoteOpinion).toHaveBeenCalledWith(1, 'agree');
});