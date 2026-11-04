import os
DIR = os.environ.get("TUTORIAL_TTS_DIR", os.path.expanduser("~/.cache/tutorial-video/kokoro"))
def load():
    from kokoro_onnx import Kokoro
    return Kokoro(f"{DIR}/kokoro-v1.0.onnx", f"{DIR}/voices-v1.0.bin")
def lang(voice): return "en-gb" if voice[0] == "b" else "en-us"
