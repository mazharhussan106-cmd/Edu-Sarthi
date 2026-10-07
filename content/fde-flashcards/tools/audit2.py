"""Extra audit beyond audit_cards.py: MCQ answer letter spread, option count, answer-in-options, duplicate terms/ids across decks."""
import json,collections,re,sys
decks="lnx dkr cld cicd net ts etl air k8s obs sso llm rag evl jup req pbi api sup en".split()
tot=collections.Counter(); issues=[]; terms=collections.defaultdict(list); ids=collections.Counter()
for d in decks:
    cards=json.load(open(f"{d}/d.json"))["cards"]
    ac=collections.Counter()
    for c in cards:
        f=c["fields"]; ids[c["id"]]+=1
        terms[f.get("term","").strip().lower()].append(c["id"])
        a=f.get("mcq_answer","").strip(); ac[a]+=1
        o=f.get("mcq_options","")
        parts=re.split(r"\s(?=[A-D]\) )",o.strip())
        if len(parts)!=4: issues.append((c["id"],"options count",len(parts)))
        if a not in "ABCD" or len(a)!=1: issues.append((c["id"],"bad answer",a))
        for k in ("mcq_question","mcq_why","fill_blank"):
            if not f.get(k): issues.append((c["id"],"missing",k))
        if "→" not in f.get("fill_blank",""): issues.append((c["id"],"fill no arrow"))
    tot.update(ac); print(d,len(cards),dict(sorted(ac.items())))
print("TOTAL",dict(tot))
print("dup ids",[i for i,n in ids.items() if n>1])
print("dup terms",{t:v for t,v in terms.items() if len(v)>1})
print("issues",issues[:20],len(issues))
