import { describe, expect, it } from "vitest";
import { scoreAnswers } from "../src/utils/scoring";

describe("scoreAnswers", () => {
  it("scores MCQ and fill blank answers case-insensitively", () => {
    const result = scoreAnswers(
      [
        { id: "q1", correctAnswer: "DGCA", explanation: "India regulator" },
        { id: "q2", correctAnswer: "Visual", explanation: "VFR" }
      ],
      [
        { questionId: "q1", response: "dgca" },
        { questionId: "q2", response: " visual " }
      ]
    );

    expect(result.score).toBe(2);
    expect(result.percentage).toBe(100);
  });
});
