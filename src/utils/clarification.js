import { getQuestionText } from "./clarificationQuestions";

export function formatClarificationAnswer(questions, answersByIndex) {
  if (!questions?.length) {
    return "";
  }

  return questions
    .map((question, index) => {
      const answer = String(answersByIndex[index] || "").trim() || "Not specified";
      return `Q: ${getQuestionText(question)}\nA: ${answer}`;
    })
    .join("\n\n");
}
