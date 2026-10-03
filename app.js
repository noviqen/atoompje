// ---------- Hulpjes ----------
const $ = (id) => document.getElementById(id);
const perNr = Object.fromEntries(ELEMENTEN.map((e) => [e.nr, e]));
const kleur = (e) => CATEGORIEEN[e.cat].kleur;
const schud = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const kies = (a) => a[Math.floor(Math.random() * a.length)];
const periode = (e) => (e.rij === 9 ? 6 : e.rij === 10 ? 7 : e.rij);
const groep = (e) => (e.rij >= 9 ? "3 (f-blok)" : e.kol);

// ---------- Opslag ----------
const OPSLAG = "atoompje-v1";
let staat = JSON.parse(localStorage.getItem(OPSLAG) || "null") || { punten: {}, besteReeks: 0, quizzen: 0, perfect: 0, bekeken: [], geluid: true };
const bewaar = () => localStorage.setItem(OPSLAG, JSON.stringify(staat));
const punten = (nr) => staat.punten[nr] || 0;
const status = (nr) => (punten(nr) >= 3 ? 2 : punten(nr) > 0 ? 1 : 0);
function scoor(nr, goed) {
  staat.punten[nr] = Math.max(0, Math.min(5, punten(nr) + (goed ? 1 : -1)));
  bewaar(); werkScoreBij();
}
function werkScoreBij() {
  $("aantalGekend").textContent = ELEMENTEN.filter((e) => status(e.nr) === 2).length;
  $("besteReeks").textContent = staat.besteReeks;
  $("geluidKnop").textContent = staat.geluid ? "🔊" : "🔇";
}

// ---------- Oefensets ----------
const SCHOOLLIJST = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,24,25,26,27,28,29,30,35,47,50,53,56,78,79,80,82,92];
const SETS = {
  school:  { naam: "📚 Schoollijst klas 3 (37)", lijst: () => SCHOOLLIJST.map((n) => perNr[n]) },
  eerste20:{ naam: "🌱 Eerste 20", lijst: () => ELEMENTEN.slice(0, 20) },
  eerste36:{ naam: "🌿 Eerste 36", lijst: () => ELEMENTEN.slice(0, 36) },
  latijn:  { naam: "🏛️ Rare Latijnse symbolen", lijst: () => ELEMENTEN.filter((e) => e.tip) },
  alle:    { naam: "🌍 Alle 118", lijst: () => ELEMENTEN },
  oefen:   { naam: "🎯 Nog niet gekend", lijst: () => { const l = ELEMENTEN.filter((e) => status(e.nr) < 2); return l.length >= 4 ? l : ELEMENTEN; } },
};
for (const sel of [$("kaartSet"), $("quizSet")]) {
  sel.innerHTML = Object.entries(SETS).map(([k, s]) => `<option value="${k}">${s.naam}</option>`).join("");
}

// ---------- Tabs ----------
document.querySelectorAll("nav button").forEach((b) => b.addEventListener("click", () => toonTab(b.dataset.tab)));
function toonTab(naam) {
  document.querySelectorAll("nav button").forEach((b) => b.classList.toggle("actief", b.dataset.tab === naam));
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("actief", t.id === naam));
  if (naam === "kaarten" && !huidigeKaart) nieuweKaart();
  if (naam === "voortgang") tekenVoortgang();
}

// ---------- Rooster ----------
function maakTegel(e, klik) {
  const t = document.createElement("button");
  t.className = "tegel";
  t.style.gridRow = e.rij; t.style.gridColumn = e.kol;
  t.style.background = kleur(e);
  t.dataset.nr = e.nr; t.dataset.cat = e.cat;
  t.title = `${e.nr} ${e.naam}`;
  t.innerHTML = `<span class="nr">${e.nr}</span><span class="sym">${e.sym}</span><span class="nm">${e.naam}</span><span class="ms">${e.massa}</span>`;
  t.addEventListener("click", () => klik(e, t));
  return t;
}
function plekhouders(rooster) {
  [[6, "57–71", "lanthaan"], [7, "89–103", "actinide"]].forEach(([rij, tekst, cat]) => {
    const p = document.createElement("div");
    p.className = "tegel plek";
    p.style.gridRow = rij; p.style.gridColumn = 3; p.style.background = CATEGORIEEN[cat].kleur;
    p.textContent = tekst;
    rooster.appendChild(p);
  });
}
function bouwRooster(rooster, klik) {
  rooster.innerHTML = "";
  ELEMENTEN.forEach((e) => rooster.appendChild(maakTegel(e, klik)));
  plekhouders(rooster);
}
bouwRooster($("rooster"), (e) => openDetail(e));

