import type { Profile, Surprise } from '../storage/schema';
import { type LevelDef, starsFor } from './levels';
import type { LevelResult } from './progress';

export const OWN_QUESTIONS_MAX = 30;
export const OWN_QUESTION_LEN = 160;
export const SURPRISES_MAX = 20;
export const SURPRISE_LEN = 200;
/** Free practice earns a surprise only after this many seconds. */
export const SURPRISE_PRACTICE_SECONDS = 60;

/**
 * Teasers on the results card of a finished story level: the answer to the question asked
 * after the level before, and a question about what comes next (`builtIn.q`, when there is
 * one). Every second question is the parent's own one, taken in order.
 */
export function teaserLines(p: Profile, builtIn: { q?: string; a?: string }): { answer?: string; question?: string } {
  const pr = p.progress;
  let answer = builtIn.a;
  if (pr.pendingQuestion !== null) {
    // An own question was asked last time, so the built-in answer has no question.
    answer = p.ownQuestions[pr.pendingQuestion]?.a;
    pr.pendingQuestion = null;
  }
  let question = builtIn.q;
  if (question) {
    pr.teasersAsked++;
    if (pr.teasersAsked % 2 === 0 && p.ownQuestions.length) {
      const i = pr.ownQuestionNext % p.ownQuestions.length;
      question = p.ownQuestions[i].q;
      pr.pendingQuestion = i;
      pr.ownQuestionNext = i + 1;
    }
  }
  return { answer, question };
}

/** Does a surprise wait at this level: its own story level, the next level or rescue mission, or free practice. */
function placeMatches(place: string, def: LevelDef): boolean {
  if (place === 'next') return def.kind !== 'practice';
  return place === def.id;
}

/** The oldest surprise not yet revealed that waits at this level. Drills have none. */
export function surpriseFor(p: Profile, def: LevelDef, drill: boolean): Surprise | null {
  if (drill) return null;
  return p.surprises.find((s) => !s.revealedAt && placeMatches(s.place, def)) ?? null;
}

/** The level went well enough for the surprise: its stars, in practice from accuracy after a minute. */
export function surpriseReached(s: Surprise, def: LevelDef, r: LevelResult): boolean {
  if (def.kind === 'practice') return r.seconds >= SURPRISE_PRACTICE_SECONDS && starsFor(r.accuracy) >= s.minStars;
  return r.stars >= s.minStars;
}
