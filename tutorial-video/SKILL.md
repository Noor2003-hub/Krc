---
name: tutorial-video
description: Turn website or app screenshots plus a short script into a polished, narrated step-by-step tutorial video (MP4, 1080p) — free, no After Effects, no paid AI video tools. Animated mouse cursor, clicks, typing into fields, zoom and spotlight on the element being explained, step titles, subtitles, a moving blurred "liquid" background, and an English voiceover generated offline with a free voice model (Kokoro). Use when the user wants a walkthrough / how-to / onboarding / training / demo video of a website, portal, dashboard or app, especially when the site is private and only screenshots can be shared. Also use when they ask what screenshots or script to prepare for such a video.
---

# Tutorial video from screenshots

You turn **screenshots + a script** into a narrated tutorial video. You never need the live site:
everything (cursor, typing, clicks, zoom) is animated on top of the screenshots.

Pipeline: `setup.sh` → collect brief, voice and screenshots → write `storyboard.json` → `prepare.py`
→ mark target boxes (`grid.py`, `check_targets.py`) → `voice.py` → preview stills (`render.js --stills auto`)
→ full render (`render.js`) → deliver → revise.

`SKILL_DIR` below = the folder containing this file. Work in a project folder, e.g. `~/tutorial-projects/<name>/`,
that holds `screenshots/`, `storyboard.json`, `build/`, `output/`.

The user is usually NOT technical. Talk to them in their language (often Arabic) in plain words, never show
JSON or code to them unless asked. The video itself is in English (Kokoro voices are English).

---

## 0. Setup (once per machine/session)

```bash
bash SKILL_DIR/scripts/setup.sh
```
It checks/installs: ffmpeg, node + playwright (Chromium), python packages `kokoro-onnx soundfile pillow`,
and downloads the Kokoro model (~350 MB) from github.com into `~/.cache/tutorial-video/kokoro`
(override with env `TUTORIAL_TTS_DIR`). It ends with `READY` or lists what is missing.

- Needs network access to pypi.org and github.com the first time. If the download is blocked, tell the user
  plainly which host is blocked (their environment's network settings must allow it) — don't fake a voiceover.
- If Playwright is already installed with its own browser (e.g. cloud containers), don't reinstall it.
- Run every python script with `python3 -I` (isolated mode); scripts only read files you pass them.

## 1. What to ask (and when)

Ask only what you don't already know. Use AskUserQuestion for choices, plain chat for free text.

**a) The brief** — what the site is, who the video is for, which flows to show (e.g. login, dashboard tour,
creating X, settings). From this, *you* propose the step list (4–10 steps is typical).

**b) Immediately after the brief, send them the tailored checklist** of exactly which screenshots to take
and the script template — see `GUIDE-ar.md` (Arabic, for the user; send the file or paste the relevant parts).
Tailor it: list the actual screens for *their* flows, e.g.
`01 login page (empty) · 02 dashboard after login · 03 "New order" form (empty) · 04 success message · 05 error message (optional)`.
Key rules to repeat to them:
- Forms must be captured **EMPTY** — you animate the typing yourself. Capture the **result** screen after each action.
- Same browser window size and zoom (100%) for all screenshots; full page area; no browser bars needed
  (the video draws its own browser frame). Best tool: Chrome DevTools → "Capture screenshot".
- Use demo/test data only; hide or blur real names, emails, customer data. Never a real password.
- Name files in order `01.png, 02.png …` and send them all together (or zipped).

**c) The voice** — generate samples and let them choose:
```bash
python3 -I SKILL_DIR/scripts/voice_samples.py <project>/voice-samples
```
Send the 6 MP3s (af_heart warm US woman · af_bella bright US woman · am_michael calm US man ·
am_fenrir deep US man · bf_emma British woman · bm_george British man), then ask with AskUserQuestion which
one to use. Optional: speed (default 0.95; 0.9 = calmer for training videos, 1.0 = normal).
Other valid voices: af_nicole, af_sarah, af_sky, af_nova, am_adam, am_eric, am_liam, am_onyx, bf_alice, bf_lily, bm_daniel, bm_lewis.

**d) Look & extras** (ask once, offer defaults):
video title + subtitle for the opening card, closing line (e.g. "Questions? Contact IT support."),
logo file (optional), brand colours (optional — used for accent + background blobs),
subtitles on/off (default on), background music file (optional — they must own/license it; none is bundled),
fake URL to show in the browser bar per page (optional, e.g. `portal.company.com/login`).

## 2. The script (narration)

Users send it as a simple table/list — one line per screenshot or per action:
`Screenshot | What to say | What to point at | Action | Text to type`
If they only give a brief, **you write the script** and show it to them for approval *before* rendering
(rendering takes minutes; changing words later means re-rendering).

Writing rules (these make the voiceover sound natural):
- One beat = one sentence = one action. 6–20 words. Present tense, second person ("Click…", "You'll see…").
- Name UI elements exactly as written on screen ("click **Submit request**").
- Put the action word near the end for clicks ("When you're ready, click Sign in.") — the click is timed to the end of the sentence.
- First beat of every scene has no action — it orients the viewer ("This opens the new request form.").
- Spell things the way they should be spoken: "e-mail", "two-factor", "dot com"; avoid "e.g.", "&", "/", emojis, ALL CAPS acronyms that should be words.
- Intro: 1–2 sentences on what they'll learn. Outro: 1–2 sentences, where to get help.
- Pace: ~4–6 s per beat. 10 beats ≈ 1 minute. Long training videos are fine; split into sections (scenes) of 2–6 beats.

