import json,collections,sys,statistics as st
rows=[json.loads(l) for l in open(sys.argv[1]) if l.strip()]
A=collections.defaultdict(list)
for r in rows:
    if 'error' in r: continue
    A[(r['tier'],r['L'],r['gid'])].append(r)
def win(t,L,g): v=A.get((t,L,g),[]); return (sum(r['won'] for r in v)/len(v)) if v else None
def dur(t,L,g): v=[r['t'] for r in A.get((t,L,g),[]) if r['won']]; return st.mean(v)/60 if v else None
def typ(g):
    G,i=map(int,g.split('-')); return 'boss' if i==5 else 'hard' if (G>=3 and i==4) else 'normal'
def goalL(G): return min(5,(G)//2)   # Nest goal level (speed rec = floor(G/2))
TGT={'normal':{(1,3):(.9,.9),(4,8):(.65,.65),(9,12):(.55,.55)},'hard':(.25,.40),'boss':(.35,.50)}
DUR={'normal':(1.5,2.5),'hard':(1.0,1.5),'boss':(2.5,3.5)}
def tgt(g):
    G,i=map(int,g.split('-')); t=typ(g)
    if t=='normal':
        for (a,b),v in TGT['normal'].items():
            if a<=G<=b: return v
    return TGT[t]
out=[]
for G in range(1,13):
    for i in range(1,6):
        g=f'{G}-{i}'; L=goalL(G); lo,hi=tgt(g)
        w=win('casual',L,g); d=dur('casual',L,g); wb=win('casual',max(0,L-1),g); ws=win('skilled',L,g); wn=win('novice',L,g)
        out.append(dict(g=g,type=typ(g),L=L,target=f'{int(lo*100)}–{int(hi*100)}%' if lo!=hi else f'{int(lo*100)}%',casual=w,casualBelow=wb,novice=wn,skilled=ws,minutes=d,durTarget=DUR[typ(g)],
            winOK=None if w is None else (lo-0.1<=w<=hi+0.1), durOK=None if d is None else (DUR[typ(g)][0]*0.9<=d<=DUR[typ(g)][1]*1.1)))
json.dump(out,open(sys.argv[1].replace('.jsonl','_summary.json'),'w'),indent=1)
fmt=lambda x:'  - ' if x is None else f'{x*100:4.0f}%'
print('garden type  L target   casual  (L-1)  novice skilled  min   ok')
for o in out: print(f"{o['g']:5} {o['type']:6} {o['L']} {o['target']:8} {fmt(o['casual'])} {fmt(o['casualBelow'])} {fmt(o['novice'])} {fmt(o['skilled'])} {('%.1f'%o['minutes']) if o['minutes'] else ' - '}  {'W' if o['winOK'] else 'w'}{'D' if o['durOK'] else 'd'}")
ok=[o for o in out if o['winOK'] is not None]; print('win within ±10pt:',sum(o['winOK'] for o in ok),'/',len(ok),' duration ok:',sum(1 for o in out if o['durOK']),'/',len(out))
# skill vs Nest split: average over gardens of |Δwin| skilled-vs-novice at goal L, vs |Δwin| L=goal vs L=0 for casual
ds=[];dn=[]
for o in out:
    G=int(o['g'].split('-')[0]); L=goalL(G)
    a=win('skilled',L,o['g']); b=win('novice',L,o['g']); c=win('casual',L,o['g']); d0=win('casual',0,o['g'])
    if None not in (a,b,c,d0): ds.append(a-b); dn.append(c-d0)
if ds: s=st.mean(ds); n=st.mean(dn); print(f'skill effect {s*100:.0f}pt · Nest effect {n*100:.0f}pt · skill share {s/(s+n)*100 if s+n>0 else 0:.0f}%')
