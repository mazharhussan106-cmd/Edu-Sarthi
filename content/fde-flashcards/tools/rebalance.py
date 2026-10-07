"""Rebalance MCQ answer positions so the correct option is not always A. Deterministic (seeded by card id)."""
import os,re,random,sys,collections
decks=sys.argv[1:]
for d in decks:
    parts=sorted(f for f in os.listdir(d) if re.fullmatch(r"[a-z]+\d+\.txt",f))
    n=0; targets=[]; cnt=collections.Counter()
    for p in parts:
        path=os.path.join(d,p); lines=open(path,encoding="utf-8").read().split("\n")
        cid=None; opts_i=ans_i=None; out=lines[:]
        def flush():
            global n
            if cid and opts_i is not None and ans_i is not None:
                o=re.split(r"\s(?=[A-D]\) )",out[opts_i][len("mcq_options:"):].strip())
                texts=[re.sub(r"^[A-D]\) ","",x) for x in o]
                a="ABCD".index(out[ans_i].split(":",1)[1].strip())
                rnd=random.Random(cid)
                # balanced: cycle through a shuffled block of 4 target positions
                nonlocal_targets=targets
                if not nonlocal_targets:
                    blk=[0,1,2,3]; rnd.shuffle(blk); nonlocal_targets.extend(blk)
                t=nonlocal_targets.pop()
                correct=texts[a]; rest=[x for i,x in enumerate(texts) if i!=a]; rnd.shuffle(rest)
                rest.insert(t,correct)
                out[opts_i]="mcq_options: "+" ".join(f"{'ABCD'[i]}) {x}" for i,x in enumerate(rest))
                out[ans_i]=f"mcq_answer: {'ABCD'[t]}"; cnt["ABCD"[t]]+=1; n+=1
        for i,l in enumerate(lines):
            if l.startswith("@"):
                flush(); cid=l[1:].strip(); opts_i=ans_i=None
            elif l.startswith("mcq_options:"): opts_i=i
            elif l.startswith("mcq_answer:"): ans_i=i
        flush()
        open(path,"w",encoding="utf-8").write("\n".join(out))
    print(d,n,dict(sorted(cnt.items())))
