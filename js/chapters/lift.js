// Chapter 2: lift. A slice through the wing, the lift equation and the stall.
import { THREE, arrow, approach, clamp } from '../kit.js';
import { makeSection, board, dots } from '../plane.js';
import { AIRCRAFT, Airfoil, RHO0, KT, clOf, criticalAlpha, lift, stallSpeed, weight, G, rhoOf } from '../aero.js';

const N = 300;                       // flow particles
const SPAWN_X = -3.7;                // upstream, in the section's own units (chord = 4.03)
const C_SLOW = new THREE.Color(0xff9a4a), C_FAST = new THREE.Color(0x3fb8ff), C_SEP = new THREE.Color(0xd6dbe6);
const tint = (sp, out) => out.copy(C_SLOW).lerp(C_FAST, clamp((sp - 0.6) / 0.9, 0, 1));

// Real (Joukowski) lift and the equal-transit story for a given angle.
function myth(alpha) {
  const base = new Airfoil(0.09, 0.08, 0);
  const a = base.arcs();
  const r = a.top / a.bottom;                       // path ratio from the section outline
  const clMyth = r * r - 1;                          // Cp = 1 − (speed)², so ΔCp ≈ r² − 1
  const clReal = new Airfoil(0.09, 0.08, alpha).cl;
  return { r, clMyth, clReal, share: clMyth / Math.max(0.05, clReal) };
}