## 3. storyboard.json

Full field reference: `references/storyboard-format.md`. Working example: `templates/storyboard.example.json`.
Minimal shape:
```json
{
  "title": "Northwind Portal", "subtitle": "Getting started: sign in and submit your first request",
  "voice": "af_heart", "speed": 0.95,
  "intro": "Welcome to …", "outro_title": "You're all set!", "outro_sub": "Questions? Contact IT support.", "outro": "And that's it! …",
  "scenes": [
    { "image": "01", "url": "portal.company.com/login", "step": "Sign in to your account", "beats": [
      { "say": "Start by opening the login page." },
      { "say": "Click the Email field and type your work e-mail.", "do": "type", "target": {"x":1420,"y":641,"w":840,"h":88}, "text": "sara@company.com", "zoom": 1.7 },
      { "say": "Then click Sign in.", "do": "click", "target": {"x":1420,"y":1017,"w":840,"h":88}, "zoom": 1.7 }
    ]}
  ]
}
```
Beat actions (`do`): none (just narration) · `spotlight` (dim everything else, glow box) · `point` (cursor moves there, no click)
· `click` (cursor moves, clicks, ripple) · `type` (click the field, then type `text`; for passwords use `"••••••••"`).
`zoom`: 1 = whole page, 1.15–1.3 for big areas (tables, sidebars), 1.5–1.8 for single fields/buttons. Omit for no zoom.
Every scene = one screenshot. A click that navigates is shown by the *next* scene's screenshot.

## 4. Screenshots → target boxes (most important accuracy step)

1. Copy the user's files into `<project>/screenshots/` with ordered names (`01.png` …), matching `"image"` in the storyboard (extension optional).
   Uploaded files: in Claude Code they're at the path the user gives; on claude.ai they are usually in `/mnt/user-data/uploads/` (otherwise search with `find / -name "*.png" -mmin -60 2>/dev/null`).
2. Look at every screenshot yourself. Flag anything that looks like real personal data before going on.
3. `python3 -I SKILL_DIR/scripts/prepare.py <project>` → normalises sizes into `build/shots/` and prints the pixel size.
   **All target boxes are in pixels of `build/shots/*.png`** (often 2× CSS size on retina/HiDPI screens).
4. Find coordinates: images you view are downscaled, so never guess from the thumbnail. Use the grid:
   `python3 -I SKILL_DIR/scripts/grid.py <project> 01` (whole image) then zoom in on the area:
   `python3 -I SKILL_DIR/scripts/grid.py <project> 01 800 300 1000 500` (crop x y w h) and read the box edges off the grid labels.
   Boxes should hug the element (input border, button edges). For `type`, the box is the input itself (not its label).
5. Verify: `python3 -I SKILL_DIR/scripts/check_targets.py <project>` → view `build/check/*.jpg` (numbered red boxes). Fix and repeat until every box sits exactly on its element.

## 5. Voice, preview, render

```bash
python3 -I SKILL_DIR/scripts/voice.py <project>          # narration + timeline, prints duration
node SKILL_DIR/scripts/render.js <project> --stills auto  # one frame per beat + build/stills/contact-sheet.jpg
```
Look at the contact sheet (and individual stills when something looks off). Check: spotlight/zoom on the right element,
typed text sits inside the field and has the right size and colour, cursor tip on the button, subtitles readable, nothing cut off.
Typing overlay tuning per beat if needed: `font_size`, `pad_x`, `text_color`, `field_bg`, `radius`, `multiline`.
Optional: show the user 2–3 stills for a quick OK before the long render.

```bash
node SKILL_DIR/scripts/render.js <project>                # → output/<title>.mp4  (1920×1080, 30 fps, H.264 + AAC)
```
Render speed ≈ 3–4 s of wall time per second of video (a 5-minute video ≈ 15–20 min). Run it in the background
and tell the user roughly how long it will take. Re-run `voice.py` whenever any `say`, `voice`, `speed` or beat changes, then render again.

## 6. Deliver & revise

Send the MP4 (plus a short summary: length, voice, steps). If the user can't open/play it, re-encode a smaller copy:
`ffmpeg -i in.mp4 -c:v libx264 -crf 24 -preset slow -c:a aac -b:a 128k -movflags +faststart small.mp4`.
Typical revision requests and where to change them:
slower/faster voice → `speed` · different voice → `voice` · longer pause on a step → beat `"hold": 1.5` (seconds)
· less/more zoom → `zoom` · no subtitles → `"subtitles": false` · colours → `palette` / `accent` · wrong word → `say`.

## Gotchas
- Fonts: the overlay text uses the system sans-serif (Inter if installed). If typed text looks different from the site, set `font_size`.
- If a field has a placeholder, the overlay covers it with the field's own background colour (sampled automatically).
- Screenshots of different sizes are resized to match the first one — ask for consistent window size instead.
- Very small screenshots (< 1200 px wide) look soft when zoomed; ask for larger ones or use smaller zoom values.
- Don't put real passwords, customer data or internal URLs in the video; use demo values.
