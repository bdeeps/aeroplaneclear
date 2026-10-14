// Chapter 5: the jet. A turbofan moves a large mass of air slowly, and the glide after an engine failure.
import { THREE, latheX, clamp, M } from '../kit.js';
import { dots, fitNarrow } from '../plane.js';
import { AIRCRAFT, jetCompare, air, glide, KT, FT } from '../aero.js';

const THRUST = 20000;          // N, one engine at cruise (estimate for a 120 kN-class turbofan)
const N = 300;
const C_FAN = new THREE.Color(0x7aa2ff), C_CORE = new THREE.Color(0xff9a4a);

export default {
  id: 'jet',
  short: 'The jet',
  title: 'The turbofan, and a glide',
  subtitle: 'A big fan moving lots of air slowly. And what happens when the engines stop.',
  view: { pos: [7.4, 3.6, 11.0], target: [0.4, 1.3, 0] },
  learn: `<p>A jet engine pushes by throwing air backwards. The push is the air's <b>momentum</b> change: thrust = mass per second × (exit speed − flight speed). For a given thrust you can either throw a small mass very fast, or a large mass a little faster than you flew in.</p>
    <p>An early jet threw a small mass of hot gas very fast. A modern <b>turbofan</b> puts a large fan at the front. Most of the air goes round the core in a cool <b>bypass</b> stream, moving quite slowly. The ratio of bypass air to core air is the <b>bypass ratio</b>. For the most efficient engines it is about 10 or more.</p>
    <p>The fan's job is to be efficient. The ideal share of energy that goes into pushing the aeroplane, rather than leaving in the exhaust, is about <b>2v₀ ÷ (v₀ + v<sub>e</sub>)</b>. A slow exhaust speed gives a much better share. At cruise, a high-bypass engine is about 90% efficient on this measure; a pure jet is under 50%. The sum is in the readout.</p>
    <p>A <b>rocket</b> is different: it carries all its own mass and throws it out at thousands of metres per second. It does not take in air, which is why rockets work in space. See <a href="https://glassbox.how/rocketclear/" target="_blank" rel="noopener">RocketClear</a>.</p>
    <p><b>If both engines stop,</b> the aeroplane does not fall out of the sky. It <b>glides</b>. Its <b>glide ratio</b> is the distance it covers forward for each unit it drops. An airliner's is about 16 or 17 to 1 in still air, so from 10,000 m it can reach about 160 km. A light aircraft manages about 10 to 1. In practice, pilots are trained to fly the glide and find a runway, and engine-out procedures are in the flight manual.</p>
    <p class="tip"><b>Try it:</b> set the bypass ratio to 0, then to 11, and compare the stream. Then drop the aeroplane from 10 km and see how far the glide takes it.</p>`,
  terms: [
    { t: 'Momentum', d: 'Mass times velocity. Pushing air backwards gains a forward push of equal size.' },
    { t: 'Bypass ratio', d: 'The mass of air going round the core, divided by the mass going through it.' },
    { t: 'Propulsive efficiency', d: 'The share of the energy in the jet that goes into moving the aeroplane.' },
    { t: 'Glide ratio', d: 'The forward distance an aeroplane covers for each unit of height it loses, in still air.' },
    { t: 'Turbofan', d: 'A jet engine with a large ducted fan at the front, which pushes a large mass of air a little.' },
  ],
  defaults: { bypass: 11, speed: 230, cutaway: false, alt: 10000, ac: 'airliner' },
  controls: [
    { key: 'bypass', type: 'range', label: 'Bypass ratio', min: 0, max: 12, step: 0.5, ends: ['pure jet', 'high bypass'], fmt: (v) => v.toFixed(1) + ' : 1' },
    { key: 'speed', type: 'range', label: 'Flight speed', min: 0, max: 250, step: 1, fmt: (v) => `${Math.round(v)} m/s` },
    { key: 'cutaway', type: 'toggle', label: 'Cut the nacelle open' },
    { key: 'alt', type: 'range', label: 'Height when the engines stop', min: 300, max: 11000, step: 100, fmt: (v) => `${Math.round(v)} m · ${Math.round(v / FT / 100) * 100} ft` },
    { key: 'ac', type: 'seg', label: 'Aircraft', options: [{ v: 'light', label: 'Light aircraft' }, { v: 'airliner', label: 'Airliner' }] },
  ],
  quiz: [
    { q: 'Why is a high-bypass turbofan efficient?', options: ['It throws a small mass very fast', 'It moves a large mass of air a little faster than the flight speed', 'It burns no fuel', 'It flies only at night'], answer: 1, why: 'Thrust = mass per second × speed change. A large mass with a small speed change wastes less energy in the exhaust.' },
    { q: 'What is a glide ratio of 16:1?', options: ['It falls 16 times faster than it moves forward', 'It moves forward 16 units for each unit it drops, in still air', 'It weighs 16 tonnes', 'It uses 16 litres of fuel a second'], answer: 1, why: 'Glide ratio is forward distance per unit of height lost. At 10 km high it could reach about 160 km.' },
    { q: 'What does a rocket do that a jet engine does not?', options: ['It takes in air to burn', 'It carries all its own mass and does not need air', 'It burns only water', 'It has a propeller'], answer: 1, why: 'A rocket throws its own propellant out. It needs no air, so it works in space.' },
  ],
  reel: [
    { ms: 5000, caption: 'A turbofan moves a large mass of air a little, which is efficient.', set: { bypass: 11, speed: 230, cutaway: true }, anim: {}, view: { pos: [5.0, 2.6, 7.6], target: [0.4, 0.2, 0] }, spin: 0.3 },
    { ms: 5000, caption: 'With both engines stopped, an airliner glides about 16 km for every km it falls.', set: { alt: 10000, ac: 'airliner', bypass: 11, cutaway: false }, anim: { alt: [1000, 10000] }, spin: 0 },
  ],

  build({ stage, label }) {
    // The engine flies towards +X: intake at the front (+X), exhaust at the back (−X).
    const root = new THREE.Group();
    stage.root.add(root);
    const engMat = M.metal(0x9aa3b2, { roughness: 0.35, side: THREE.DoubleSide });
    const darkMat = M.matte(0x1b1f29, { side: THREE.DoubleSide });
    const prof = [[-3.6, 0.9], [-2.6, 1.25], [-0.6, 1.5], [1.2, 1.5], [3.2, 1.45], [4.2, 1.2]];
    const nacelle = latheX(prof, engMat, { seg: 64 });
    const cut = latheX(prof, engMat, { seg: 64, phiStart: 0, phiLength: Math.PI * 1.4 });
    cut.visible = false;
    root.add(nacelle, cut);
    root.add(latheX([[-1.5, 0.2], [0.8, 0.55], [3.4, 0.5], [3.9, 0.12]], darkMat, { seg: 32 }));
    root.add(latheX([[4.2, 0.8], [4.9, 0.02]], engMat, { seg: 40 }));          // spinner
    // The fan: a disc of blades at the intake, which spins.
    const fan = new THREE.Group();
    fan.position.x = 2.9;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.3, 24), darkMat);
    hub.rotation.z = Math.PI / 2; fan.add(hub);
    for (let i = 0; i < 18; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.1, 0.06), M.metal(0xc9d1dc, { roughness: 0.3 }));
      blade.position.set(0, 0.7, 0);
      const arm = new THREE.Group(); arm.add(blade); arm.rotation.x = (i / 18) * Math.PI * 2;
      fan.add(arm);
    }
    root.add(fan);
    root.scale.setScalar(0.8);

    // Air: the fan stream (outer annulus) and the core stream, both moving backwards (−X).
    const flow = dots(N, 0.07, 0xffffff);
    root.add(flow);
    const P = [];
    let q = 11;
    const rnd = () => ((q = (q * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < N; i++) P.push({ x: -5 + rnd() * 10, th: rnd() * Math.PI * 2, u: rnd() });

    const L1 = (text, pos, cls) => label(text, pos, root, cls);
    L1('Fan', [2.9, 1.7, 0], 'hot');
    L1('Bypass air', [-1.2, -1.9, 1.6], 'soft');
    L1('Core jet', [-3.2, -0.9, 0], 'soft');

    let rot = 0;
    return {
      update(dt, s) {
        fitNarrow(stage);
        cut.visible = !!s.cutaway; nacelle.visible = !s.cutaway;
        rot += dt * 6;
        fan.rotation.x = rot;
        const r = jetCompare(THRUST, s.speed, s.bypass);
        const fracFan = s.bypass / (1 + s.bypass);     // share of the air that goes round the core
        // Visual speed: the speed added to the air, scaled so the streams read at a glance.
        const vis = clamp(0.5 + 1.2 * (r.dv / 150), 0.5, 3.0);
        for (let i = 0; i < N; i++) {
          const p = P[i];
          const fanStream = p.u < fracFan;
          const rad = fanStream ? 1.0 + 0.3 * Math.sin(p.th * 3.1 + i) : 0.22;   // annulus or core
          p.x -= dt * vis * (fanStream ? 1 : 1.5);
          if (p.x < -6) { p.x = 5.5; p.th = rnd() * Math.PI * 2; p.u = rnd(); }
          flow.place(i, p.x, Math.cos(p.th) * rad, Math.sin(p.th) * rad, 1);
          flow.tint(i, fanStream ? C_FAN : C_CORE);
        }
        flow.done();
      },
      readout: (s) => {
        const r = jetCompare(THRUST, s.speed, s.bypass);
        const cfg = AIRCRAFT[s.ac];
        const g = glide(cfg);
        const a = air(s.alt);
        const vb = g.vBest(a.rho);
        const sink = vb / g.LDmax;               // m/s down at best glide
        const dist = (s.alt * g.LDmax) / 1000;   // km in still air
        const mins = s.alt / sink / 60;
        return `<div class="big">Propulsive efficiency ${(r.eta * 100).toFixed(0)}%</div>
          <div class="row"><span>Bypass ratio</span><b>${s.bypass.toFixed(1)} : 1</b></div>
          <div class="row"><span>Air pushed back, per second</span><b>${r.mTot.toFixed(0)} kg</b></div>
          <div class="row"><span>Speed added to that air</span><b>${r.dv.toFixed(0)} m/s</b></div>
          <div class="row"><span>Thrust per engine</span><b>${(THRUST / 1000).toFixed(0)} kN</b></div>
          <div class="row"><span>Glide ratio (best)</span><b>${g.LDmax.toFixed(1)} : 1</b></div>
          <div class="row"><span>Glide from ${(s.alt / 1000).toFixed(1)} km</span><b>${dist.toFixed(0)} km</b></div>
          <div class="row"><span>Time in the glide</span><b>${mins.toFixed(0)} min</b></div>
          <p class="hint" style="position:static;margin:8px 0 0;font-size:13px;color:var(--dim)">Still air, best glide speed ${Math.round(vb / KT)} kt. Estimates. Pilots fly an engine-out procedure from the flight manual.</p>`;
      },
    };
  },
};
