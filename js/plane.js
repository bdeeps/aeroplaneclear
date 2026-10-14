// A generic twin-engine narrow-body airliner, built from metres and scaled down for the stage.
// It is not any maker's silhouette: a tube fuselage, a swept wing with slats, flaps and ailerons,
// a tailplane with an elevator, a fin with a rudder, two turbofans under the wing and a tricycle
// undercarriage. Every control surface rotates about its own hinge, so the chapters can move it.
import { THREE, M, latheX, beam, box } from './kit.js';
import { sectionY, Airfoil } from './aero.js';

export const SCALE = 0.2;                 // 1 metre of the aeroplane = 0.2 scene units
const DEG = Math.PI / 180;
// Double-sided skins: the lofted pieces are open shells, so both faces must draw.
const plast = (c, o = {}) => M.plastic(c, { side: THREE.DoubleSide, ...o });

// Geometry in metres. The nose is at +X, the wing root is on the fuselage centre line, and
// the wing sweeps back. Span runs along Z.
const G = {
  fuseLen: 37.6, fuseR: 1.9,
  wing: { rootLE: 2.0, rootC: 5.5, tipC: 1.6, sweep: 7.9, half: 17.05, y0: -0.4, dih: 0.9 },
  tail: { rootLE: -14.6, rootC: 3.4, tipC: 1.3, sweep: 3.6, half: 6.4, y0: 1.1, dih: 0.3 },
  fin: { root: [-10.2, 1.6], tip: [-14.6, 7.3], rear: [-17.6, 1.6], rearTip: [-16.8, 7.3], hingeX: -15.2 },
  engine: { x0: -3.3, x1: 5.0, y: -2.2, z: 6.6 },
  gear: { mainX: -0.6, mainZ: 3.3, noseX: 11.5, legTop: -1.4, wheelY: -5.0 },
};

