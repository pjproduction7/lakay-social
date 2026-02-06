/* global test, expect, vi */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Classmates from '../Classmates';

test('posting a classmate request calls handleCreateClassmatePost', async () => {
  const user = userEvent.setup();
  const handleCreateClassmatePost = vi.fn();

  render(
    <Classmates
      schools={[{ id: 's1', name: 'Test School', city: 'City', department: 'Dept' }]}
      showAddSchool={false}
      setShowAddSchool={() => {}}
      newSchoolName={''}
      setNewSchoolName={() => {}}
      newSchoolCity={''}
      setNewSchoolCity={() => {}}
      newSchoolDepartment={''}
      setNewSchoolDepartment={() => {}}
      selectedSchoolId={'s1'}
      setSelectedSchoolId={() => {}}
      classmateName={"John"}
      setClassmateName={() => {}}
      classmateYear={"2010"}
      setClassmateYear={() => {}}
      classmateMessage={"Looking for John"}
      setClassmateMessage={() => {}}
      handleAddSchool={() => {}}
      handleCreateClassmatePost={handleCreateClassmatePost}
      classmatesPosts={[]}
      replyTexts={{}}
      setReplyTexts={() => {}}
      handleReplyToPost={() => {}}
    />
  );

  const postButton = screen.getByRole('button', { name: /Post/i });
  await user.click(postButton);

  expect(handleCreateClassmatePost).toHaveBeenCalledTimes(1);
});