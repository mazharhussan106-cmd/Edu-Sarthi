"""Set/replace one field of one card across a deck's part files: setf(deck, id, field, value) or substring replace via sub(deck,id,field,old,new)."""
import os,re
def parts(d): return [os.path.join(d,f) for f in sorted(os.listdir(d)) if re.fullmatch(r"[a-z]+\d+\.txt",f)]
def _edit(d,cid,field,fn):
    for p in parts(d):
        L=open(p,encoding="utf-8").read().split("\n"); cur=None; hit=False
        for i,l in enumerate(L):
            if l.startswith("@"): cur=l[1:].strip()
            elif cur==cid and l.startswith(field+":"):
                v=l[len(field)+1:].strip(); L[i]=f"{field}: {fn(v)}"; hit=True
        if hit: open(p,"w",encoding="utf-8").write("\n".join(L)); return
    raise SystemExit(f"NOT FOUND {d} {cid} {field}")
def setf(d,cid,field,val): _edit(d,cid,field,lambda v:val)
def sub(d,cid,field,old,new):
    def f(v):
        if old not in v: raise SystemExit(f"OLD NOT IN {d} {cid} {field}: {old}")
        return v.replace(old,new)
    _edit(d,cid,field,f)
def app(d,cid,field,text): _edit(d,cid,field,lambda v:(v+" "+text) if text not in v else v)
