# Copies screenshots into build/shots, making them all the same size as the first one
# (resize to same width, then pad/crop height). Prints the size Claude must use for target boxes.
# usage: python3 prepare.py PROJECT_DIR
import sys, os, json, glob
from PIL import Image
root = sys.argv[1]; sb = json.load(open(f"{root}/storyboard.json"))
os.makedirs(f"{root}/build/shots", exist_ok=True)
names = list(dict.fromkeys(sc["image"] for sc in sb["scenes"]))
def find(n):
    for ext in ("", ".png", ".jpg", ".jpeg", ".webp"):
        p = f"{root}/screenshots/{n}{ext}"
        if os.path.isfile(p): return p
    sys.exit(f"screenshot not found: {n}")
W = H = None
for n in names:
    im = Image.open(find(n)).convert("RGB")
    if W is None: W, H = im.size
    if im.size != (W, H):
        im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
        canvas = Image.new("RGB", (W, H), im.getpixel((W // 2, im.height - 1))); canvas.paste(im, (0, 0)); im = canvas
        print(f"  note: {n} resized/padded to {W}x{H}")
    im.save(f"{root}/build/shots/{n}.png")
json.dump({"width": W, "height": H}, open(f"{root}/build/shots/meta.json", "w"))
print(f"OK {len(names)} screenshots, size {W}x{H} px. Target boxes are in these pixels.")
