// Shared flight physics for AeroplaneClear: air, lift, drag, stall, the take-off run, the glide,
// the propulsion sum and a 2D potential-flow section. Units are SI unless a label says otherwise.
//
// Sources for the constants (see also the chapters):
// - ISA sea-level values and the lapse rate: ICAO Standard Atmosphere (1993 edition), as used in
//   the US Standard Atmosphere 1976: T0 = 288.15 K, p0 = 101 325 Pa, lapse 6.5 K/km, rho0 = 1.225 kg/m3.
// - Flow over the section: Joukowski transform and Kutta condition, as in Anderson, Fundamentals of
//   Aerodynamics (ch. 3 to 4). The Airfoil class is adapted from BernoulliClear's bernoulli.js
//   (same author, same method).
// - Aircraft figures are approximate public figures, labelled "estimate" wherever they are ours.
//   Light aircraft: Cessna 172S type data (MTOW 2,550 lb, wing area 174 sq ft, clean stall about
//   51 KIAS as summarised from the type certificate data sheet; check the aircraft's own flight manual).
//   Airliner: Airbus A320-family characteristics (wing area about 122 m2, MTOW about 78 t, cruise
//   Mach 0.78). Engine thrust and glide figures are estimates.

export const G = 9.81;
export const T0 = 288.15, P0 = 101325, LAPSE = 0.0065, R_AIR = 287.05, GAMMA = 1.4;
export const RHO0 = 1.225;
export const KT = 0.514444;          // m/s per knot
export const FT = 0.3048;            // m per foot

// ---------------------------------------------------------------- atmosphere
// Air at height h (m) on a day that is dT kelvin warmer than the standard day (hot-day offset).
export function air(h = 0, dT = 0) {
  const hh = Math.min(11000, Math.max(-500, h));
  const Tisa = T0 - LAPSE * hh;
  const p = P0 * Math.pow(Tisa / T0, G / (LAPSE * R_AIR));
  const T = Tisa + dT;
  return { h, T, p, rho: p / (R_AIR * T), a: Math.sqrt(GAMMA * R_AIR * T) };
}
export const rhoOf = (h, dT = 0) => air(h, dT).rho;

// Density altitude (m): the height in the standard day where the air has the same density.
export function densityAltitude(rho) {
  let lo = -500, hi = 11000;
  for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; air(mid).rho > rho ? (lo = mid) : (hi = mid); }
  return (lo + hi) / 2;
}

// ---------------------------------------------------------------- aircraft
// mass kg, S wing area m2, b span m, e Oswald efficiency (estimate), CD0 parasite drag (estimate),
// a lift-curve slope per degree, alpha0 zero-lift angle, CLmax clean, CLmaxTO with take-off flaps.
export const AIRCRAFT = {
  light: {
    name: 'Light two-seat aircraft', short: 'Light aircraft', mass: 1157, S: 16.2, b: 11.0,
    e: 0.75, CD0: 0.035, a: 0.095, alpha0: -2, CLmax: 1.6, CLmaxTO: 1.8,
    Tstatic: 1800,                  // N, static thrust of the propeller (estimate)
    etaP: 134e3 * 0.75,             // W, shaft power times propeller efficiency (estimate, 180 hp class)
    Vcruise: 60,                    // m/s, about 117 knots
  },
  airliner: {
    name: 'Narrow-body airliner', short: 'Airliner', mass: 78000, S: 122.4, b: 34.1,
    e: 0.8, CD0: 0.022, a: 0.095, alpha0: -1.5, CLmax: 1.5, CLmaxTO: 2.0,
    Tstatic: 240e3,                 // N, two engines at take-off thrust (estimate)
    etaP: 13.3e6,                   // W, thrust times speed at 79 m/s: falls with speed (estimate)
    Vcruise: 230, cruiseMass: 65000, cruiseH: 11000,   // 0.78 Mach at 11 km
  },
};
export const aspect = (ac) => (ac.b * ac.b) / ac.S;
export const weight = (ac, mass = ac.mass) => mass * G;

