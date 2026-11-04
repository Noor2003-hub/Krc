# Overlays a labelled pixel grid on a screenshot so positions can be read precisely.
# usage: python3 grid.py PROJECT_DIR IMAGE_NAME [x y w h]   (optional crop region, in pixels)
#   -> build/grid/<name>[_crop].jpg   Grid labels are ORIGINAL image pixel coordinates.
import sys, os
from PIL import Image, ImageDraw, ImageFont
root, name = sys.argv[1], sys.argv[2]; os.makedirs(f"{root}/build/grid", exist_ok=True)
im = Image.open(f"{root}/build/shots/{name}.png").convert("RGB"); ox = oy = 0
if len(sys.argv) >= 7:
    x, y, w, h = map(int, sys.argv[3:7]); im = im.crop((x, y, x + w, y + h)); ox, oy = x, y
W, H = im.size; scale = min(1.0, 1600 / max(W, H)); disp = im.resize((round(W * scale), round(H * scale)))
span = max(W, H); step = next(s for s in (10, 20, 25, 50, 100, 200, 250, 500) if span / s <= 22)
d = ImageDraw.Draw(disp, "RGBA")
try: f = ImageFont.truetype("DejaVuSans.ttf", 13)
except Exception: f = ImageFont.load_default()
for gx in range((ox // step + 1) * step, ox + W, step):
    X = (gx - ox) * scale; d.line([(X, 0), (X, disp.height)], fill=(255, 0, 80, 110), width=1); d.text((X + 2, 2), str(gx), fill=(200, 0, 60), font=f)
for gy in range((oy // step + 1) * step, oy + H, step):
    Y = (gy - oy) * scale; d.line([(0, Y), (disp.width, Y)], fill=(0, 120, 255, 110), width=1); d.text((2, Y + 1), str(gy), fill=(0, 90, 220), font=f)
out = f"{root}/build/grid/{name}{'_crop' if ox or oy or len(sys.argv) >= 7 else ''}.jpg"; disp.save(out, quality=88); print(out, f"(grid every {step}px)")
