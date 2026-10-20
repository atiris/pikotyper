# Master Specification: PikoTyper – Interactive Children's Typing Adventure

## 1. Project Overview & Philosophy
* **Project Name:** PikoTyper
* **Target Audience:** Children (designed with modern child psychology: non-destructive, non-traumatic, peaceful, constructive mechanics, zero addiction loops, positive reinforcement).
* **Core Goal:** Learn and master touch-typing through an engaging story-driven arcade typing experience.
* **Architecture:** 100% Client-side (HTML5/CSS3/JavaScript or TypeScript, Canvas or DOM-based 2D). **No backend server required.** All data persists locally via `localStorage` with local export/import capabilities.
* **Localization:** Multilingual support. Detects browser language by default (with full Slovak localization out of the box). Dictionary words load dynamically per language (e.g., from local JSON files or a GitHub structure) to prevent bloating.
* **Visuals & Style:** High-end 2D polished graphics with smooth, friendly, and cute animations. **No 3D elements.**

---

## 2. Core Features & Customization Engine

### A. Profiles & Local Storage
* **Multi-player support:** Multiple local player profiles on the same device + a **Guest Mode**.
* **Storage & Portability:** Stored entirely in browser `localStorage`. Includes a UI option to export profile data as a `.json` file and import it on another device.
* **Customization Setup:** When setting up a profile or starting a session, the supervisor/parent can customize:
  * Child's name.
  * Favorite animal/companion name (default companion is **Piko**).
  * Custom encouraging messages.
  * **Granular Controls:** Select active keys (e.g., `a, e, f, j, k, d`), word length range (e.g., 2–5 letters), and difficulty slider (1–10).

### B. Companion "Piko" & Analytics
* **Piko as Guide:** Piko assists the player, offers gentle encouragement on mistakes (never punishment), and celebrates successes.
* **Customizable Piko:** Players unlock accessories (hats, colors, glasses, wings) as they progress, ensuring every Piko is unique.
* **Interactive Stats:** Clicking on Piko opens a friendly statistics overlay showing key-by-key performance (accuracy, speed, and problem keys where the player struggles most).

### C. Dictionary & Procedural Fallback
* **Dictionary Loading:** Loads a lightweight JSON file for the selected language (e.g., top 1000 common words categorized by length and allowed keys).
* **Fallback Generator:** If dictionary words run out or don't match the strict key filter, a procedural pseudo-word generator creates pronounceable, rhythmic syllables (alternating vowels/consonants from the allowed key set) so practice never stops.

---

## 3. Story & Level Progression

The game features an overarching narrative where the player saves companions and travels across environments:

1. **Phase 1: Training Meadow**
   * *Setting:* A training meadow. The player uses a gentle fly swatter tool.
   * *Obstacles:* Approaching harmless insects, mice, and spiders.
   * *Super-obstacle:* A spider weaves a web that must be cleared letter-by-letter before addressing items behind it.
   * *Reward:* Unlocks a secret invitation to space and meets **Piko**.
2. **Phase 2: Space Rocket Flight**
   * *Setting:* Blasting off from Earth into space. 
   * *Mechanic:* Typing speed dynamically controls the **Rocket Speedometer** on screen.
   * *Obstacles:* Approaching asteroids and large planets using a non-destructive energy/laser beam (pushes them away safely).
   * *Super-obstacle:* Some fractured objects break into smaller secondary targets.
   * *Reward:* Landing clearance permission.
3. **Phase 3: New Planet Exploration**
   * *Setting:* Meadows and magical forests of the new planet.
   * *Obstacles:* Crossing a thick swamp (typing builds stepping stones), choosing correct paths at directional road signs.
   * *Super-obstacle:* A massive *Rock Labyrinth / Cracking Boulder* that yields to precise typing, breaking down into safe stepping stones.
   * *Reward:* Unlocks **Telekinesis (The Force)**.
4. **Phase 4: Dragon Domain**
   * *Setting:* Protecting dragons from falling space rocks.
   * *Mechanic:* Using "The Force" and gentle shielding fields to divert nearby objects.
   * *Super-obstacle:* A near-miss meteorite impact causes a rolling energy wave (*tsunami*) that must be countered with a rhythm typing sequence.
   * *Reward:* A magical **Dragon Egg**.
5. **Phase 5: Finding a Friend (The Egg Journey)**
   * *Setting:* The egg starts to hatch and rolls down a slope.
   * *Mechanic:* Using "The Force" to help the egg jump or dodge rocks and tree stumps.
   * *Super-obstacle:* A friendly mole pops up unexpectedly, requiring faster reaction timing.
   * *Reward:* Successfully hatches a new companion animal, unlocking endless rescue missions to save other dragons.

---

## 4. Audio, Assets, and LLM Asset Constraint Directive

* **Audio:** Simple, repetitive, calming background soundtrack and pleasant retro/soft sound effects (synthesized via Web Audio API or lightweight audio assets).
* **CRITICAL ASSET DIRECTIVE FOR THE IMPLEMENTING LLM:** 
  * If you (the LLM) cannot directly generate raster images, sprites, or audio files, you **must explicitly state this limitation in your pre-implementation breakdown**. 
  * Do **not** fail or halt mid-implementation. Instead, either use clean CSS/Canvas procedural vector shapes/placeholders for graphics or expect a designated `/assets/` directory structure where mock placeholders or fallback colored canvas shapes are gracefully rendered.

---

## 5. Phased Implementation Plan (For a Single Long Run Execution)

The implementation must be structured into the following clean sequential steps so it can be built completely in one continuous run:

1. **Phase 1: Core Architecture & Setup**
   * Project file structure (`index.html`, CSS styling, modular TypeScript/JavaScript files).
   * Localization system (Browser language detection + Slovak/English JSON translation dictionary setup).
   * `LocalStorage` service for profiles, guest mode, settings, and JSON export/import.
2. **Phase 2: Dictionary & Word Engine**
   * JSON structure for word lists categorized by key sets and length.
   * Fallback procedural word generator script.
   * Key selection and difficulty filtering logic.
3. **Phase 3: Game Engine & Mechanics (Canvas/DOM)**
   * Base game loop, typing input listener (handling correct/incorrect keystrokes instantly with zero input lag).
   * Non-destructive visual feedback (shield bubbles, gentle pushing instead of explosions/destruction).
   * Rhythmic speedometer and progression tracker.
4. **Phase 4: Story Levels & Progression Flow**
   * Implement the 5 sequential story phases (Training Meadow, Space Flight, Planet Exploration, Dragon Domain, Egg Journey).
   * Super-obstacles logic (spider webs, cracking boulders, rolling waves, moles).
5. **Phase 5: Companion (Piko), Customization & Statistics**
   * Piko avatar rendering and customization options (hats, colors).
   * Interactive statistics modal (key accuracy, error tracking per key) triggered by clicking Piko.
   * Reward system (stars, unlocking new dragons/friends).
6. **Phase 6: Audio & UI Polish**
   * Web Audio API synthesized sound effects and gentle looping background music.
   * Highly polished 2D UI/UX, responsive layout, friendly animations, and child-safe psychology pacing.