// A closed loop of points from a set of spanwise stations (each station is an array of [x,y,z]).
export function loft(stations, mat) {
  const n = stations[0].length, pos = [];
  stations.forEach((st) => st.forEach((p) => pos.push(...p)));
  const idx = [];
  for (let i = 0; i < stations.length - 1; i++) {
    for (let j = 0; j < n; j++) {
      const a = i * n + j, b = i * n + ((j + 1) % n), c = (i + 1) * n + j, d = (i + 1) * n + ((j + 1) % n);
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// One wing section loop between two chordwise fractions, at spanwise fraction t of one side.
function sectionLoop(w, t, side, xa, xb, tk, samples = 12) {
  const c = w.rootC + (w.tipC - w.rootC) * t;
  const le = w.rootLE - w.sweep * t, z = side * w.half * t, yb = w.y0 + w.dih * t;
  const pts = [];
  for (let k = 0; k <= samples; k++) { const xl = xa + ((xb - xa) * k) / samples; const s = sectionY(xl, tk); pts.push([le - s.up[0] * c, yb + s.up[1] * c, z]); }
  for (let k = samples; k >= 0; k--) { const xl = xa + ((xb - xa) * k) / samples; const s = sectionY(xl, tk); pts.push([le - s.lo[0] * c, yb + s.lo[1] * c, z]); }
  return pts;
}
// Hinge point of a station: the chordwise fraction hx on the wing's centre plane at spanwise t.
function hingePoint(w, t, side, hx) {
  const c = w.rootC + (w.tipC - w.rootC) * t;
  return [w.rootLE - w.sweep * t - hx * c, w.y0 + w.dih * t, side * w.half * t];
}

// A control surface built as a piece of wing between two spanwise fractions, rotated about its hinge.
// The hinge runs straight along the wing (the chord fraction is constant), so the piece rotates rigidly.
function surface(w, side, t0, t1, xa, xb, hx, mat, tk = 0.12) {
  const H0 = hingePoint(w, t0, side, hx), H1 = hingePoint(w, t1, side, hx);
  const axis = new THREE.Vector3(H1[0] - H0[0], H1[1] - H0[1], H1[2] - H0[2]).normalize();
  if (axis.z < 0) axis.negate();
  const st = [0, 1].map((k) => { const t = k ? t1 : t0; return sectionLoop(w, t, side, xa, xb, tk, 8).map(([x, y, z]) => [x - H0[0], y - H0[1], z - H0[2]]); });
  const grp = new THREE.Group();
  grp.position.set(...H0);
  grp.add(loft(st, mat));
  grp.userData.axis = axis;
  return grp;
}
// Rotate a hinged piece: positive deg moves the trailing edge down (lowers the flap, raises the nose).
const hinge = (grp, deg) => { grp.quaternion.setFromAxisAngle(grp.userData.axis, deg * DEG); };

// Control inputs: flaps and slats in degrees (flap positive = trailing edge down, slat positive = out);
// ailerons positive = right aileron down (rolls left); elevator positive = nose up (trailing edge up);
// rudder positive = nose left.
export function makeAirliner() {
  const root = new THREE.Group();
  root.scale.setScalar(SCALE);
  const parts = {};

  const skin = plast(0xe9edf3, { roughness: 0.42 });
  const wingMat = plast(0xc7cfdb, { roughness: 0.5 });
  const flapMat = plast(0xffb547, { roughness: 0.55 });
  const slatMat = plast(0x8ef0ff, { roughness: 0.55 });
  const ailMat = plast(0xff7a59, { roughness: 0.55 });
  const tailMat = plast(0xd9dee8, { roughness: 0.5 });
  const elevMat = plast(0xc49bff, { roughness: 0.55 });
  const rudMat = plast(0xc49bff, { roughness: 0.55 });
  const engMat = M.metal(0x9aa3b2, { roughness: 0.35 });
  const darkMat = M.matte(0x1b1f29);
  const gearMat = M.metal(0x6c7483, { roughness: 0.5 });

  // Fuselage: a lathe along X, nose at +X.
  const prof = [
    [-G.fuseLen / 2, 0.12], [-18.2, 1.0], [-16.6, 1.75], [-14.0, 1.9], [13.0, 1.92],
    [15.6, 1.85], [17.4, 1.6], [18.4, 1.0], [G.fuseLen / 2, 0.12],
  ];
  parts.fuselage = latheX(prof, skin, { seg: 72 });
  root.add(parts.fuselage);
  // A band of cabin windows along the side (a dark stripe, so the tube reads as a plane).
  for (const s of [-1, 1]) {
    const win = box(20, 0.22, 0.06, darkMat);
    win.position.set(-0.5, 0.45, s * 1.91);
    parts.fuselage.add(win);
  }
  // Cockpit windscreen.
  const cock = beam([15.4, 0.9, -1.4], [17.1, 0.6, -0.8], 0.07, M.clear(0xbfe9ff, 0.35));
  const cock2 = beam([15.4, 0.9, 1.4], [17.1, 0.6, 0.8], 0.07, M.clear(0xbfe9ff, 0.35));
  parts.fuselage.add(cock, cock2);

  // Wings: main box, slats, flaps and ailerons on each side.
  const w = G.wing;
  parts.wing = [];
  parts.flaps = []; parts.slats = []; parts.ailerons = [];
  for (const side of [1, -1]) {
    const main = loft([0, 0.5, 1].map((t) => sectionLoop(w, t, side, 0.0, 0.75, 0.12, 14)), wingMat);
    root.add(main);
    parts.wing.push(main);
    const flap = surface(w, side, 0.14, 0.52, 0.75, 1.0, 0.75, flapMat);
    root.add(flap); parts.flaps.push(flap);
    const slat = surface(w, side, 0.12, 0.62, 0.0, 0.12, 0.12, slatMat);
    root.add(slat); parts.slats.push(slat);
    const ail = surface(w, side, 0.6, 0.94, 0.75, 1.0, 0.75, ailMat);
    root.add(ail); parts.ailerons.push(ail);
  }

  // Tailplane and elevators.
  const tl = G.tail;
  parts.tail = []; parts.elevators = [];
  for (const side of [1, -1]) {
    const tailLoop = (t, xa, xb) => sectionLoop(tl, t, side, xa, xb, 0.09, 10);
    const main = loft([0, 1].map((t) => tailLoop(t, 0.0, 0.7)), tailMat);
    root.add(main); parts.tail.push(main);
    const elev = surface(tl, side, 0.0, 0.96, 0.7, 1.0, 0.7, elevMat, 0.09);
    root.add(elev); parts.elevators.push(elev);
  }
  // Fin and rudder (a flat plate, rudder hinged on its rear edge).
  const f = G.fin;
  const finShape = new THREE.Shape();
  const pts = [[f.root[0], f.root[1]], [f.rear[0], f.rear[1]], [f.rearTip[0], f.rearTip[1]], [f.tip[0], f.tip[1]]];
  finShape.moveTo(...pts[0]); pts.slice(1).forEach((p) => finShape.lineTo(...p)); finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.22, bevelEnabled: false, steps: 1 });
  finGeo.translate(0, 0, -0.11);
  parts.fin = new THREE.Mesh(finGeo, tailMat);
  parts.fin.castShadow = true;
  // Rudder: the rear part of the fin, rotated about the hinge line at x = hingeX.
  const rudShape = new THREE.Shape();
  const hx = f.hingeX;
  const rp = [[hx, f.root[1]], [f.rear[0], f.rear[1]], [f.rearTip[0], f.rearTip[1]], [hx - 0.15, f.tip[1]]];
  rudShape.moveTo(...rp[0]); rp.slice(1).forEach((p) => rudShape.lineTo(...p)); rudShape.closePath();
  const rudGeo = new THREE.ExtrudeGeometry(rudShape, { depth: 0.22, bevelEnabled: false, steps: 1 });
  rudGeo.translate(0, 0, -0.11);
  parts.rudder = new THREE.Group();
  parts.rudder.position.set(hx, 0, 0);
  const rudMesh = new THREE.Mesh(rudGeo, rudMat);
  rudMesh.position.x = -hx;
  parts.rudder.add(rudMesh);
  root.add(parts.fin, parts.rudder);

  // Two turbofans under the wing, each on a short pylon.
  parts.engines = [];
  for (const side of [1, -1]) {
    const e = G.engine;
    const eg = new THREE.Group();
    eg.position.set(0, e.y, side * e.z);
    const nacelle = latheX([
      [e.x0 - 0.2, 0.9], [e.x0 + 0.4, 1.15], [e.x0 + 1.4, 1.22], [e.x0 + 3.6, 1.22], [e.x1 - 0.5, 1.1], [e.x1, 0.85],
    ], engMat, { seg: 48 });
    eg.add(nacelle);
    const fan = new THREE.Mesh(new THREE.CircleGeometry(1.12, 36), darkMat);
    fan.rotation.y = Math.PI / 2; fan.position.x = e.x0 + 0.5;
    eg.add(fan);
    const core = latheX([[e.x0 + 1.6, 0.18], [e.x0 + 3.2, 0.42], [e.x1 - 0.8, 0.12]], darkMat, { seg: 24 });
    eg.add(core);
    const pylon = box(3.4, 1.5, 0.35, wingMat);
    pylon.position.set(0.6, 1.4, 0);
    eg.add(pylon);
    root.add(eg);
    parts.engines.push(eg);
  }

  // Undercarriage: two main legs with twin wheels, and a nose leg.
  const gr = G.gear;
  parts.gear = new THREE.Group();
  const wheel = (x, y, z) => {
    const g = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.42, 24), M.matte(0x1d2029));
    g.rotation.x = Math.PI / 2; g.position.set(x, y, z); g.castShadow = true;
    return g;
  };
  for (const side of [1, -1]) {
    const leg = beam([gr.mainX, gr.legTop, side * gr.mainZ], [gr.mainX, gr.wheelY + 0.3, side * gr.mainZ], 0.18, gearMat);
    parts.gear.add(leg, wheel(gr.mainX, gr.wheelY, side * gr.mainZ), wheel(gr.mainX, gr.wheelY, side * (gr.mainZ + 0.9)));
  }
  parts.gear.add(beam([gr.noseX, -1.8, 0], [gr.noseX, gr.wheelY + 0.3, 0], 0.16, gearMat), wheel(gr.noseX, gr.wheelY, -0.35), wheel(gr.noseX, gr.wheelY, 0.35));
  root.add(parts.gear);

  return { root, parts, setFlaps(d) { parts.flaps.forEach((g) => hinge(g, d)); }, setSlats(d) { parts.slats.forEach((g) => hinge(g, -d)); },
    setAileron(d) { parts.ailerons.forEach((g, i) => hinge(g, i === 0 ? d : -d)); },
    setElevator(d) { parts.elevators.forEach((g) => hinge(g, -d)); },
    setRudder(d) { parts.rudder.rotation.y = d * DEG; },
  };
}

