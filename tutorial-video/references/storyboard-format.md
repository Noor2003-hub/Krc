# storyboard.json — field reference

## Top level
| field | required | default | meaning |
|---|---|---|---|
| `title` | yes | | Big title on the opening card. Also the output file name (unless `output`). |
| `subtitle` | | "" | Line under the title. |
| `chip` | | "Step-by-step guide" | Small label on the opening card. |
| `intro` | yes | | Narration over the opening card. |
| `outro` | yes | | Narration over the closing card. |
| `outro_title` | | "You're all set!" | Closing card title. |
| `outro_sub` | | "" | Closing card line (e.g. support contact). |
| `voice` | | af_heart | Kokoro voice id (af_* / am_* US, bf_* / bm_* British). |
| `speed` | | 0.95 | 0.85–1.1. Lower = calmer. |
| `subtitles` | | true | `false` hides the on-screen captions. |
| `accent` | | ["#6366f1","#22d3ee"] | Two hex colours: step badge, glow, cursor ripple, focus ring, logo square. |
| `palette` | | indigo/cyan/purple/pink/blue/teal | Up to 6 hex colours for the moving blurred background blobs. |
| `logo` | | gradient square | Path (relative to project) to a PNG/SVG/JPG shown on opening & closing cards. |
| `music` | | none | Path to a music file; looped, faded, mixed under the voice. |
| `music_volume` | | 0.12 | 0.05–0.25. |
| `output` | | title | Output file name (without .mp4). |
| `scenes` | yes | | List of scenes, in order. |

## Scene (one screenshot = one scene = one "Step N")
| field | required | meaning |
|---|---|---|
| `image` | yes | Screenshot name in `screenshots/` (extension optional). The same image may be reused by several scenes. |
| `step` | yes | Step title shown in the top-left badge ("Sign in to your account"). |
| `url` | | Text in the fake browser address bar. Omit to hide it. |
| `beats` | yes | List of beats (one sentence each). |

## Beat
| field | meaning |
|---|---|
| `say` | The sentence spoken (and shown as subtitle). Required. |
| `do` | `spotlight`, `point`, `click`, `type`, or omit for narration only. |
| `target` | `{"x","y","w","h"}` box in pixels of `build/shots/<image>.png`. Required for any `do`. |
| `zoom` | Camera zoom on the target (1 = none). 1.15–1.3 big areas, 1.5–1.8 small elements. |
| `text` | For `type`: what gets typed. Passwords: `"••••••••"`. |
| `hold` | Extra seconds to stay on this beat after the sentence. |
| `dim` | Darkness around the spotlight, 0–0.8 (default 0.5 spotlight, 0.32 click/type). |
| `font_size`, `pad_x`, `text_color`, `field_bg`, `radius`, `multiline` | Fine-tuning of the typing overlay (pixels of the screenshot / CSS colours). |

## Timing (automatic)
Each beat lasts as long as its sentence + ~0.7 s. `type` beats last at least until typing finishes;
`click` happens near the end of the sentence. Scenes add ~1.2 s for the page change. You never set times by hand.