// Legenda: klik op een familie om die uit te lichten
let actieveCat = null;
$("legenda").innerHTML = Object.entries(CATEGORIEEN)
  .map(([k, c]) => `<button data-cat="${k}" style="background:${c.kleur}" title="${c.uitleg}">${c.naam}</button>`).join("");
$("legenda").addEventListener("click", (ev) => {
  const cat = ev.target.dataset.cat; if (!cat) return;
  actieveCat = actieveCat === cat ? null : cat;
  document.querySelectorAll("#legenda button").forEach((b) => b.classList.toggle("uit", actieveCat && b.dataset.cat !== actieveCat));
  document.querySelectorAll("#rooster .tegel[data-nr]").forEach((t) => t.classList.toggle("vaag", actieveCat && t.dataset.cat !== actieveCat));
  if (actieveCat) praat(`${CATEGORIEEN[cat].naam}. ${CATEGORIEEN[cat].uitleg}`, false);
});

// ---------- Detailkaart ----------
function openDetail(e) {
  const c = CATEGORIEEN[e.cat];
  if (!staat.bekeken.includes(e.nr)) { staat.bekeken.push(e.nr); bewaar(); }
  $("detail").innerHTML = `
    <div class="detail-kop" style="background:${c.kleur}">
      <div class="groot-symbool"><small>${e.nr}</small><b>${e.sym}</b><small>${e.massa}</small></div>
      <div><h3>${e.naam}</h3><div>${c.naam}</div><div>Groep ${groep(e)} · Periode ${periode(e)}</div></div>
    </div>
    <div class="detail-body">
      <div class="blok">💡 <b>Wist je dat?</b><br>${e.weetje}</div>
      ${e.tip ? `<div class="blok tip">🧠 <b>Geheugensteun</b><br>${e.tip}</div>` : ""}
      <div class="blok">👪 <b>${c.naam}</b><br>${c.uitleg}</div>
      <div class="blok">⚖️ Atoommassa: <b>${e.massa} u</b>${e.massa.startsWith("(") ? " (radioactief, dit is de meest stabiele vorm)" : ""}</div>
      <div class="detail-nav">
        <button class="knop grijs" data-ga="${e.nr - 1}" ${e.nr === 1 ? "disabled" : ""}>◀</button>
        <button class="knop" id="spreek">🗣️ Spreek uit</button>
        <button class="knop grijs" data-ga="${e.nr + 1}" ${e.nr === 118 ? "disabled" : ""}>▶</button>
      </div>
    </div>`;
  $("overlay").hidden = false;
  $("spreek").onclick = () => praat(`${e.naam}. Symbool: ${e.sym.split("").join(" ")}. ${e.weetje}`);
  $("detail").querySelectorAll("[data-ga]").forEach((b) => (b.onclick = () => openDetail(perNr[+b.dataset.ga])));
  piep(400 + e.nr * 4, 0.08);
}
$("overlay").addEventListener("click", (ev) => { if (ev.target.id === "overlay") $("overlay").hidden = true; });
document.addEventListener("keydown", (ev) => { if (ev.key === "Escape") $("overlay").hidden = true; });

function praat(tekst, altijd = true) {
  if (!("speechSynthesis" in window) || (!altijd && !staat.geluid)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(tekst);
  u.lang = "nl-NL"; u.rate = 0.95;
  speechSynthesis.speak(u);
}

// ---------- Geluid ----------
let audio;
function piep(freq, duur = 0.12, type = "sine") {
  if (!staat.geluid) return;
  audio = audio || new (window.AudioContext || window.webkitAudioContext)();
  const o = audio.createOscillator(), g = audio.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.15, audio.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duur);
  o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + duur);
}
const geluidGoed = () => { piep(660); setTimeout(() => piep(880), 100); };
const geluidFout = () => piep(180, 0.25, "square");
$("geluidKnop").onclick = () => { staat.geluid = !staat.geluid; bewaar(); werkScoreBij(); };