// The wing section, drawn as an extruded aerofoil outline for the lift chapter (flow comes from the left).
// Joukowski outline in units where the chord is 1; the outline is scaled to the stage by `scale`.
export function makeSection(alphaDeg = 0, scale = 3.2) {
  const f = new Airfoil(0.09, 0.08, 0);
  const cs = scale / f.chord;
  const shape = new THREE.Shape();
  f.outline.forEach(([x, y], i) => { const px = (x - f.xLE) * cs - scale / 2, py = y * cs; i ? shape.lineTo(px, py) : shape.moveTo(px, py); });
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 2.2, bevelEnabled: false, steps: 1 });
  geo.translate(0, 0, -1.1);
  const mesh = new THREE.Mesh(geo, plast(0xc7cfdb, { roughness: 0.45 }));
  mesh.castShadow = true; mesh.receiveShadow = true;
  const g = new THREE.Group();
  g.add(mesh);
  return { group: g, mesh, scale: cs, airfoil: f };
}

// A flat canvas in the scene that can be redrawn each frame (live charts and timelines).
// draw(g, w, h) paints on a w×h pixel canvas; redraw() repaints and refreshes the texture.
export function board(parent, width, height, pos, draw, pxPerUnit = 220) {
  const cw = Math.round(width * pxPerUnit), ch = Math.round(height * pxPerUnit);
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
  mesh.position.set(...pos);
  parent.add(mesh);
  const redraw = (...a) => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cw, ch); g.scale(cw / 1000, ch / 1000); draw(g, 1000, 1000 * (ch / cw), ...a); tex.needsUpdate = true; };
  redraw();
  return { mesh, redraw };
}

// Many small glowing dots in one draw call. place(i, x, y, z) then done().
export function dots(n, r, color = 0xffffff) {
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), n);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  const o = new THREE.Object3D(), col = new THREE.Color();
  for (let i = 0; i < n; i++) mesh.setColorAt(i, col.set(color));
  mesh.place = (i, x, y, z, s = 1) => { o.position.set(x, y, z); o.scale.setScalar(Math.max(0.0001, s)); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); };
  mesh.tint = (i, c) => mesh.setColorAt(i, c);
  mesh.done = () => { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; };
  return mesh;
}

// On a phone-width stage, nudge the picture down so the readout (top left) does not hide the model.
export function fitNarrow(stage, y = -0.3) {
  const narrow = stage.host.clientWidth < 560;
  const want = narrow ? y : 0;
  if (!stage.shift || stage.shift[1] !== want) stage.setShift(0, want);
  return narrow;
}
