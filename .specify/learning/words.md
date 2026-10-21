# Words

## What
- Per language a lightweight JSON word list (about 1000 common, child-appropriate words),
  usable by key set and word length.
- Slovak words keep correct diacritics; with "words without diacritics" on, only words
  without diacritics are used.
- Selection respects: active keys, word length range (for example 2-5), difficulty 1-10,
  and weak-key weighting.
- Fallback generator: when too few real words match, pronounceable pseudo-words are made
  from the allowed keys (alternating consonants and vowels, rhythmic syllables). With very
  small key sets (for example only `f j`), short letter patterns like `fff jjj fj jf` are
  used. Practice never stops for lack of words.
- No word may be offensive or scary; pseudo-words are checked against a small block list.
- Once space is known, a target can be a phrase of known words: at most two (short words)
  for targets that fly, fall or approach, two to four in calm modes (free practice, stepping
  stones, road signs). Right after space comes in, phrases are chunk pairs like `fj jf`.
  Small targets (boulder chunks, moles, shield groups) stay single words.
- Punctuation only once its key is known: a period ends about one phrase in three, a comma
  joins two parts in about one in five, `?` ends about one in eight, `!` `:` `-` are rarer.
  While a punctuation key is the newest one, it appears in about half of the targets.
- Capitals only at the start of a target: a child's name from a short list per language, or
  the first word. About one target in six at first, growing to every start as that Shift is
  mastered; while a Shift is the newest key, most targets start with a capital it serves.
- A target with a capital gets 1.5 s more time. On screen, a space shows as a light dot.

## Why
- Real words are more motivating; the generator guarantees practice with any key set.
- Phrases with punctuation and capitals are the step from words to real text; keeping
  moving targets short keeps the game calm, and capitals stay rare until the Shift is easy
  ([research](../../.research/learning/space-punctuation-capitals.md)).
