"""Build one deck: python finish.py <deckdir> <ID prefix> <Deck name> <default card id> <title for the page>
Runs convert, audit, workbook, preview html and a three-side screenshot into <deckdir>/out."""
import json, os, re, subprocess, sys
S = os.path.dirname(os.path.abspath(__file__))
deck, name, title, default = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
d = os.path.join(S, deck); out = os.path.join(d, "out"); os.makedirs(out, exist_ok=True)
parts = sorted(f for f in os.listdir(d) if re.fullmatch(r"[a-z]+\d+\.txt", f))
allt = os.path.join(d, "all.txt")
open(allt, "w", encoding="utf-8").write("".join(open(os.path.join(d, p), encoding="utf-8").read() for p in parts))
sc = os.path.join(S, "scripts")
js = os.path.join(d, "d.json")
subprocess.run([sys.executable, "txt_to_deck.py", allt, js], cwd=sc, check=True)
r = subprocess.run([sys.executable, "audit_cards.py", js], cwd=sc, capture_output=True, text=True)
print(r.stdout)
if "0 errors" not in r.stdout.splitlines()[0]:
    sys.exit("fix errors first")
t = open(allt, encoding="utf-8").read()
print("devanagari", len(re.findall("[ऀ-ॿ]", t)))
subprocess.run([sys.executable, "build_xlsx.py", js, os.path.join(out, f"{name}.xlsx")], cwd=sc, check=True)
data = json.load(open(js)); cards = []
for c in data["cards"]:
    f = dict(c["fields"]); f.update(id=c["id"], topic=c["topic"], level=c.get("level", ""), type=c["type"]); cards.append(f)
cj = json.dumps(cards, ensure_ascii=False).replace("</", "<\\/")
h = open(os.path.join(S, "template_preview.html"), encoding="utf-8").read()
h = re.sub(r"const CARDS=.*?;\nlet i=0", lambda m: "const CARDS=" + cj + ";\nlet i=0", h, count=1, flags=re.S)
h = h.replace("__TITLE__", title).replace("__DEFAULT__", default)
open(os.path.join(out, f"{name} card preview.html"), "w", encoding="utf-8").write(h)
open(os.path.join(S, "GitHub card preview.html"), "w", encoding="utf-8").write(h)
env = dict(os.environ, NODE_PATH=subprocess.run(["npm", "root", "-g"], capture_output=True, text=True).stdout.strip())
subprocess.run(["node", "shot.js"], cwd=S, env=env, check=True)
from PIL import Image
ims = [Image.open(os.path.join(S, f"side{i}.png")) for i in (1, 2, 3)]
o = Image.new("RGB", (sum(i.width for i in ims) + 40, ims[0].height), "#dcdcdc"); x = 0
for i in ims: o.paste(i, (x, 0)); x += i.width + 20
o.save(os.path.join(out, f"three-sides-{name}.png"))
print(os.listdir(out))