// ---------- Confetti ----------
const doek = $("confetti"), pen = doek.getContext("2d");
let snippers = [];
function confetti(aantal = 120) {
  doek.width = innerWidth; doek.height = innerHeight;
  const kleuren = Object.values(CATEGORIEEN).map((c) => c.kleur);
  for (let i = 0; i < aantal; i++) {
    snippers.push({ x: innerWidth / 2, y: innerHeight / 3, vx: (Math.random() - 0.5) * 14, vy: Math.random() * -12 - 2,
      r: Math.random() * 6 + 4, k: kies(kleuren), hoek: Math.random() * 6, leven: 120 });
  }
  if (snippers.length === aantal) requestAnimationFrame(animeer);
}
function animeer() {
  pen.clearRect(0, 0, doek.width, doek.height);
  snippers.forEach((s) => {
    s.x += s.vx; s.y += s.vy; s.vy += 0.35; s.hoek += 0.2; s.leven--;
    pen.save(); pen.translate(s.x, s.y); pen.rotate(s.hoek); pen.fillStyle = s.k;
    pen.fillRect(-s.r / 2, -s.r / 2, s.r, s.r * 0.6); pen.restore();
  });
  snippers = snippers.filter((s) => s.leven > 0);
  if (snippers.length) requestAnimationFrame(animeer); else pen.clearRect(0, 0, doek.width, doek.height);
}

// ---------- Flitskaarten ----------
let huidigeKaart = null;
function nieuweKaart() {
  const lijst = SETS[$("kaartSet").value].lijst();
  // Elementen die je minder goed kent komen vaker langs
  const gewogen = lijst.flatMap((e) => Array(6 - Math.min(5, punten(e.nr))).fill(e)).filter((e) => e !== huidigeKaart);
  huidigeKaart = kies(gewogen.length ? gewogen : lijst);
  const e = huidigeKaart, k = kleur(e);
  $("flitskaart").classList.remove("om");
  setTimeout(() => {
    $("kaartVoor").style.background = k; $("kaartAchter").style.background = k;
    $("kaartVoor").innerHTML = `<div class="klein-tekst">${e.nr}</div><div class="reus">${e.sym}</div><div class="klein-tekst">Hoe heet ik? 🤔</div>`;
    $("kaartAchter").innerHTML = `<div class="naam">${e.naam}</div><div class="klein-tekst">${e.weetje}</div>${e.tip ? `<div class="klein-tekst">🧠 ${e.tip}</div>` : ""}`;
    const s = ["nog nieuw", "bijna gekend", "gekend ⭐"][status(e.nr)];
    $("kaartInfo").textContent = `Dit element is ${s} ·${lijst.filter((x) => status(x.nr) === 2).length}/${lijst.length} van deze set gekend`;
  }, 150);
}
$("flitskaart").onclick = () => { $("flitskaart").classList.toggle("om"); piep(520, 0.06); };
$("kenIk").onclick = () => { scoor(huidigeKaart.nr, true); geluidGoed(); if (status(huidigeKaart.nr) === 2 && punten(huidigeKaart.nr) === 3) confetti(60); nieuweKaart(); };
$("nogNiet").onclick = () => { scoor(huidigeKaart.nr, false); piep(300, 0.1); nieuweKaart(); };
$("kaartSet").onchange = nieuweKaart;

// ---------- Quiz ----------
const AANTAL_VRAGEN = 10;
const AANMOEDIGING = ["Top! 🎉", "Knap hoor! 🌟", "Jij bent een echte chemicus! 🧪", "Yes! 💥", "Super! 🚀", "Atoompje is trots! ⚛️"];
let quiz = null;

document.querySelectorAll(".modus").forEach((b) => b.addEventListener("click", () => startQuiz(b.dataset.modus)));
$("opnieuw").onclick = () => { $("quizEinde").hidden = true; $("quizStart").hidden = false; };
$("volgende").onclick = volgendeVraag;

function startQuiz(modus) {
  const lijst = SETS[$("quizSet").value].lijst();
  quiz = { modus, lijst, vragen: schud(lijst).slice(0, AANTAL_VRAGEN), i: -1, score: 0, reeks: 0 };
  while (quiz.vragen.length < AANTAL_VRAGEN) quiz.vragen.push(kies(lijst));
  $("quizStart").hidden = true; $("quizSpel").hidden = false;
  volgendeVraag();
}

