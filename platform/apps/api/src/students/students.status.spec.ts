import { STUDENT_STATUSES } from '@athenas/shared';

describe('student status catalog', () => {
  it('includes lifecycle statuses', () => {
    expect(STUDENT_STATUSES).toContain('lead');
    expect(STUDENT_STATUSES).toContain('active');
    expect(STUDENT_STATUSES).toContain('blocked');
    expect(STUDENT_STATUSES).toContain('cancelled');
  });
});
