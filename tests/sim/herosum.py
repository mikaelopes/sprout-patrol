import json,collections,sys
f=sys.argv[1]; d=collections.defaultdict(list)
for l in open(f): r=json.loads(l); d[r['h']].append(r)
allw=[r['won'] for v in d.values() for r in v]; m=sum(allw)/len(allw)
for h,v in d.items():
    w=sum(r['won'] for r in v)/len(v); hard=[r for r in v if r['gid'].endswith('-6')]; boss=[r for r in v if r['gid'].endswith('-8')]; nor=[r for r in v if r['gid'].endswith('-5')]
    print(f"{h:6} n={len(v)} win={w*100:5.1f} Δmean={100*(w-m):+5.1f}  normal={100*sum(r['won'] for r in nor)/len(nor):4.0f} hard={100*sum(r['won'] for r in hard)/len(hard):4.0f} boss={100*sum(r['won'] for r in boss)/len(boss):4.0f} hits={sum(r['hits'] for r in v)/len(v):.2f} pops={sum(r['pops'] for r in v)/len(v):.1f} t={sum(r['t'] for r in v)/len(v):.0f}")
