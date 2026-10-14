// Chapter 6: how people learned to fly, and flying in India today.
import { board, fitNarrow } from '../plane.js';

// Dated moments. Each has a source from the list at the foot of the page.
const EVENTS = [
  { y: 1799, t: 'Cayley sets out the parts of an aeroplane', d: 'Sir George Cayley argued that lift, thrust and control should be separate jobs: a fixed curved wing, a separate push, and a movable tail. Most histories date this to 1799.', src: 'Wright brothers, Century Before', c: '#c49bff' },
  { y: 1853, t: 'Cayley’s glider carries a person', d: 'Accounts say his glider carried a coachman a short distance down a hill near Scarborough. The details differ between sources, so treat the exact flight as less certain.', src: 'Wright brothers, Century Before', c: '#c49bff' },
  { y: 1896, t: 'Lilienthal’s gliders', d: 'From 1891 to 1896, Otto Lilienthal made thousands of glides in gliders he designed. He steered by shifting his body under the wing. He died after a glider crash in 1896.', src: 'Wright brothers, Century Before', c: '#c49bff' },
  { y: 1903, t: 'The Wright brothers fly', d: 'On 17 December 1903 at Kill Devil Hills, North Carolina, Orville Wright flew about 120 feet (36.6 m) in 12 seconds. On the fourth flight, Wilbur flew 852 feet in 59 seconds.', src: 'Air Force history: first heavier-than-air flight', c: '#ffb547' },
  { y: 1909, t: 'Blériot crosses the Channel', d: 'On 25 July 1909 Louis Blériot flew a single-seat monoplane from near Calais to Dover in about 36 to 37 minutes. Sources differ slightly on the exact time.', src: 'Mysticstamp: this day in history (secondary)', c: '#ffb547' },
  { y: 1929, t: 'J.R.D. Tata becomes India’s first licensed pilot', d: 'On 10 February 1929 J.R.D. Tata received licence No. 1 issued in India. Sources differ on the licence class.', src: 'Civil Aviation Ministry (civilaviation.gov.in)', c: '#8ef0ff' },
  { y: 1932, t: 'Tata flies the first airmail in India', d: 'On 15 October 1932 Tata flew a single-engine de Havilland Puss Moth from Karachi to Bombay (Juhu), stopping at Ahmedabad, with about 25 kg of letters.', src: 'The Better India (secondary)', c: '#8ef0ff' },
  { y: 1932, t: 'The Indian Air Force is set up', d: 'The Indian Air Force was created as an auxiliary of the Royal Air Force. The date 8 October 1932 is widely given for the Act; a Bharat-Rakshak article notes that it was the Gazette date. Its first squadron was commissioned on 1 April 1933 with Westland Wapiti biplanes.', src: 'Wikipedia: Indian Air Force', c: '#8ef0ff' },
  { y: 1961, t: 'The HF-24 Marut flies', d: 'Hindustan Aeronautics’ first jet fighter design, the HF-24 Marut, made its first flight on 17 June 1961. A pre-production test aircraft had flown earlier in 1959.', src: 'Wikipedia: HAL HF-24 Marut', c: '#8ef0ff' },
  { y: 1969, t: 'The Boeing 747 first flies', d: 'The 747 first flew on 9 February 1969 and was certified in December 1969. It was the first wide-body airliner, with two aisles and about twice the seats of earlier jets.', src: 'Wikipedia: Boeing 747', c: '#7af0a8' },
  { y: 2001, t: 'Tejas, India’s light combat aircraft, first flies', d: 'The first technology demonstrator, TD-1 of the Light Combat Aircraft programme, flew on 4 January 2001.', src: 'Live Fist Defence (secondary)', c: '#ff7a59' },
  { y: 2024, t: 'Tejas Mk1A first flight (one report)', d: 'One report gives a first flight of the Mk1A variant on 28 March 2024 from Bengaluru. Other reports describe later Mk1A flights from Nashik, so check the record before you rely on the date.', src: 'Militaer aktuell / Kerala Kaumudi (secondary)', c: '#ff7a59' },
];

