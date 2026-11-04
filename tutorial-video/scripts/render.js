// Renders the tutorial frame-by-frame (assets/player.html) and encodes it with the narration.
// usage: node render.js PROJECT_DIR                 -> output/<name>.mp4
//        node render.js PROJECT_DIR --stills 5,20,40 -> build/stills/*.jpg (quick visual check)
const path = require('path'), fs = require('fs'), { spawn } = require('child_process');
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright')); }
const root = path.resolve(process.argv[2] || '.'), FPS = 30;
const SB = JSON.parse(fs.readFileSync(`${root}/storyboard.json`)), TL = JSON.parse(fs.readFileSync(`${root}/build/timeline.json`));
const images = {}; for (const sc of SB.scenes) images[sc.image] ??= 'data:image/png;base64,' + fs.readFileSync(`${root}/build/shots/${sc.image}.png`).toString('base64');
let logo = null; if (SB.logo) { const f = path.resolve(root, SB.logo), ext = path.extname(f).slice(1).replace('jpg', 'jpeg').replace('svg', 'svg+xml'); logo = `data:image/${ext};base64,` + fs.readFileSync(f).toString('base64'); }
(async () => {
  const b = await chromium.launch({ args: ['--font-render-hinting=none'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + path.resolve(__dirname, '../assets/player.html'));
  await p.evaluate(([a, c, l]) => init(a, c, l), [TL, images, logo]);
  const si = process.argv.indexOf('--stills');
  if (si > 0) {
    fs.mkdirSync(`${root}/build/stills`, { recursive: true });
    let times = process.argv[si + 1];
    if (!times || times === 'auto') { // one frame inside every beat + intro + outro
      times = [TL.intro.end * 0.6]; TL.scenes.forEach(sc => sc.beats.forEach(bt => times.push(+(bt.start + (bt.end - bt.start) * 0.62).toFixed(2)))); times.push(TL.outro.start + 2.5);
    } else times = times.split(',').map(Number);
    for (const f of fs.readdirSync(`${root}/build/stills`)) fs.unlinkSync(`${root}/build/stills/${f}`);
    let i = 0; for (const t of times) { await p.evaluate(t => render(t), t); const f = `${root}/build/stills/s${String(++i).padStart(2, '0')}_t${t}.jpg`; await p.screenshot({ path: f, type: 'jpeg', quality: 85 }); }
    await b.close();
    const sheet = `${root}/build/stills/contact-sheet.jpg`, cols = 3, rows = Math.ceil(times.length / cols);
    require('child_process').execSync(`ffmpeg -loglevel error -y -pattern_type glob -i '${root}/build/stills/s*.jpg' -vf "scale=640:-1,tile=${cols}x${rows}:padding=6:color=white" -frames:v 1 '${sheet}'`);
    console.log(`${times.length} stills in build/stills/ + ${sheet}`); return;
  }
  fs.mkdirSync(`${root}/output`, { recursive: true });
  const name = (SB.output || SB.title || 'tutorial').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-');
  const out = `${root}/output/${name}.mp4`, N = Math.ceil(TL.duration * FPS);
  const args = ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', `${root}/build/narration.wav`];
  let amap = ['-map', '0:v', '-map', '1:a'];
  if (SB.music) { // optional background music, looped, quiet, faded out at the end
    args.push('-stream_loop', '-1', '-i', path.resolve(root, SB.music));
    const vol = SB.music_volume ?? 0.12, d = TL.duration;
    args.push('-filter_complex', `[2:a]volume=${vol},afade=t=in:d=1.5,afade=t=out:st=${(d - 3).toFixed(2)}:d=3[m];[1:a][m]amix=inputs=2:duration=first:normalize=0[a]`);
    amap = ['-map', '0:v', '-map', '[a]'];
  }
  args.push(...amap, '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.1', '-preset', 'medium', '-crf', '20', '-maxrate', '8M', '-bufsize', '16M', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-ar', '48000', '-ac', '2', '-b:a', '192k', '-t', TL.duration.toFixed(2), '-movflags', '+faststart', out);
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < N; f++) {
    await p.evaluate(t => render(t), f / FPS);
    const buf = await p.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 300 === 0) console.log(`frame ${f}/${N}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end(); const code = await new Promise(r => ff.on('close', r)); await b.close();
  if (code) { console.error('ffmpeg failed'); process.exit(1); }
  console.log('DONE ' + out);
})();
