# Generates the narration for every beat (Kokoro, offline, free), lays out the timeline,
# and writes build/narration.wav + build/timeline.json for the renderer.
# usage: python3 voice.py PROJECT_DIR
import sys, os, json, numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tts_common import load, lang
root = sys.argv[1]; sb = json.load(open(f"{root}/storyboard.json"))
voice, speed = sb.get("voice", "af_heart"), sb.get("speed", 0.95)
k = load(); SR = 24000; segs = []
def tts(text): return k.create(text, voice=voice, speed=speed, lang=lang(voice))[0]
TL = {"scenes": []}
a = tts(sb["intro"]); TL["intro"] = {"start": 0, "say": sb["intro"], "end": 1.0 + len(a)/SR + 1.0}; segs.append((1.0, a)); t = TL["intro"]["end"]
for si, sc in enumerate(sb["scenes"]):
    S = {k2: sc.get(k2, "") for k2 in ("image", "url", "step")}; S.update(n=si + 1, start=t, beats=[]); t += 0.9
    for b in sc["beats"]:
        a = tts(b["say"]); d = len(a)/SR; kind = b.get("do"); lead = 0.25
        B = dict(b, start=t, audio_start=t + lead, audio_dur=d)
        if kind == "type":
            B["click_at"] = t + 1.1; B["type_start"] = t + 1.35
            B["type_end"] = B["type_start"] + len(b["text"]) / (11 if len(b["text"]) < 30 else 16)
            end = max(t + lead + d, B["type_end"]) + 0.7
        elif kind in ("click", "point"):
            B["click_at"] = t + max(1.1, lead + d - 0.25); end = max(t + lead + d, B["click_at"]) + 0.8
        else: end = t + lead + d + 0.7
        B["end"] = end + b.get("hold", 0); segs.append((B["audio_start"], a)); S["beats"].append(B); t = B["end"]
    t += 0.3; S["end"] = t; TL["scenes"].append(S)
a = tts(sb["outro"]); TL["outro"] = {"start": t, "say": sb["outro"], "audio_start": t + 1.0}; segs.append((t + 1.0, a))
t += 1.0 + len(a)/SR + 2.0; TL["outro"]["end"] = TL["duration"] = t
for key in ("title", "subtitle", "outro_title", "outro_sub", "chip", "palette", "accent", "subtitles"):
    if key in sb: TL[key] = sb[key]
out = np.zeros(int(t * SR) + SR, dtype=np.float32)
for at, a in segs: s = int(at * SR); out[s:s + len(a)] += a
os.makedirs(f"{root}/build", exist_ok=True)
sf.write(f"{root}/build/narration.wav", out, SR); json.dump(TL, open(f"{root}/build/timeline.json", "w"), indent=1)
print(f"OK narration {t:.1f}s ({int(t//60)}:{int(t%60):02d})")
