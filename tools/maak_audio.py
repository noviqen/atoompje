"""Maakt de voorleesbestanden in audio/ met een natuurlijke Nederlandse stem.
Gebruik: uvx --with edge-tts python tools/maak_audio.py   (vanuit de projectmap; node nodig)"""
import asyncio, json, re, subprocess
import edge_tts

STEM = "nl-NL-FennaNeural"
LETTERS = dict(A="aa", B="bee", C="see", D="dee", E="ee", F="ef", G="gee", H="haa", I="ie", J="jee", K="kaa", L="el",
               M="em", N="en", O="oo", P="pee", Q="kuu", R="er", S="es", T="tee", U="uu", V="vee", W="wee", X="iks", Y="ei", Z="zet")

def spreekbaar(t):
    t = t.replace("H₂O", "haa twee oo").replace(" (NaCl)", "").replace("−", "min ").replace("°C", "graden")
    t = re.sub(r"\s*=\s*", " betekent ", t)
    return t

data = json.loads(subprocess.check_output(["node", "-e",
    "eval(require('fs').readFileSync('data.js','utf8')+';process.stdout.write(JSON.stringify({e:ELEMENTEN,c:CATEGORIEEN}))')"]))
taken = []
for e in data["e"]:
    sym = ", ".join(LETTERS[ch.upper()] for ch in e["sym"])
    taken.append((f"audio/{e['nr']}.mp3", f"{e['naam']}. Het symbool is: {sym}. {spreekbaar(e['weetje'])}"))
for k, c in data["c"].items():
    taken.append((f"audio/cat-{k}.mp3", f"{c['naam']}. {spreekbaar(c['uitleg'])}"))

async def maak(pad, tekst, sem):
    async with sem:
        for poging in range(3):
            try:
                await edge_tts.Communicate(tekst, STEM, rate="-5%").save(pad); return
            except Exception as fout:
                if poging == 2: raise
                await asyncio.sleep(2)

async def main():
    sem = asyncio.Semaphore(6)
    await asyncio.gather(*(maak(p, t, sem) for p, t in taken))
    print(len(taken), "bestanden gemaakt")

asyncio.run(main())