// Flap settings for the airliner (estimates for the shape of the trade-off, not a flight manual).
export const FLAPS = [
  { id: 0, label: 'Clean', deg: 0, CLmax: 1.5, dCD0: 0 },
  { id: 1, label: 'Flaps 1', deg: 5, CLmax: 1.7, dCD0: 0.004 },
  { id: 2, label: 'Flaps 2', deg: 15, CLmax: 2.0, dCD0: 0.010 },
  { id: 3, label: 'Flaps 3', deg: 25, CLmax: 2.2, dCD0: 0.018 },
  { id: 4, label: 'Full flap', deg: 40, CLmax: 2.5, dCD0: 0.028 },
];

// ---------------------------------------------------------------- the lift curve
// Linear up to the stall, then the flow separates from the upper surface and lift falls away.
export function clOf(ac, alphaDeg, CLmax = ac.CLmax) {
  const as = ac.alpha0 + CLmax / ac.a;               // critical angle of attack, degrees
  if (alphaDeg <= as) return ac.a * (alphaDeg - ac.alpha0);
  return Math.max(0.5 * CLmax, CLmax - 0.05 * (alphaDeg - as) * (CLmax / 1.6) * 1.6);
}
export const criticalAlpha = (ac, CLmax = ac.CLmax) => ac.alpha0 + CLmax / ac.a;

// Lift force at speed v (m/s), density rho, angle alpha (deg): L = ½ρv²S C_L.
export const lift = (ac, rho, v, alphaDeg, CLmax) => 0.5 * rho * v * v * ac.S * clOf(ac, alphaDeg, CLmax);

// Stall speed: the speed where C_L equals CLmax and lift equals weight: Vs = √(2W / ρ S C_Lmax).
export const stallSpeed = (ac, rho, mass = ac.mass, CLmax = ac.CLmax) => Math.sqrt((2 * mass * G) / (rho * ac.S * CLmax));

// ---------------------------------------------------------------- drag
// Drag polar: C_D = C_D0 + C_L² / (π e AR). Drag D = ½ρv²S C_D.
export function CDof(ac, CL, dCD0 = 0) { return ac.CD0 + dCD0 + (CL * CL) / (Math.PI * ac.e * aspect(ac)); }
export function dragAt(ac, rho, v, CL, dCD0 = 0) { return 0.5 * rho * v * v * ac.S * CDof(ac, CL, dCD0); }
// Level flight: the lift coefficient needed to carry the weight at speed v.
export const CLlevel = (ac, rho, v, mass = ac.mass) => (2 * mass * G) / (rho * v * v * ac.S);
// Best glide (maximum lift to drag): C_L* = √(C_D0 π e AR), L/D max = C_L* / (2 C_D0).
export function glide(ac) {
  const CLs = Math.sqrt(ac.CD0 * Math.PI * ac.e * aspect(ac));
  return { CLs, LDmax: CLs / (2 * ac.CD0), vBest: (rho) => Math.sqrt((2 * ac.mass * G) / (rho * ac.S * CLs)) };
}

// ---------------------------------------------------------------- the take-off run
// Integrates the ground roll with thrust falling with speed (power limited), rolling friction and
// drag. Air density scales engine thrust (both propellers and jets lose thrust in thin air).
// Lift-off at V_R = 1.1 × V_S at the take-off flap setting, set at the same indicated speed, so the
// true airspeed at rotation is higher in thin air. Returns the ground run in metres.
export function takeoffRun(ac, rho, { mass = ac.mass, CLmax = ac.CLmaxTO, dCD0 = 0, mu = 0.03, dT = 0 } = {}) {
  const sigma = rho / RHO0;
  const VRias = 1.1 * stallSpeed(ac, RHO0, mass, CLmax);     // IAS at rotation (sea-level equivalent)
  const VR = VRias * Math.sqrt(RHO0 / rho);                   // TAS at rotation
  let v = 0, x = 0, t = 0;
  const dt = 0.02;
  for (let n = 0; n < 60000 && v < VR; n++) {
    const T = sigma * Math.min(ac.Tstatic, ac.etaP / Math.max(v, 1));
    const D = dragAt(ac, rho, v, 0, dCD0);
    const F = T - D - mu * (mass * G);                       // no lift on the ground
    const acc = F / mass;
    v += acc * dt; x += v * dt; t += dt;
  }
  return { dist: x, VR, time: t, Vmph: VR / KT };
}

