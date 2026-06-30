export type ScoredQuestion = {
  id: string;
  correctAnswer: string;
  explanation: string;
};

export type SubmittedAnswer = {
  questionId: string;
  response: string;
};

export function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function scoreAnswers(questions: ScoredQuestion[], answers: SubmittedAnswer[]) {
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer.response]));
  const results = questions.map((question) => {
    const response = answerMap.get(question.id) ?? "";
    const correct = normalizeAnswer(response) === normalizeAnswer(question.correctAnswer);
    return {
      questionId: question.id,
      response,
      correct,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation
    };
  });
  const score = results.filter((result) => result.correct).length;
  const total = questions.length;
  return {
    score,
    total,
    percentage: total === 0 ? 0 : Math.round((score / total) * 100),
    results
  };
}
