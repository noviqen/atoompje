"""Maakt de voorleesbestanden in audio/ met de natuurlijke Nederlandse ElevenLabs-stem 'Roos'.
Gebruik (vanuit de projectmap, node nodig):
  ../pizza-app/promo/.venv/bin/python tools/maak_audio.py
API-sleutel: ~/.config/elevenlabs/api_key"""
import json, pathlib, re, subprocess
from concurrent.futures import ThreadPoolExecutor
from elevenlabs.client import ElevenLabs

STEM = "7qdUFMklKPaaAVMsBTBt"  # Roos - Kind, Articulate and Confident (NL)
MODEL = "eleven_multilingual_v2"
INSTELLINGEN = {"stability": 0.45, "similarity_boost": 0.8, "style": 0.3, "use_speaker_boost": True}
LETTERS = dict(A="aa", B="bee", C="see", D="dee", E="ee", F="ef", G="gee", H="haa", I="ie", J="jee", K="kaa", L="el",
               M="em", N="en", O="oo", P="pee", Q="kuu", R="er", S="es", T="tee", U="uu", V="vee", W="wee", X="iks", Y="ei", Z="zet")

def spreekbaar(t):
    t = t.replace("H₂O", "haa twee oo").replace(" (NaCl)", "").replace("−", "min ").replace("°C", "graden")
    return re.sub(r"\s*=\s*", " betekent ", t)

data = json.loads(subprocess.check_output(["node", "-e",
    "eval(require('fs').readFileSync('data.js','utf8')+';process.stdout.write(JSON.stringify({e:ELEMENTEN,c:CATEGORIEEN}))')"]))
taken = [(f"audio/{e['nr']}.mp3", f"{e['naam']}. Het symbool is: {', '.join(LETTERS[c.upper()] for c in e['sym'])}. {spreekbaar(e['weetje'])}")
         for e in data["e"]]
taken += [(f"audio/cat-{k}.mp3", f"{c['naam']}. {spreekbaar(c['uitleg'])}") for k, c in data["c"].items()]

el = ElevenLabs(api_key=(pathlib.Path.home() / ".config/elevenlabs/api_key").read_text().strip())

def maak(taak):
    pad, tekst = taak
    for poging in range(3):
        try:
            audio = el.text_to_speech.convert(voice_id=STEM, model_id=MODEL, text=tekst,
                                              output_format="mp3_44100_96", voice_settings=INSTELLINGEN)
            pathlib.Path(pad).write_bytes(b"".join(audio)); return
        except Exception:
            if poging == 2: raise

with ThreadPoolExecutor(3) as pool:
    list(pool.map(maak, taken))
print(len(taken), "bestanden gemaakt")