function opties(goed, veld) {
  const bron = quiz.lijst.length >= 4 ? quiz.lijst : ELEMENTEN;
  const andere = schud(bron.filter((e) => e[veld] !== goed[veld])).slice(0, 3);
  return schud([goed, ...andere]);
}

function volgendeVraag() {
  quiz.i++;
  if (quiz.i >= AANTAL_VRAGEN) return eindeQuiz();
  const e = quiz.vragen[quiz.i];
  $("vraagNr").textContent = quiz.i + 1;
  $("feedback").innerHTML = ""; $("volgende").hidden = true;
  $("antwoorden").innerHTML = ""; $("zoekWrap").hidden = true;
  const vraag = $("vraag");

  if (quiz.modus === "naam2sym") {
    vraag.innerHTML = `Wat is het symbool van<span class="groot">${e.naam}</span>`;
    toonOpties(e, opties(e, "sym"), (x) => x.sym);
  } else if (quiz.modus === "sym2naam") {
    vraag.innerHTML = `Welk element is<span class="groot" style="color:${kleur(e)}">${e.sym}</span>`;
    toonOpties(e, opties(e, "naam"), (x) => x.naam);
  } else if (quiz.modus === "weetje") {
    const verstopt = e.weetje.replace(new RegExp(e.naam, "gi"), "???");
    vraag.innerHTML = `<span style="font-size:1.1rem;font-weight:500">“${verstopt}”</span><br>Over welk element gaat dit?`;
    toonOpties(e, opties(e, "naam"), (x) => `${x.sym} · ${x.naam}`);
  } else if (quiz.modus === "familie") {
    vraag.innerHTML = `Bij welke familie hoort<span class="groot" style="color:${kleur(e)}">${e.sym}</span>${e.naam}`;
    const cats = schud([e.cat, ...schud(Object.keys(CATEGORIEEN).filter((c) => c !== e.cat)).slice(0, 3)]);
    toonOpties(e, cats.map((c) => ({ cat: c })), (x) => CATEGORIEEN[x.cat].naam, (x) => x.cat === e.cat);
  } else {
    vraag.innerHTML = `Waar staat<span class="groot">${e.naam}</span>Tik het juiste vakje aan!`;
    $("zoekWrap").hidden = false;
    bouwRooster($("zoekRooster"), (x, tegel) => {
      if (!$("volgende").hidden) return;
      const goed = x.nr === e.nr;
      tegel.classList.add(goed ? "goed" : "fout");
      if (!goed) $("zoekRooster").querySelector(`[data-nr="${e.nr}"]`).classList.add("goed");
      verwerk(e, goed);
    });
    // In de zoekmodus de symbolen verbergen zou te moeilijk zijn; we tonen ze wel
  }
}

function toonOpties(e, lijst, label, isGoed = (x) => x.nr === e.nr) {
  lijst.forEach((x) => {
    const b = document.createElement("button");
    b.className = "antwoord"; b.textContent = label(x);
    b.onclick = () => {
      const goed = isGoed(x);
      document.querySelectorAll(".antwoord").forEach((a, i) => { a.disabled = true; if (isGoed(lijst[i])) a.classList.add("goed"); });
      if (!goed) b.classList.add("fout");
      verwerk(e, goed);
    };
    $("antwoorden").appendChild(b);
  });
}

function verwerk(e, goed) {
  scoor(e.nr, goed);
  if (goed) {
    quiz.score++; quiz.reeks++;
    geluidGoed();
    if (quiz.reeks > staat.besteReeks) { staat.besteReeks = quiz.reeks; bewaar(); werkScoreBij(); }
    if (quiz.reeks % 5 === 0) confetti(80);
    $("feedback").innerHTML = `<b>${kies(AANMOEDIGING)}</b> ${e.sym} = ${e.naam}<br><small>💡 ${e.weetje}</small>`;
  } else {
    quiz.reeks = 0; geluidFout();
    $("feedback").innerHTML = `<b>Oeps!</b> Het was <b>${e.sym} = ${e.naam}</b>${e.tip ? `<br><small>🧠 ${e.tip}</small>` : `<br><small>💡 ${e.weetje}</small>`}`;
  }
  $("quizScore").textContent = quiz.score; $("reeks").textContent = quiz.reeks;
  $("volgende").hidden = false;
}

