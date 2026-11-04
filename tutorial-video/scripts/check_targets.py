# Draws every beat's target box (numbered) on its screenshot so Claude can verify positions visually.
# usage: python3 check_targets.py PROJECT_DIR   -> build/check/<image>.jpg
import sys, os, json
from PIL import Image, ImageDraw, ImageFont
root = sys.argv[1]; sb = json.load(open(f"{root}/storyboard.json")); os.makedirs(f"{root}/build/check", exist_ok=True)
try: font = ImageFont.truetype("DejaVuSans-Bold.ttf", 28)
except Exception: font = ImageFont.load_default()
imgs = {}
for si, sc in enumerate(sb["scenes"]):
    im = imgs.setdefault(sc["image"], Image.open(f"{root}/build/shots/{sc['image']}.png").convert("RGB"))
    d = ImageDraw.Draw(im)
    for bi, b in enumerate(sc["beats"]):
        t = b.get("target")
        if not t: continue
        x, y, w, h = t["x"], t["y"], t["w"], t["h"]
        d.rectangle([x, y, x + w, y + h], outline=(255, 0, 80), width=4)
        lab = f"{si+1}.{bi+1} {b.get('do','')}"
        d.rectangle([x, y - 34, x + 14 + 17 * len(lab), y], fill=(255, 0, 80)); d.text((x + 6, y - 32), lab, fill="white", font=font)
for n, im in imgs.items():
    im.thumbnail((1600, 1600)); im.save(f"{root}/build/check/{n}.jpg", quality=85); print(f"{root}/build/check/{n}.jpg")
