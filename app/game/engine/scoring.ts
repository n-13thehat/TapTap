export type Difficulty = "easy" | "normal" | "expert";

export type Judgement = "MARVELOUS" | "PERFECT" | "GREAT" | "GOOD" | "MISS";

export interface JudgementWindows {
  MARVELOUS: number;
  PERFECT: number;
  GREAT: number;
  GOOD: number;
}

export interface DifficultyConfig {
  windowsMs: JudgementWindows;
}

export interface ComboBonusCurve {
  startCombo: number;
  maxCombo: number;
  maxBonusMultiplier: number;
}

export interface ScoringConfig {
  difficulties: Record<Difficulty, DifficultyConfig>;
  judgementWeights: Record<Judgement, number>;
  baseScorePerNote: number;
  comboBonusCurve: ComboBonusCurve;
}

export interface ScoreState {
  combo: number;
  maxCombo: number;
  totalNotes: number;
  judgedNotes: number;
  rawScore: number;
  weightedHitSum: number;
  judgements: Record<Judgement, number>;
}

export interface HitResult {
  judgement: Judgement;
  deltaMs: number;
  scoreGained: number;
  combo: number;
  maxCombo: number;
  accuracy: number; // 0–100
  totalScore: number;
}

export function createInitialScoreState(totalNotes: number): ScoreState {
  return {
    combo: 0,
    maxCombo: 0,
    totalNotes,
    judgedNotes: 0,
    rawScore: 0,
    weightedHitSum: 0,
    judgements: {
      MARVELOUS: 0,
      PERFECT: 0,
      GREAT: 0,
      GOOD: 0,
      MISS: 0
    }
  };
}

/**
 * Pick a judgement for |deltaMs| at given difficulty, using config windows.
 */
export function getJudgementForDelta(
  deltaMs: number,
  difficulty: Difficulty,
  config: ScoringConfig
): Judgement {
  const abs = Math.abs(deltaMs);
  const windows = config.difficulties[difficulty].windowsMs;

  if (abs <= windows.MARVELOUS) return "MARVELOUS";
  if (abs <= windows.PERFECT) return "PERFECT";
  if (abs <= windows.GREAT) return "GREAT";
  if (abs <= windows.GOOD) return "GOOD";
  return "MISS";
}

/**
 * Compute combo bonus multiplier in [0, maxBonusMultiplier].
 */
export function getComboBonus(
  combo: number,
  curve: ComboBonusCurve
): number {
  const { startCombo, maxCombo, maxBonusMultiplier } = curve;
  if (combo < startCombo) return 0;

  const t = Math.min(1, (combo - startCombo) / Math.max(1, maxCombo - startCombo));
  // Smooth curve (ease-out)
  const eased = 1 - Math.pow(1 - t, 2);
  return eased * maxBonusMultiplier;
}

/**
 * Apply a single hit to the score state, updating combo + accuracy + score.
 *
 * @param state      Mutable ScoreState
 * @param deltaMs    Timing offset (+ late, - early)
 * @param difficulty easy | normal | expert
 * @param config     Scoring config loaded at start
 */
export function applyHit(
  state: ScoreState,
  deltaMs: number,
  difficulty: Difficulty,
  config: ScoringConfig
): HitResult {
  const judgement = getJudgementForDelta(deltaMs, difficulty, config);
  const weight = config.judgementWeights[judgement];

  // combo logic
  if (judgement === "MISS") {
    state.combo = 0;
  } else {
    state.combo += 1;
    if (state.combo > state.maxCombo) {
      state.maxCombo = state.combo;
    }
  }

  // base note score (full Marvelous FC ≈ baseScorePerNote * totalNotes)
  const basePerNote = config.baseScorePerNote / Math.max(1, state.totalNotes);
  const comboBonus = getComboBonus(state.combo, config.comboBonusCurve);

  const scoreForHit = basePerNote * weight * (1 + comboBonus);

  state.rawScore += scoreForHit;
  state.weightedHitSum += weight;
  state.judgedNotes += 1;
  state.judgements[judgement] += 1;

  const maxPossibleScore = config.baseScorePerNote; // by design
  const clampedScore = Math.min(maxPossibleScore, state.rawScore);

  // accuracy = (sum of weights / judgedNotes) * 100
  const accuracy =
    state.judgedNotes > 0
      ? (state.weightedHitSum / state.judgedNotes) * 100
      : 0;

  return {
    judgement,
    deltaMs,
    scoreGained: scoreForHit,
    combo: state.combo,
    maxCombo: state.maxCombo,
    accuracy,
    totalScore: clampedScore
  };
}

/**
 * Optional: derive a letter grade based on accuracy.
 */
export function getGrade(accuracy: number): "SS" | "S" | "A" | "B" | "C" | "D" | "F" {
  if (accuracy >= 99.5) return "SS";
  if (accuracy >= 97) return "S";
  if (accuracy >= 93) return "A";
  if (accuracy >= 85) return "B";
  if (accuracy >= 75) return "C";
  if (accuracy >= 60) return "D";
  return "F";
}
