/**
 * Exam-specific configuration utility
 * Routes queries to the correct table based on user's selected goal
 */

export type ExamType = 'JEE' | 'NEET' | string;

export const getQuestionsTable = (goal: string | null): 'questions' | 'neet_questions' => {
  if (goal === 'NEET') return 'neet_questions';
  return 'questions';
};

export const getExamSubjects = (goal: string | null) => {
  if (goal === 'NEET') {
    return [
      { name: 'Physics', dbName: 'Physics' },
      { name: 'Chemistry', dbName: 'Chemistry' },
      { name: 'Biology', dbName: 'Biology' },
    ];
  }
  return [
    { name: 'Physics', dbName: 'Physics' },
    { name: 'Chemistry', dbName: 'Chemistry' },
    { name: 'Mathematics', dbName: 'Mathematics' },
  ];
};

export const getExamLabel = (goal: string | null): string => {
  if (goal === 'NEET') return 'NEET';
  return 'JEE';
};

/**
 * Get the user's goal from localStorage cache or fetch from DB
 */
export const getCachedGoal = (): string | null => {
  return localStorage.getItem('userGoal');
};

export const setCachedGoal = (goal: string | null) => {
  if (goal) {
    localStorage.setItem('userGoal', goal);
  } else {
    localStorage.removeItem('userGoal');
  }
};