export default {
  id: 'lift',
  short: 'Lift',
  title: 'Where lift comes from',
  subtitle: 'The wing turns the air down. The air pushes the wing up.',
  view: { pos: [1.0, 1.2, 10.5], target: [0.9, 0.0, 0] },
  learn: `<p>Air is made of tiny moving bits. When a wing pushes through it, the wing <b>turns the air down</b>. Newton's third law says that if the air is pushed down, it pushes the wing up with an equal and opposite force. That push is <b>lift</b>.</p>
    <p>The curved top of the aerofoil and the tilt (the <b>angle of attack</b>) both bend the air. The faster the wing moves through the air, the harder it turns the air. Lift grows with the <b>square</b> of the speed:</p>
    <p class="tip"><b>Lift = ½ × air density × speed² × wing area × C<sub>L</sub></b>, where <b>C<sub>L</sub></b> is the wing's lift coefficient, which depends on its shape and angle.</p>
    <p>Tilt the wing up and C<sub>L</sub> climbs, until the air can no longer follow the top surface. The flow <b>separates</b>, leaves the wing in swirls, and lift falls off. That is a <b>stall</b>. A stall is about the angle, not the speed, so it can happen at any speed.</p>
    <p><b>Stall speed</b> is the slowest speed at which the lift still equals the weight. For a light aircraft it is about 50 knots; for an airliner, it is around 125 to 160 knots, depending on the flaps.</p>
    <p>A common story says the air over the top has to race to meet the air below at the back of the wing, because it travels a longer path. That is the <b>equal transit time</b> myth, and it is wrong. The air over the top is not forced to rejoin, and it speeds up far more than the myth allows. See <a href="https://glassbox.how/bernoulliclear/" target="_blank" rel="noopener">BernoulliClear</a> for the pressure side, and <a href="https://glassbox.how/newtonclear/" target="_blank" rel="noopener">NewtonClear</a> for the push on the air.</p>
    <p class="tip"><b>Try it:</b> raise the angle until the wing stalls, then switch on the myth and see how little lift it can explain.</p>`,
  terms: [
    { t: 'Angle of attack', d: 'The angle between the wing\'s chord line and the air flowing at it.' },
    { t: 'Lift coefficient', d: 'A number C_L that describes how much lift a wing shape makes at a given angle.' },
    { t: 'Stall', d: 'When the air separates from the wing top at too high an angle, so lift drops.' },
    { t: 'Stall speed', d: 'The lowest steady speed at which the wing can still carry the weight.' },
    { t: 'Equal transit time', d: 'A wrong story that says air over the top must reach the trailing edge with the air below.' },
  ],
  defaults: { alpha: 4, speed: 60, aircraft: 'light', showMyth: false },
  controls: [
    { key: 'alpha', type: 'range', label: 'Angle of attack', min: -4, max: 20, step: 0.1, ends: ['level', 'steep'], fmt: (v) => v.toFixed(1) + '°' },
    { key: 'speed', type: 'range', label: 'Air speed', min: 20, max: 250, step: 1, fmt: (v) => `${Math.round(v)} m/s · ${Math.round(v / KT)} kt` },
    { key: 'aircraft', type: 'seg', label: 'Aircraft', options: [{ v: 'light', label: 'Light aircraft' }, { v: 'airliner', label: 'Airliner' }] },
    { key: 'showMyth', type: 'toggle', label: 'Show the equal-transit story', hint: 'The story says the air over the top must rush to meet the air below.' },
  ],
  quiz: [
    { q: 'What is the air doing as a wing makes lift?', options: ['Being pulled up by the wing', 'Being turned down by the wing', 'Standing still', 'Being heated up and sucked in'], answer: 1, why: 'The wing turns the air down, and the air pushes the wing up. That is Newton\'s third law at work.' },
    { q: 'Lift grows with the air speed squared. If you double your speed, lift goes up by about...', options: ['Two times', 'Four times', 'Eight times', 'Not at all'], answer: 1, why: 'Lift = ½ρv²SC_L, so doubling v multiplies lift by 2² = 4 at the same angle.' },
    { q: 'Why does a wing stall?', options: ['It flies too fast', 'The air separates from the top at too steep an angle', 'The engine stops', 'The weight is too low'], answer: 1, why: 'When the angle is too steep the air can no longer follow the curved top. It separates and lift falls.' },
  ],
  reel: [
    { ms: 5000, caption: 'A wing tilts into the air and turns the air downwards. The air pushes the wing up.', set: { alpha: 5, speed: 70, aircraft: 'airliner', showMyth: false }, anim: { alpha: [0, 5] }, view: { pos: [0.6, 0.3, 5.4], target: [0.6, -0.2, 0] }, spin: 0 },
    { ms: 5000, caption: 'Tilt too far and the air leaves the top of the wing. Lift falls. That is a stall.', set: { speed: 110, aircraft: 'airliner', showMyth: false }, anim: { alpha: [5, 18] }, spin: 0 },
  ],

  build({ stage, label }) {
    const sec = makeSection(0, 3.4);
    stage.root.add(sec.group);
    const cs = sec.scale;
    const toScene = (x, y) => [(x - sec.airfoil.xLE) * cs - 1.6, y * cs];

    // A freestream arrow and a chord-line label, both in the scene's fixed frame.
    const fs = arrow(0x7aa2ff, 2.2, 0.3, 0.035);
    fs.rotation.z = -Math.PI / 2; fs.position.set(-4.4, 0.0, 0);
    stage.root.add(fs);
    label('Air', [-4.4, 0.7, 0], stage.root, 'soft');

    // Streamlines: the potential flow traced from seeds upstream, drawn in the section's own frame
    // (so they tilt with the wing). Dots ride along them, so the speed reads at a glance.
    const SEEDS = 16, STEPS = 420, DT = 0.03;
    const linesGeo = new THREE.BufferGeometry();
    const linePos = new Float32Array(SEEDS * STEPS * 6), lineCol = new Float32Array(SEEDS * STEPS * 6);
    linesGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    linesGeo.setAttribute('color', new THREE.BufferAttribute(lineCol, 3));
    const lines = new THREE.LineSegments(linesGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55 }));
    sec.group.add(lines);
    const DOTS = SEEDS * 2;
    const pts = dots(DOTS, 0.035, 0xffffff);
    sec.group.add(pts);
    const streams = [];                 // per seed: array of [x, y, speed] in the section frame
    const phase = new Float32Array(DOTS).map((_, i) => ((i * 37) % 97) / 97);
    const rnd = (() => { let q = 7; return () => ((q = (q * 16807) % 2147483647) / 2147483647); })();
    function traceAll(af) {
      streams.length = 0;
      for (let k = 0; k < SEEDS; k++) {
        const y0 = -2.3 + (4.6 * (k + 0.5)) / SEEDS;
        const p = [SPAWN_X, y0];
        const line = [];
        for (let i = 0; i < STEPS; i++) {
          const sp = af.speedAt(p[0], p[1]);
          line.push([p[0], p[1], sp]);
          if (!af.step(p, DT) || p[0] > 3.4 || Math.abs(p[1]) > 3.2) break;
        }
        streams.push(line);
      }
      // Write the polylines into the buffer; unused tail is collapsed.
      let n = 0;
      for (const line of streams) {
        for (let i = 0; i < line.length - 1; i++) {
          const [xa, ya, sa] = line[i], [xb, yb, sb] = line[i + 1];
          const A = toScene(xa, ya), B = toScene(xb, yb);
          linePos.set([A[0], A[1], 0, B[0], B[1], 0], n * 3);
          const ca = tint(sa, new THREE.Color()), cb = tint(sb, new THREE.Color());
          lineCol.set([ca.r, ca.g, ca.b, cb.r, cb.g, cb.b], n * 3);
          n += 2;
        }
      }
      linesGeo.setDrawRange(0, n);
      linesGeo.attributes.position.needsUpdate = true; linesGeo.attributes.color.needsUpdate = true;
    }
    const chart = board(stage.root, 3.0, 1.92, [2.2, -2.1, 0], (g, w, h, st) => drawChart(g, w, h, st));
    let myt = null, drawnKey = "", af = null, afAlpha = NaN, sep = 0;
    const c = new THREE.Color();

    function drawChart(g, w, h, st = { aircraft: "light", alpha: 4 }) {
      g.fillStyle = 'rgba(10,12,18,.9)'; g.fillRect(0, 0, w, h);
      const x0 = 110, x1 = w - 40, y0 = h - 140, y1 = 90;
      const X = (a) => x0 + ((a + 4) / 24) * (x1 - x0), Y = (cl) => y0 - (cl / 2.2) * (y0 - y1);
      g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.moveTo(x0, y0); g.lineTo(x0, y1); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '44px sans-serif';
      g.fillText('C_L', x0 - 90, y1 + 20); g.fillText('angle of attack', x1 - 360, y0 + 84);
      g.fillText('0°', X(0) - 10, y0 + 50); g.fillText('20°', X(20) - 30, y0 + 50);
      for (const [a, cfg, col] of [[0, AIRCRAFT.light, '#3fb8ff'], [0, AIRCRAFT.airliner, '#ffb547']]) {
        g.strokeStyle = col; g.lineWidth = 5; g.beginPath();
        for (let al = -4; al <= 20; al += 0.25) { const cl = clOf(cfg, al, cfg.CLmax); al === -4 ? g.moveTo(X(al), Y(cl)) : g.lineTo(X(al), Y(cl)); }
        g.stroke();
      }
      const cfg = AIRCRAFT[st.aircraft], crit = criticalAlpha(cfg);
      g.setLineDash([12, 10]); g.strokeStyle = 'rgba(255,120,120,.8)'; g.beginPath(); g.moveTo(X(crit), y0); g.lineTo(X(crit), y1); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#ff9d9d'; g.font = '40px sans-serif'; g.fillText('stall ' + crit.toFixed(0) + '°', X(crit) - 40, y1 - 14);
      const cl = clOf(cfg, st.alpha, cfg.CLmax);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(X(st.alpha), Y(cl), 13, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.9)'; g.font = '40px sans-serif'; g.fillStyle = '#3fb8ff'; g.fillRect(x0 + 20, 50, 40, 12); g.fillStyle = 'rgba(255,255,255,.9)'; g.fillText('light', x0 + 75, 66); g.fillStyle = '#ffb547'; g.fillRect(x0 + 220, 50, 40, 12); g.fillStyle = 'rgba(255,255,255,.9)'; g.fillText('airliner', x0 + 275, 66);
    }

    return {
      update(dt, s) {
        const alpha = s.alpha;
        if (alpha !== afAlpha) {
          afAlpha = alpha;
          af = new Airfoil(0.09, 0.08, alpha);
          sec.group.rotation.z = -alpha * Math.PI / 180;     // nose up: the leading edge rises
          myt = myth(alpha);
          traceAll(af);
        }
        const cfg = AIRCRAFT[s.aircraft];
        const stalled = alpha > criticalAlpha(cfg, cfg.CLmax);
        sep = approach(sep, stalled ? 1 : 0, 3, dt);
        // Dots ride the streamlines; in a stall the flow over the top breaks up, so the dots jitter.
        for (let i = 0; i < DOTS; i++) {
          const line = streams[i % SEEDS];
          if (!line || line.length < 2) { pts.place(i, 0, 0, 0, 0.0001); continue; }
          phase[i] = (phase[i] + dt * 0.12) % 1;
          const idx = Math.floor(phase[i] * (line.length - 1));
          const [x, y, sp] = line[idx];
          let [X, Y] = toScene(x, y);
          if (sep > 0.05 && x > -0.6 && x < 2.0 && y > 0.05 && y < 1.4) { X += (rnd() - 0.5) * 0.12 * sep; Y += (rnd() - 0.5) * 0.12 * sep; }
          pts.place(i, X, Y, 0, 1);
          pts.tint(i, sep > 0.5 && x > -0.6 && x < 2.0 && y > 0.05 ? C_SEP : tint(sp, c));
        }
        pts.done();
        const key = s.aircraft + '|' + s.alpha.toFixed(1);
        if (key !== drawnKey) { drawnKey = key; chart.redraw(s); }
      },
      readout: (s) => {
        const cfg = AIRCRAFT[s.aircraft];
        const rho = rhoOf(0);
        const cl = clOf(cfg, s.alpha, cfg.CLmax);
        const L = lift(cfg, rho, s.speed, s.alpha);
        const Vs = stallSpeed(cfg, rho);
        const stalled = s.alpha > criticalAlpha(cfg, cfg.CLmax);
        if (s.showMyth) {
          return `<div class="big">The equal-transit story</div>
            <div class="row"><span>Top path ÷ bottom path</span><b>${myt.r.toFixed(3)}</b></div>
            <div class="row"><span>Lift the story can explain</span><b>C_L ≈ ${myt.clMyth.toFixed(3)}</b></div>
            <div class="row"><span>Lift this section makes at ${s.alpha.toFixed(0)}°</span><b>C_L ≈ ${myt.clReal.toFixed(2)}</b></div>
            <p class="hint" style="position:static;margin:8px 0 0;font-size:13px;color:var(--dim)">The story gives about ${Math.round(myt.share * 100)}% of the real lift here. The air over the top speeds up far more than the path ratio, and the rest comes from turning the air down.</p>`;
        }
        return `<div class="big">${stalled ? 'Stalled: lift is falling' : 'Lift: ' + (L / 1000).toFixed(1) + ' kN'}</div>
          <div class="row"><span>Lift coefficient C<sub>L</sub></span><b>${cl.toFixed(2)}</b></div>
          <div class="row"><span>Lift ÷ weight</span><b>${(L / weight(cfg)).toFixed(2)}</b></div>
          <div class="row"><span>Stall speed (sea level)</span><b>${Math.round(Vs / KT)} kt</b></div>
          <div class="row"><span>Stall angle</span><b>${criticalAlpha(cfg, cfg.CLmax).toFixed(1)}°</b></div>`;
      },
    };
  },
};
