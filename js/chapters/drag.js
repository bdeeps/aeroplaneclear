// Chapter 3: drag and thrust. What it takes to keep flying, and why thin air changes the take-off.
import { arrow, clamp } from '../kit.js';
import { makeAirliner, board, fitNarrow } from '../plane.js';
import {
  AIRCRAFT, air, CLlevel, CDof, dragAt, takeoffRun, densityAltitude, stallSpeed, G, KT, FT, aspect,
} from '../aero.js';

const DA = (h, dT) => densityAltitude(air(h, dT).rho);
// Four places to take off from: the same aeroplane, very different air.
const PLACES = [
  { label: 'Sea level, 15 °C', h: 0, dT: 0 },
  { label: 'Sea level, 40 °C', h: 0, dT: 25 },
  { label: 'Leh, −6 °C', h: 3256, dT: 0 },
  { label: 'Leh, 20 °C', h: 3256, dT: 26 },
];
// Take-off distances, worked once: a ground run to lift-off for each aircraft in each place.
const RUNS = Object.fromEntries(['light', 'airliner'].map((k) => [k, PLACES.map((p) => takeoffRun(AIRCRAFT[k], air(p.h, p.dT).rho))]));

// Take-off run for the airliner at a given air density, cached so the readout stays light.
const runCache = new Map();
function runHere(rho) {
  const k = Math.round(rho * 1000);
  if (!runCache.has(k)) runCache.set(k, { airliner: rho > 0.5 ? takeoffRun(AIRCRAFT.airliner, rho).dist : NaN });
  return runCache.get(k);
}

