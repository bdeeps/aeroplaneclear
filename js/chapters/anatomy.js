// Chapter 1: take an aeroplane apart.
import { exploder, approach } from '../kit.js';
import { makeAirliner, fitNarrow } from '../plane.js';
import { AIRCRAFT } from '../aero.js';

const A = AIRCRAFT.airliner;

export default {
  id: 'anatomy',
  short: 'Anatomy',
  title: 'Inside an aeroplane',
  subtitle: 'A tube, two swept wings, two engines, a tail and wheels.',
  view: { pos: [7.6, 3.8, 10.0], target: [0, 1.4, 0] },
  learn: `<p>Most of an aeroplane is a long, hollow <b>fuselage</b>. It carries people and bags, and it is shaped to slip through the air. The <b>wings</b> are where the flying happens, and they are the only part whose job is to make <b>lift</b>.</p>
    <p>Each wing has an <b>aerofoil</b> shape: a rounded front (the <b>leading edge</b>), a sharp back (the <b>trailing edge</b>), and a curved top. Along the back edge sit the <b>flaps</b>, and near the front the <b>slats</b>. Both are switched on for take-off and landing, when the wing must lift at low speed. Out at the tips, the <b>ailerons</b> roll the aeroplane.</p>
    <p>At the back, the <b>elevator</b> on the <b>tailplane</b> makes the nose go up or down. The upright <b>fin</b> has a <b>rudder</b> that turns the nose left or right. Two <b>turbofan</b> engines hang on pylons under the wings. The <b>undercarriage</b> carries the weight on the ground and folds away in flight. A helicopter gets its lift from a spinning wing instead; see <a href="https://glassbox.how/helicopterclear/" target="_blank" rel="noopener">HelicopterClear</a>.</p>
    <p class="tip"><b>Try it:</b> pull the aeroplane apart, then switch the flaps and slats on and see how the wing gets bigger and more curved.</p>`,
  terms: [
    { t: 'Aerofoil', d: 'A wing shape with a rounded front and a sharp back, built to turn air down.' },
    { t: 'Flap', d: 'A hinged part of the wing trailing edge. It bends the wing down to lift more at low speed.' },
    { t: 'Slat', d: 'A small piece at the leading edge that slides forward to keep the air stuck to the wing.' },
    { t: 'Aileron', d: 'A hinged part at the wing tip. Moved in opposite directions, it rolls the aeroplane.' },
    { t: 'Turbofan', d: 'A jet engine with a large fan at the front. Most of its air bypasses the hot core.' },
  ],
  defaults: { explode: 0, deployed: false },
  controls: [
    { key: 'explode', type: 'range', label: 'Take it apart', min: 0, max: 1, step: 0.01, ends: ['together', 'apart'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'deployed', type: 'toggle', label: 'Flaps and slats down', hint: 'As for take-off: the flaps bend the wing down and the slats slide out.' },
  ],
  quiz: [
    { q: 'Which part of an aeroplane makes lift?', options: ['The fuselage', 'The wings', 'The fin', 'The undercarriage'], answer: 1, why: 'The wings, with their curved aerofoil shape, are the only parts whose job is to make lift.' },
    { q: 'What do flaps do?', options: ['They make the aeroplane quieter', 'They bend the wing down to give more lift at low speed', 'They carry the fuel', 'They steer on the ground'], answer: 1, why: 'Flaps widen the wing\'s curve, so it makes more lift at low speed, for take-off and landing.' },
    { q: 'Which control makes the nose go up or down?', options: ['The aileron', 'The rudder', 'The elevator', 'The slat'], answer: 2, why: 'The elevator on the tailplane sets the pitch: the nose goes up or down. The rudder turns the nose sideways.' },
  ],
  reel: [
    { ms: 5200, caption: 'An aeroplane is a tube with two wings, a tail, two engines and wheels.', set: { deployed: false }, anim: { explode: [0, 1] }, view: { pos: [6.0, 3.0, 8.0], target: [0, 1.4, 0] }, spin: 0.5 },
  ],

  build({ stage, label }) {
    const plane = makeAirliner();
    stage.root.add(plane.root);
    const P = plane.parts;
    const ex = exploder([
      { obj: P.engines[0], off: [0, -2.6, 5.5] },
      { obj: P.engines[1], off: [0, -2.6, -5.5] },
      { obj: P.fin, off: [0, 3.2, 0] },
      { obj: P.rudder, off: [0, 3.2, 0] },
      { obj: P.gear, off: [0, -3.6, 0] },
      { obj: P.elevators[0], off: [-3.8, 0, 2.5] },
      { obj: P.elevators[1], off: [-3.8, 0, -2.5] },
      { obj: P.ailerons[0], off: [0, 0.8, 3.5] },
      { obj: P.ailerons[1], off: [0, 0.8, -3.5] },
      { obj: P.slats[0], off: [2.2, -0.4, 0] },
      { obj: P.slats[1], off: [2.2, -0.4, 0] },
      { obj: P.flaps[0], off: [-1.6, -1.1, 0] },
      { obj: P.flaps[1], off: [-1.6, -1.1, 0] },
    ]);
    // Labels sit on the parts, so they move with them when the aeroplane comes apart.
    const L = (text, obj, pos, cls) => label(text, pos, obj, cls);
    const labels = [
      L('Fuselage', P.fuselage, [0, 1.9, 0]),
      L('Wing', P.wing[0], [-2.8, 1.4, 9.5], 'hot'),
      L('Flap', P.flaps[0], [1.5, 0.8, 3.5]),
      L('Slat', P.slats[0], [1.4, 0.8, 7.5]),
      L('Aileron', P.ailerons[0], [-0.5, 0.8, 16.5]),
      L('Elevator', P.elevators[0], [-14, 1.5, 4.5]),
      L('Fin and rudder', P.fin, [-14.5, 8.0, 0]),
      L('Turbofan', P.engines[0], [0, 1.8, 6.2]),
      L('Undercarriage', P.gear, [0, -6.6, 3.8]),
    ];
    let on = 0;
    return {
      update(dt, s) {
        fitNarrow(stage);
        ex(s.explode);
        const tgt = s.deployed ? 1 : 0;
        on = approach(on, tgt, 3.5, dt);
        plane.setFlaps(25 * on);
        plane.setSlats(20 * on);
        plane.setAileron(0);
        plane.setElevator(0);
        plane.setRudder(0);
        // The labels on the hidden parts only show once the aeroplane has come apart.
        labels.forEach((l, i) => { l.visible = i < 2 || s.explode > 0.35; });
      },
      readout: (s) => {
        const wa = A.mass / A.S;   // kg of aeroplane per m² of wing
        return `<div class="big">${A.S} m² of wing</div>
          <div class="row"><span>Span</span><b>${A.b} m</b></div>
          <div class="row"><span>Max take-off weight</span><b>${(A.mass / 1000).toFixed(0)} t</b></div>
          <div class="row"><span>Weight per m² of wing</span><b>${Math.round(wa)} kg/m²</b></div>
          <div class="row"><span>Flaps and slats</span><b>${s.deployed ? 'down' : 'up'}</b></div>`;
      },
    };
  },
};
