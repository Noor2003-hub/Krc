# Makes short MP3 samples so the user can pick a narrator voice.
# usage: python3 voice_samples.py OUT_DIR ["custom sample sentence"]
import sys, os, subprocess, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tts_common import load, lang
VOICES = {"af_heart": "American woman (warm)", "af_bella": "American woman (bright)",
          "am_michael": "American man (calm)", "am_fenrir": "American man (deep)",
          "bf_emma": "British woman", "bm_george": "British man"}
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
text = sys.argv[2] if len(sys.argv) > 2 else ("Welcome to the new portal. In this video, we'll walk through how to sign in, step by step. "
        "First, enter your work email address. Then type your password, and click Sign in.")
k = load()
for v, desc in VOICES.items():
    a, sr = k.create(text, voice=v, speed=0.95, lang=lang(v))
    sf.write(f"/tmp/_{v}.wav", a, sr)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f"/tmp/_{v}.wav", "-b:a", "128k", f"{out}/{v}.mp3"], check=True)
    print(f"{out}/{v}.mp3  -  {desc}")
