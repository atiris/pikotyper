# Privacy

## What
- No ads, no accounts, no tracking, no cookies, no external requests at runtime.
- The about page also links to reporting a bug or an idea (a GitHub issue).
- A short, plain statement of this on the start screen and the about page, for parents.
- Nothing leaves the browser except what a person copies themselves: task, result and
  move links carry their data in the address hash, which browsers never send to the server
  ([teacher links](../profiles/teacher-links.md)).
- The teacher's camera scan reads QR codes in the browser: the picture is never sent or
  stored, and the camera is off whenever the scan is not running.
- The optional settings password is kept only as a salted hash in the browser's storage;
  it never leaves the device and is not part of exported files
  ([parent controls](../profiles/parent-controls.md)).

## Why
- Ads and data collection are the top complaints about popular free typing tools
  ([research](../../.research/features/privacy-no-ads.md)).
