// Chapter 4: pitch, roll and yaw, flaps, trim.
import { arrow, approach, clamp } from '../kit.js';
import { makeAirliner, fitNarrow } from '../plane.js';
import { AIRCRAFT, FLAPS, stallSpeed, dragAt, KT, RHO0 } from '../aero.js';

const DEG = Math.PI / 180;

const A = AIRCRAFT.airliner;
const flapOpts = FLAPS.map((f) => ({ v: f.id, label: f.label.replace('Flaps ', 'F').replace('Clean', 'Up').replace('Full flap', 'Full') }));

export default {
  id: 'controls',
  short: 'Controls',
  title: 'Pitch, roll and yaw',
  subtitle: 'Three axes, four surfaces, and the flaps that trade speed for lift.',
  view: { pos: [7.4, 3.8, 10.4], target: [0.2, 1.6, 0] },
  learn: `<p>An aeroplane turns about three imaginary axes through its centre of gravity. <b>Pitch</b> is the nose going up or down, about the axis that runs across the wings. <b>Roll</b> is the wings tipping left or right, about the axis from nose to tail. <b>Yaw</b> is the nose swinging left or right, about the vertical axis.</p>
    <p>The <b>elevator</b> on the tail controls pitch. Its trailing edge moves up, the tail is pushed down, and the nose comes up. The <b>ailerons</b> roll: one goes up and the other down, so one wing makes more lift than the other. The <b>rudder</b> on the fin yaws the nose.</p>
    <p>The <b>flaps</b> are the trade-off. Lowering them bends the wing down, so it lifts at a lower speed, and the stall speed falls. The price is more drag, so the aeroplane must fly slower and steeper to land. The slats, when out, let the air stay on the front of the wing at high angles.</p>
    <p>A drone steers with several small rotors and no tail at all; see <a href="https://glassbox.how/droneclear/" target="_blank" rel="noopener">DroneClear</a>.</p>
    <p><b>Trim</b> sets where a control rests so that the pilot does not have to hold it. A small trimmable tailplane or a trim tab does this job. Without trim, a pilot would have to pull on the yoke all the way to cruise.</p>
    <p class="tip"><b>Try it:</b> lower the flaps one step at a time. Watch the stall speed drop and the drag rise.</p>`,
  terms: [
    { t: 'Pitch', d: 'Nose up or down, about the wing axis.' },
    { t: 'Roll', d: 'Wings tipping left or right, about the nose-to-tail axis.' },
    { t: 'Yaw', d: 'Nose swinging left or right, about the vertical axis.' },
    { t: 'Trim', d: 'A setting that holds a control in place, so the pilot does not have to.' },
    { t: 'Stall speed', d: 'The slowest speed at which the wing can still carry the weight.' },
  ],
  defaults: { flaps: 0, elevator: 0, aileron: 0, rudder: 0, trim: 0 },
  controls: [
    { key: 'flaps', type: 'seg', label: 'Flaps', options: flapOpts, fmt: (v) => FLAPS[v].deg ? `${FLAPS[v].deg}° down` : 'up' },
    { key: 'elevator', type: 'range', label: 'Pitch: pull back (nose up)', min: -15, max: 15, step: 0.5, ends: ['push: nose down', 'pull: nose up'], fmt: (v) => v.toFixed(1) + '°' },
    { key: 'aileron', type: 'range', label: 'Roll: turn left or right', min: -20, max: 20, step: 0.5, ends: ['roll left', 'roll right'], fmt: (v) => v.toFixed(1) + '°' },
    { key: 'rudder', type: 'range', label: 'Yaw: rudder left or right', min: -25, max: 25, step: 0.5, ends: ['nose left', 'nose right'], fmt: (v) => v.toFixed(1) + '°' },
    { key: 'trim', type: 'range', label: 'Trim (nose-up rest)', min: -5, max: 5, step: 0.1, fmt: (v) => v.toFixed(1) + '°' },
  ],
  quiz: [
    { q: 'Which surface makes the nose go up or down?', options: ['Ailerons', 'Rudder', 'Elevator', 'Flaps'], answer: 2, why: 'The elevator on the tailplane sets the pitch, nose up or down.' },
    { q: 'What do lowered flaps do to the stall speed?', options: ['Raise it', 'Lower it, but add drag', 'Leave it the same', 'Lower it, with no drag cost'], answer: 1, why: 'Flaps add lift at a given speed, so the stall speed falls. They also add drag.' },
    { q: 'What is the job of trim?', options: ['To steer on the ground', 'To hold a control where it rests, so the pilot need not hold it', 'To cool the engines', 'To measure the speed'], answer: 1, why: 'Trim sets a control\'s resting position so that the pilot does not have to keep pulling it.' },
  ],
  reel: [
    { ms: 5000, caption: 'The elevator tilts the nose, the ailerons roll, and flaps down lower the stall speed.', set: { flaps: 0, elevator: 6, aileron: 10, rudder: 0 }, anim: { elevator: [0, 6], aileron: [0, 10] }, view: { pos: [7.0, 3.6, 10.0], target: [0.2, 0.2, 0] }, spin: 0.25 },
  ],

  build({ stage, label }) {
    const plane = makeAirliner();
    stage.root.add(plane.root);
    // The three axes through the centre of gravity: pitch (across the wings), roll (nose to tail), yaw (up).
    const axis = (color, rot, pos) => { const a = arrow(color, 5.2, 0.4, 0.03); a.rotation.set(...rot); a.position.set(...pos); stage.root.add(a); return a; };
    axis(0x7af0a8, [Math.PI / 2, 0, 0], [0, 0.25, 0]);   // pitch: along Z
    axis(0xff7a59, [0, 0, -Math.PI / 2], [0, 0.25, 0]);  // roll: along X
    axis(0x7aa2ff, [0, 0, 0], [0, -1.2, 0]);            // yaw: along Y (base under the aeroplane)
    label('Pitch axis', [0, 0.5, 2.9], stage.root, 'soft');
    label('Roll axis', [3.0, 0.5, 0], stage.root, 'soft');
    label('Yaw axis', [0.5, 2.6, 0.5], stage.root, 'soft');

    let pitch = 0, roll = 0, yaw = 0, flapsOn = 0, slatOn = 0;
    return {
      update(dt, s) {
        fitNarrow(stage);
        const fi = Math.round(s.flaps);
        flapsOn = approach(flapsOn, FLAPS[fi].deg, 4, dt);
        slatOn = approach(slatOn, fi > 0 ? 20 : 0, 4, dt);
        plane.setFlaps(flapsOn);
        plane.setSlats(slatOn);
        plane.setElevator(s.elevator);
        plane.setAileron(s.aileron);
        plane.setRudder(s.rudder);
        // The whole aeroplane turns a little with the controls, so the direction shows. Exaggerated.
        pitch = approach(pitch, clamp((s.elevator + s.trim) * 0.25, -4, 4), 4, dt);
        roll = approach(roll, clamp(s.aileron * 0.12, -2.5, 2.5), 4, dt);
        yaw = approach(yaw, clamp(s.rudder * 0.08, -2, 2), 4, dt);
        plane.root.rotation.set(roll * DEG, yaw * DEG, pitch * DEG, 'XYZ');
      },
      readout: (s) => {
        const f = FLAPS[Math.round(s.flaps)];
        const Vs = stallSpeed(A, RHO0, A.mass, f.CLmax);
        const Vs0 = stallSpeed(A, RHO0, A.mass, FLAPS[0].CLmax);
        const dD = dragAt(A, RHO0, 75, 0, f.dCD0) - dragAt(A, RHO0, 75, 0, 0);
        const pilot = s.elevator + s.trim;
        return `<div class="big">Stall speed: ${Math.round(Vs / KT)} kt</div>
          <div class="row"><span>Flaps</span><b>${f.deg ? f.deg + '° down' : 'up'}</b></div>
          <div class="row"><span>Clean wing stall</span><b>${Math.round(Vs0 / KT)} kt</b></div>
          <div class="row"><span>Extra drag at 75 m/s</span><b>${Math.round(dD / 100) * 100} N</b></div>
          <div class="row"><span>Elevator, with trim</span><b>${pilot.toFixed(1)}°</b></div>
          <div class="row"><span>Aileron · rudder</span><b>${s.aileron.toFixed(1)}° · ${s.rudder.toFixed(1)}°</b></div>
          <p class="hint" style="position:static;margin:8px 0 0;font-size:13px;color:var(--dim)">Estimates for an airliner at maximum take-off weight, at sea level. The flight manual has the real values.</p>`;
      },
    };
  },
};