// ---------------------------------------------------------------- the jet
// A turbofan throws a large mass of air at a low speed. Thrust = ṁ (v_e − v0). Ideal propulsive
// efficiency η_p = 2 v0 / (v0 + v_e) (Froude). The bypass ratio B is fan air to core air.
export function jetCompare(thrust, v0, B, coreFlow = 30) {
  const mTot = coreFlow * (1 + B);
  const dv = thrust / mTot;
  const ve = v0 + dv;
  return { mTot, dv, ve, eta: (2 * v0) / (v0 + ve) };
}

// ---------------------------------------------------------------- a 2D section: NACA 2412 type
// Thickness and camber in chord units. Used for the 3D wing so flaps can hinge exactly.
export function sectionY(xl, t = 0.12, m = 0.02, p = 0.4) {
  const x = Math.min(1, Math.max(0, xl));
  const yt = 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
  let yc = 0, dyc = 0;
  if (x < p) { yc = (m / (p * p)) * (2 * p * x - x * x); dyc = (2 * m / (p * p)) * (p - x); }
  else { yc = (m / ((1 - p) ** 2)) * (1 - 2 * p + 2 * p * x - x * x); dyc = (2 * m / ((1 - p) ** 2)) * (p - x); }
  const th = Math.atan(dyc);
  return { up: [x - yt * Math.sin(th), yc + yt * Math.cos(th)], lo: [x + yt * Math.sin(th), yc - yt * Math.cos(th)], yc, yt };
}

// ---------------------------------------------------------------- Joukowski flow (potential flow)
// Potential flow round a circle in the ζ-plane, mapped to an airfoil by z = ζ + c²/ζ (c = 1).
// The circle (centre ζ0 = −m + i·n, through the trailing-edge point ζ = 1) gives thickness m and
// camber n. The Kutta condition fixes the circulation Γ = 4πUR·sin(α + β) so the flow leaves the
// sharp trailing edge smoothly; the Kutta–Joukowski theorem then gives lift L′ = ρUΓ, so C_l = 2Γ/(U c).
// Speeds are in units of the free stream U. Flow runs in +x; the leading edge is at the left.
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1] || 1e-12; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const csqrt = (a) => { const r = Math.hypot(a[0], a[1]); const re = Math.sqrt(Math.max(0, (r + a[0]) / 2)); let im = Math.sqrt(Math.max(0, (r - a[0]) / 2)); if (a[1] < 0) im = -im; return [re, im]; };

