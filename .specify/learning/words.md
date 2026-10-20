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

## Why
- Real words are more motivating; the generator guarantees practice with any key set.
