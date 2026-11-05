import json,collections,sys
rows=[json.loads(l) for l in open(sys.argv[1])]
agg=collections.defaultdict(list)
for r in rows: agg[(r['tier'],r['L'],r['gid'])].append(r)
key=lambda k:(k[0],k[1],[int(x) for x in k[2].split('-')])
for k in sorted(agg,key=key):
    v=agg[k]; w=sum(1 for r in v if r.get('won')); print(k, f"win {w}/{len(v)}", 't', round(sum(r.get('t',0) for r in v)/len(v)), 'hits', round(sum(r.get('hits',0) for r in v)/len(v),1), 'TO', sum(1 for r in v if r.get('timeout')))