export class Airfoil {
  constructor(m = 0.09, n = 0.08, alphaDeg = 0) { this.set(m, n, alphaDeg); }
  set(m, n, alphaDeg) {
    this.m = m; this.n = n;
    this.z0 = [-m, n];
    this.R = Math.hypot(1 + m, n);
    this.beta = Math.atan2(n, 1 + m);
    this.alpha = (alphaDeg * Math.PI) / 180;
    this.gamma = 4 * Math.PI * this.R * Math.sin(this.alpha + this.beta);
    this.ea = [Math.cos(this.alpha), Math.sin(this.alpha)];
    const pts = [];
    for (let i = 0; i < 200; i++) { const t = (i / 200) * Math.PI * 2 - this.beta; pts.push(this.map([this.z0[0] + this.R * Math.cos(t), this.z0[1] + this.R * Math.sin(t)])); }
    this.outline = pts;
    const xs = pts.map((p) => p[0]);
    this.xLE = Math.min(...xs); this.xTE = Math.max(...xs); this.chord = this.xTE - this.xLE;
    this.cl = (2 * this.gamma) / this.chord;              // Cl = L′/(½ρU²c) = 2Γ/(U c)
    return this;
  }
  map(zeta) { const inv = cdiv([1, 0], zeta); return [zeta[0] + inv[0], zeta[1] + inv[1]]; }
  // The ζ outside the circle that maps to z.
  inverse(z) {
    const s = csqrt([z[0] * z[0] - z[1] * z[1] - 4, 2 * z[0] * z[1]]);
    const a = [(z[0] + s[0]) / 2, (z[1] + s[1]) / 2], b = [(z[0] - s[0]) / 2, (z[1] - s[1]) / 2];
    const da = Math.hypot(a[0] - this.z0[0], a[1] - this.z0[1]), db = Math.hypot(b[0] - this.z0[0], b[1] - this.z0[1]);
    return da >= db ? [a, da] : [b, db];
  }
  // Velocity (u, v) at z = (x, y), in units of U. Returns null inside the airfoil.
  vel(x, y) {
    const [zeta, d] = this.inverse([x, y]);
    if (d < this.R * 0.999) return null;
    const zp = [zeta[0] - this.z0[0], zeta[1] - this.z0[1]];
    const zp2 = cmul(zp, zp);
    const eaC = [this.ea[0], -this.ea[1]];
    let W = [eaC[0], eaC[1]];
    const t2 = cdiv([this.R * this.R * this.ea[0], this.R * this.R * this.ea[1]], zp2);
    W = [W[0] - t2[0], W[1] - t2[1]];
    const t3 = cdiv([0, this.gamma / (2 * Math.PI)], zp);
    W = [W[0] + t3[0], W[1] + t3[1]];
    const inv2 = cdiv([1, 0], cmul(zeta, zeta));
    const dz = [1 - inv2[0], -inv2[1]];
    let w = cdiv(W, dz);
    const sp = Math.hypot(w[0], w[1]);
    if (sp > 3.2) w = [(w[0] * 3.2) / sp, (w[1] * 3.2) / sp];    // tame the sharp-edge singularity
    return [w[0], -w[1]];
  }
  // Surface speed (units of U) on the outline, for the pressure readout.
  speedAt(x, y) { const v = this.vel(x, y); return v ? Math.hypot(v[0], v[1]) : 0; }
  // Length of the upper and lower surface, from the outline (units of chord).
  arcs() {
    const P = this.outline, N = P.length;
    let iL = 0, iT = 0;
    for (let i = 0; i < N; i++) { if (P[i][0] < P[iL][0]) iL = i; if (P[i][0] > P[iT][0]) iT = i; }
    const len = (a, b, dir) => { let s = 0, i = a; while (i !== b) { const j = (i + dir + N) % N; s += Math.hypot(P[j][0] - P[i][0], P[j][1] - P[i][1]); i = j; } return s; };
    const fwd = len(iL, iT, 1), bwd = len(iL, iT, -1);
    const meanY = (dir) => { let s = 0, n = 0, i = iL; while (i !== iT) { s += P[i][1]; n++; i = (i + dir + N) % N; } return s / n; };
    return meanY(1) > meanY(-1) ? { top: fwd, bottom: bwd } : { top: bwd, bottom: fwd };
  }
  // Advance a point by dt (RK2) along the flow. Returns false if it hit the body.
  step(p, dt) {
    const a = this.vel(p[0], p[1]); if (!a) return false;
    const b = this.vel(p[0] + a[0] * dt * 0.5, p[1] + a[1] * dt * 0.5); if (!b) return false;
    p[0] += b[0] * dt; p[1] += b[1] * dt;
    return true;
  }
}

// Deterministic pseudo-random numbers so every run (and every video frame) looks the same.
export function rng(seed = 1) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