export default {
  id: 'drag',
  short: 'Thrust and drag',
  title: 'Thrust against drag',
  subtitle: 'Keep flying and the engines must match the drag. Thin air changes everything.',
  view: { pos: [6.8, 3.8, 11.8], target: [0.2, 0.9, 0] },
  learn: `<p>Drag is the air pushing back on the aeroplane. It has two parts. <b>Parasite drag</b> comes from the skin and the shape. <b>Induced drag</b> comes with making lift: the wing tips leak air round the ends, and that costs energy. Both grow with the speed squared, and induced drag is bigger at low speed and high lift.</p>
    <p>In steady level flight, <b>thrust = drag</b>. The engines push forward as hard as the air pushes back. To climb, the engines must add a bit more: the extra thrust lifts the weight up the slope. That is why a climbing aeroplane needs more power.</p>
    <p>The aeroplane's efficiency is its <b>lift-to-drag ratio</b>. An airliner in cruise has about 16 units of lift for each unit of drag. A light aircraft gliding at its best speed manages around 10 to 11.</p>
    <p>Air gets thinner as you climb, and warmer air is thinner too. Thinner air gives less lift and less engine thrust, so the aeroplane must go faster to take off. The <b>density altitude</b> is the height in the standard air that has the same density. On a hot day at Leh, it can be more than 3,500 m even though the airport is 3,256 m above the sea.</p>
    <p>Take-off is a race. Thrust pushes, drag and rolling friction hold back, and the run ends when the wing can carry the weight. In thin, hot air the run gets much longer.</p>
    <p class="tip"><b>Try it:</b> set the place to Leh on a warm day, then check how much longer the take-off run gets.</p>`,
  terms: [
    { t: 'Parasite drag', d: 'Drag from the air rubbing and swirling over the skin and shape, whether or not the aeroplane makes lift.' },
    { t: 'Induced drag', d: 'Drag that comes with lift. Air leaking round the wing tips costs energy.' },
    { t: 'Lift-to-drag ratio', d: 'How much lift a wing makes for each unit of drag. Higher is more efficient.' },
    { t: 'Density altitude', d: 'The height in standard air that has the same density as the air you are in.' },
    { t: 'Rolling resistance', d: 'The friction of the wheels on the runway, which holds back the take-off run.' },
  ],
  defaults: { aircraft: 'airliner', speed: 230, height: 11000, hot: 0, climb: 0 },
  controls: [
    { key: 'aircraft', type: 'seg', label: 'Aircraft', options: [{ v: 'light', label: 'Light aircraft' }, { v: 'airliner', label: 'Airliner' }] },
    { key: 'speed', type: 'range', label: 'Air speed', min: 25, max: 250, step: 1, fmt: (v) => `${Math.round(v)} m/s · ${Math.round(v / KT)} kt` },
    { key: 'height', type: 'range', label: 'Height', min: 0, max: 11000, step: 100, ends: ['sea level', '11 km'], fmt: (v) => `${Math.round(v)} m · ${Math.round(v / FT / 100) * 100} ft` },
    { key: 'hot', type: 'seg', label: 'Air temperature', options: [{ v: 0, label: 'Standard' }, { v: 15, label: '+15 °C hot' }], fmt: (v) => (v ? 'hotter than standard' : 'standard for that height') },
    { key: 'climb', type: 'range', label: 'Climb angle', min: 0, max: 10, step: 0.1, fmt: (v) => v.toFixed(1) + '°' },
  ],
  quiz: [
    { q: 'In steady level flight, which pair balances?', options: ['Lift and drag', 'Thrust and drag', 'Weight and thrust', 'Lift and thrust'], answer: 1, why: 'Level flight at a steady speed: thrust equals drag, and lift equals weight.' },
    { q: 'Why does an aeroplane need more thrust to climb?', options: ['Because the air is colder', 'Because part of the thrust must lift the weight up the slope', 'Because the wings stop working', 'Because the fuel is heavier'], answer: 1, why: 'Thrust must be drag plus the weight component along the flight path, T = D + W sin γ.' },
    { q: 'On a hot day at a high airport, what happens to the take-off run?', options: ['It gets shorter', 'It stays the same', 'It gets longer, because the air is thinner', 'The aeroplane cannot fly at all'], answer: 2, why: 'Thin air gives less lift and less thrust, so the aeroplane must accelerate further to reach flying speed.' },
  ],
  reel: [
    { ms: 5000, caption: 'In level flight, thrust pushes forward exactly as hard as drag pushes back.', set: { aircraft: 'airliner', speed: 230, height: 11000, hot: 0, climb: 0 }, anim: {}, view: { pos: [5.4, 3.0, 9.4], target: [0.2, 0.9, 0] }, spin: 0 },
    { ms: 5000, caption: 'Thin hot air gives less lift and thrust, so the take-off run gets longer.', set: { aircraft: 'airliner', height: 3256, hot: 15, speed: 150, climb: 0 }, anim: {}, spin: 0.3 },
  ],

  build({ stage, label }) {
    const plane = makeAirliner();
    stage.root.add(plane.root);
    plane.setFlaps(0); plane.setSlats(0);
    // Force arrows: thrust forward, drag back, lift up, weight down. Lengths are square-rooted so
    // the small forces still show.
    const mk = (color) => { const a = arrow(color, 1, 0.5, 0.11); stage.root.add(a); return a; };
    const aT = mk(0x7af0a8), aD = mk(0xff7a59), aL = mk(0x7aa2ff), aW = mk(0xffb547);
    aT.rotation.z = -Math.PI / 2; aD.rotation.z = Math.PI / 2; aW.rotation.z = Math.PI;
    // Each force starts where it acts: thrust at the engine, drag at the tail, lift and weight at the centre.
    aT.position.set(1.6, -0.5, 1.8); aD.position.set(-3.3, 0.9, 0); aL.position.set(0, 0.6, 0); aW.position.set(0, 0.6, 0);
    const L1 = (text, pos, cls) => label(text, pos, stage.root, cls);
    L1('Thrust', [1.6, 0.4, 2.0], 'hot');
    L1('Drag', [-5.0, 1.6, 0], 'soft');
    L1('Lift', [0.6, 3.6, 0], 'soft');
    L1('Weight', [0.6, -2.4, 0.2], 'soft');

    // Take-off board: ground run to lift-off for each place and aircraft (worked once, at build).
    const maxRun = Math.max(...Object.values(RUNS).flat().map((r) => r.dist));
    const bd = board(stage.root, 3.6, 2.3, [-3.7, -2.5, 3.2], (g, w, h) => {
      g.fillStyle = 'rgba(10,12,18,.94)'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,.95)'; g.font = '62px sans-serif';
      g.fillText('Ground run to lift-off (m)', 40, 88);
      PLACES.forEach((p, i) => {
        const y = 190 + i * 150;
        const dA = RUNS.airliner[i].dist, dL = RUNS.light[i].dist;
        const sc = (v) => (v / maxRun) * 560;
        g.fillStyle = 'rgba(255,255,255,.8)'; g.font = '48px sans-serif';
        g.fillText(p.label + ' · alt. ' + Math.round(DA(p.h, p.dT) / FT / 10) * 10 + ' ft', 40, y - 16);
        g.fillStyle = '#ffb547'; g.fillRect(40, y, sc(dA), 34);
        g.fillStyle = '#fff'; g.font = '46px sans-serif'; g.fillText('airliner ' + Math.round(dA), 56 + sc(dA), y + 30);
        g.fillStyle = '#3fb8ff'; g.fillRect(40, y + 46, sc(dL), 26);
        g.fillStyle = '#fff'; g.font = '46px sans-serif'; g.fillText('light ' + Math.round(dL), 56 + sc(dL), y + 70);
      });
    });
    bd.mesh.rotation.y = 0.45;

    return {
      update(dt, s) {
        fitNarrow(stage);
        const cfg = AIRCRAFT[s.aircraft];
        const mass = cfg.cruiseMass && s.aircraft === 'airliner' ? cfg.cruiseMass : cfg.mass;
        const a = air(s.height, s.hot);
        const v = Math.max(1, s.speed);
        const CL = CLlevel(cfg, a.rho, v, mass);
        const D = dragAt(cfg, a.rho, v, CL);
        const gam = s.climb * Math.PI / 180;
        const W = mass * G;
        const T = D + W * Math.sin(gam);
        const sc = (F) => 3.0 * Math.sqrt(Math.max(0, F) / W);  // square-rooted, relative to weight
        aT.set(clamp(sc(T), 0.05, 3.0)); aD.set(clamp(sc(D), 0.05, 3.0));
        aL.set(clamp(sc(W * Math.cos(gam)), 0.05, 3.0)); aW.set(clamp(sc(W), 0.05, 3.0));
        plane.root.rotation.z = gam * 0.6;          // the nose climbs with the path
      },
      readout: (s) => {
        const cfg = AIRCRAFT[s.aircraft];
        const mass = cfg.cruiseMass && s.aircraft === 'airliner' ? cfg.cruiseMass : cfg.mass;
        const a = air(s.height, s.hot);
        const v = Math.max(1, s.speed);
        const CL = CLlevel(cfg, a.rho, v, mass);
        const CD = CDof(cfg, CL);
        const D = dragAt(cfg, a.rho, v, CL);
        const W = mass * G;
        const gam = s.climb * Math.PI / 180;
        const T = D + W * Math.sin(gam);
        const P = T * v;
        const Vs = stallSpeed(cfg, a.rho, mass);
        const climbFpm = (v * Math.sin(gam)) / FT * 60;     // climb rate = v sin γ
        const tag = v < Vs ? '<span class="no">Below the stall speed here</span>' : '';
        const run = runHere(a.rho);
        return `<div class="big">Thrust needed: ${(T / 1000).toFixed(1)} kN</div>
          <div class="row"><span>Drag</span><b>${(D / 1000).toFixed(1)} kN</b></div>
          <div class="row"><span>Lift ÷ drag</span><b>${(CL / CD).toFixed(1)}</b></div>
          <div class="row"><span>Power needed</span><b>${(P / 1000).toFixed(0)} kW</b></div>
          <div class="row"><span>Extra thrust for the climb</span><b>${(W * Math.sin(gam) / 1000).toFixed(1)} kN</b></div>
          <div class="row"><span>Climb rate</span><b>${Math.round(climbFpm)} ft/min</b></div>
          <div class="row"><span>Density altitude</span><b>${Math.round(densityAltitude(a.rho) / FT / 10) * 10} ft</b></div>
          <div class="row"><span>Airliner take-off run here</span><b>${s.height > 5000 ? 'not at this height' : Math.round(run.airliner) + ' m'}</b></div>
          ${tag}`;
      },
    };
  },
};
