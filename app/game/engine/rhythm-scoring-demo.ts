import scoringConfigJson from "../rhythm-scoring-config.json";
import {
  ScoringConfig,
  ScoreState,
  applyHit,
  createInitialScoreState,
  getGrade,
  Difficulty
} from "./scoring";

const scoringConfig = scoringConfigJson as ScoringConfig;

let currentDifficulty: Difficulty = "expert";
let scoreState: ScoreState;

/**
 * Call once when a level starts.
 */
export function initLevel(totalNotes: number, difficulty: Difficulty) {
  currentDifficulty = difficulty;
  scoreState = createInitialScoreState(totalNotes);
}

/**
 * Call this when the player hits a note.
 *
 * @param noteTimeMs Scheduled note time from chart
 * @param hitTimeMs  Current playback time at tap
 */
export function onNoteHit(noteTimeMs: number, hitTimeMs: number) {
  const deltaMs = hitTimeMs - noteTimeMs;

  const result = applyHit(
    scoreState,
    deltaMs,
    currentDifficulty,
    scoringConfig
  );

  return {
    judgement: result.judgement,
    combo: result.combo,
    maxCombo: result.maxCombo,
    accuracy: result.accuracy,
    totalScore: result.totalScore
  };
}

/**
 * Call when song ends to get final stats.
 */
export function getFinalResults() {
  const accuracy =
    scoreState.judgedNotes > 0
      ? (scoreState.weightedHitSum / scoreState.judgedNotes) * 100
      : 0;

  const grade = getGrade(accuracy);

  return {
    ...scoreState,
    finalScore: Math.min(scoringConfig.baseScorePerNote, scoreState.rawScore),
    accuracy,
    grade
  };
}