function eindeQuiz() {
  $("quizSpel").hidden = true; $("quizEinde").hidden = false;
  staat.quizzen++;
  if (quiz.score === AANTAL_VRAGEN) staat.perfect++;
  bewaar();
  const s = quiz.score;
  $("eindeEmoji").textContent = s === 10 ? "🏆" : s >= 7 ? "🥳" : s >= 4 ? "💪" : "🌱";
  $("eindeTekst").textContent = s === 10 ? `Perfect! 10 van de 10!` : s >= 7 ? `Heel goed: ${s} van de 10!` : s >= 4 ? `${s} van de 10. Je bent goed bezig!` : `${s} van de 10. Oefening baart kunst!`;
  if (s >= 7) confetti(s === 10 ? 200 : 100);
  $("quizScore").textContent = 0; $("reeks").textContent = 0;
}

// ---------- Ezelsbruggetjes ----------
const perSym = Object.fromEntries(ELEMENTEN.map((e) => [e.sym, e]));
const chips = (syms) => syms.map((s) => `<span style="background:${kleur(perSym[s])}">${s}</span>`).join("");
$("bruggen").innerHTML = EZELSBRUGGETJES.map((b) => `
  <div class="brug"><h4>${b.titel}</h4><div class="els">${chips(b.elementen.split(" "))}</div><p>${b.zin}</p></div>`).join("");
$("latijn").innerHTML = ELEMENTEN.filter((e) => e.tip).map((e) => `
  <div class="brug"><div class="els">${chips([e.sym])} <b>${e.naam}</b></div><p>${e.tip}</p></div>`).join("");

// ---------- Voortgang ----------
const BADGES = [
  { ico: "🔍", naam: "Ontdekker", eis: "Bekijk 20 elementen", ok: () => staat.bekeken.length >= 20 },
  { ico: "🌱", naam: "Kiemplantje", eis: "Ken 10 elementen", ok: () => telGekend() >= 10 },
  { ico: "📚", naam: "Klas 3-kampioen", eis: "Ken de hele schoollijst", ok: () => SCHOOLLIJST.every((n) => status(n) === 2) },
  { ico: "🔥", naam: "Op dreef", eis: "Reeks van 10 goed", ok: () => staat.besteReeks >= 10 },
  { ico: "🏆", naam: "Foutloos", eis: "Een quiz 10/10", ok: () => staat.perfect >= 1 },
  { ico: "🏛️", naam: "Latinist", eis: "Ken alle Latijnse symbolen", ok: () => ELEMENTEN.filter((e) => e.tip).every((e) => status(e.nr) === 2) },
  { ico: "🧪", naam: "Halve chemicus", eis: "Ken 59 elementen", ok: () => telGekend() >= 59 },
  { ico: "👑", naam: "Mendelejev", eis: "Ken alle 118!", ok: () => telGekend() === 118 },
];
const telGekend = () => ELEMENTEN.filter((e) => status(e.nr) === 2).length;
function tekenVoortgang() {
  const n = telGekend();
  $("voortgangVulling").style.width = `${(n / 118) * 100}%`;
  $("voortgangTekst").textContent = `Je kent ${n} van de 118 elementen (${staat.quizzen} quizzen gespeeld)`;
  $("badges").innerHTML = BADGES.map((b) => `<div class="badge ${b.ok() ? "" : "slot"}" title="${b.eis}"><div>${b.ico}</div><b>${b.naam}</b><br><small>${b.eis}</small></div>`).join("");
  bouwRooster($("voortgangRooster"), (e) => openDetail(e));
  $("voortgangRooster").querySelectorAll(".tegel[data-nr]").forEach((t) => t.classList.add(`status-${status(+t.dataset.nr)}`));
}
$("reset").onclick = () => {
  if (!confirm("Weet je zeker dat je al je voortgang wilt wissen?")) return;
  staat = { punten: {}, besteReeks: 0, quizzen: 0, perfect: 0, bekeken: [], geluid: staat.geluid };
  bewaar(); werkScoreBij(); tekenVoortgang();
};

werkScoreBij();