const YEAR0 = 1799, YEAR1 = 2026;
const SOURCES = [
  { title: 'Wright brothers: the century before (Century Before, 1799 to 1859)', publisher: 'Wright Brothers Aeroplane Company', url: 'https://www.wright-brothers.org/History_Wing/History_of_the_Airplane/Century_Before/First_Airplanes/First_Airplanes.htm' },
  { title: '1903: The First Heavier-than-Air Flight', publisher: 'US Air Force History Office', url: 'https://www.afhistory.af.mil/FAQs/Fact-Sheets/Article/459013/1903-the-first-heavier-than-air-flight' },
  { title: 'Indian Air Force', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Indian_Air_Force' },
  { title: 'Boeing 747', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Boeing_747' },
  { title: 'J. R. D. Tata', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/JRD_Tata' },
  { title: 'Tata Group: Wings for a nation', publisher: 'Tata.com newsroom', url: 'https://tata.com/newsroom/wings-for-a-nation' },
  { title: 'DGCA: operational airports (website snapshot, Oct 2025, read via search)', publisher: 'Directorate General of Civil Aviation', url: 'https://www.civilaviation.gov.in/' },
  { title: 'ICAO 2025 State of Global Aviation Safety (press summary of the 2024 figures)', publisher: 'ICAO (report via press coverage)', url: 'https://www.icao.int/' },
];

const yearToX = (y, x0, x1) => x0 + ((y - YEAR0) / (YEAR1 - YEAR0)) * (x1 - x0);

export default {
  id: 'history',
  short: 'History and India',
  title: 'From gliders to India’s skies',
  subtitle: 'The first idea, the first flight, the first Indian pilot, and the jets of today.',
  view: { pos: [0.0, -1.6, 8.4], target: [0.0, -3.0, 0] },
  learn: `<p>People wanted to fly for thousands of years, but the big problem was not the engine. It was <b>control</b>, and knowing how a wing makes lift. <b>Sir George Cayley</b> separated the jobs of lift, push and steering. <b>Otto Lilienthal</b> flew many gliders in the 1890s and learned from each one. The <b>Wright brothers</b> added the one thing that made flight practical: a way to steer the aeroplane in the air, on 17 December 1903.</p>
    <p>In India, <b>J.R.D. Tata</b> got the first Indian pilot's licence in 1929, and flew the first Indian airmail in 1932. The <b>Indian Air Force</b> began in 1932 and commissioned its first squadron in 1933. Later, <b>Hindustan Aeronautics</b> built the Marut and, much later, the Tejas light combat aircraft. The Boeing 747 in 1969 showed what big jets could carry.</p>
    <p>Air travel today is very safe, judged by accidents per flight. The ICAO figure for 2024 is about 2.6 accidents per million departures for scheduled commercial flights (the report puts the measure this way). Flying still needs training, checks and rules. In India the Directorate General of Civil Aviation (DGCA) regulates safety and issues licences, under the Ministry of Civil Aviation.</p>
    <p class="tip"><b>Try it:</b> slide the year. Each date sits on the line, and the moment is named beside it.</p>`,
  terms: [
    { t: 'Auxiliary air force', d: 'A force that supports a regular air force. The Indian Air Force began as one, linked to the Royal Air Force.' },
    { t: 'Licence No. 1', d: 'The first pilot’s licence issued in India, held by J.R.D. Tata.' },
    { t: 'Wide-body', d: 'An airliner with two aisles, wide enough for a second row of seats in the cabin.' },
    { t: 'Technology demonstrator', d: 'An early aircraft built to test a design, not to fly in service.' },
    { t: 'Departure', d: 'One aircraft taking off on a flight. ICAO counts accident rates per million departures.' },
  ],
  defaults: { year: 1903 },
  controls: [
    { key: 'year', type: 'range', label: 'Year', min: YEAR0, max: YEAR1, step: 1, ends: ['1799', '2026'], fmt: (v) => String(Math.round(v)) },
  ],
  quiz: [
    { q: 'When did the Wright brothers make their first powered flight?', options: ['17 December 1903', '1909', '1929', '25 July 1932'], answer: 0, why: 'On 17 December 1903 at Kill Devil Hills, North Carolina: about 120 feet in 12 seconds.' },
    { q: 'Who was India’s first licensed pilot?', options: ['Aspy Engineer', 'J.R.D. Tata', 'Walchand Hirachand', 'Rajiv Kothiyal'], answer: 1, why: 'J.R.D. Tata received licence No. 1 issued in India in February 1929.' },
    { q: 'What does ICAO count when it reports the accident rate?', options: ['Accidents per million flight departures', 'Accidents per aircraft per year only', 'Passengers per airport', 'Fuel burned per flight'], answer: 0, why: 'Accident rates are reported per million departures, so busy airports and quiet ones can be compared fairly.' },
  ],
  reel: [
    { ms: 5200, caption: 'In 1903 the Wright brothers flew 120 feet. In 1932 India\u2019s Air Force was set up.', set: { year: 1932 }, anim: { year: [1903, 1932] }, spin: 0 },
  ],

  build({ stage, label }) {
    // The timeline is a flat canvas on the stage. Dates run left to right, one dot per moment.
    const W = 8.8, H = 4.4;
    const sel = { year: 1903 };
    // Dates run left to right. Every moment is a dot on the line; the latest one reached is named.
    const draw = (g, w, h, year) => {
      g.fillStyle = 'rgba(10,12,18,.94)'; g.fillRect(0, 0, w, h);
      const x0 = 70, x1 = w - 70, yl = h * 0.5;
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 6; g.beginPath(); g.moveTo(x0, yl); g.lineTo(x1, yl); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '40px sans-serif'; g.textAlign = 'center';
      for (const y of [1800, 1850, 1900, 1950, 2000]) { const x = yearToX(y, x0, x1); g.fillRect(x - 2, yl - 14, 4, 28); g.fillText(String(y), x, yl + 70); }
      g.textAlign = 'left';
      EVENTS.forEach((e) => {
        const x = yearToX(e.y, x0, x1), passed = e.y <= year;
        g.fillStyle = passed ? e.c : 'rgba(255,255,255,.25)';
        g.beginPath(); g.arc(x, yl, passed ? 15 : 9, 0, Math.PI * 2); g.fill();
      });
      const last = [...EVENTS].filter((e) => e.y <= year).pop();
      if (last) {
        const x = yearToX(last.y, x0, x1);
        g.strokeStyle = last.c; g.lineWidth = 4; g.beginPath(); g.moveTo(x, yl - 20); g.lineTo(x, yl - 150); g.stroke();
        g.fillStyle = last.c; g.font = '46px sans-serif';
        const tx = Math.min(x + 12, w - 560);
        g.fillText(last.t.length > 34 ? last.t.slice(0, 33) + '…' : last.t, tx, yl - 170);
      }
      // The year cursor, with the year in large type.
      const cx = yearToX(year, x0, x1);
      g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(cx, yl + 30); g.lineTo(cx, h - 40); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#ffffff'; g.font = '84px sans-serif'; g.textAlign = 'center'; g.fillText(String(year), cx, h - 70); g.textAlign = 'left';
    };
    const bd = board(stage.root, W, H, [0, -5.0, 0], (g, w, h, year) => draw(g, w, h, year));

    let lastYear = -1;
    return {
      update(dt, s) {
        fitNarrow(stage);
        const y = Math.round(s.year);
        if (y !== lastYear) { lastYear = y; sel.year = y; bd.redraw(y); }
      },
      readout: (s) => {
        const y = Math.round(s.year);
        const passed = EVENTS.filter((e) => e.y <= y);
        const e = passed[passed.length - 1];
        if (!e) return '<div class="big">Before 1799</div>';
        return `<div class="big">${e.y}: ${e.t}</div>
          <p class="hint" style="position:static;margin:8px 0 0;font-size:13px;color:var(--dim);max-width:52ch">${e.d}</p>
          <p class="hint" style="position:static;margin:8px 0 0;font-size:13px;color:var(--dim)">Source: ${e.src}.</p>
          <div class="row"><span>Operational airports in India</span><b>162 (DGCA, Oct 2025)</b></div>
          <div class="row"><span>Accidents, scheduled flights, 2024</span><b>2.56 per million departures</b></div>`;
      },
    };
  },
};
