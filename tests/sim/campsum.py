import json,sys,statistics as st
for f in sys.argv[1:]:
    runs=json.load(open(f)); print('==',f,'runs',len(runs),'hours',[round(r['hours'],2) for r in runs],'endCoins',[r['endCoins'] for r in runs])
    for G in range(1,13):
        hg=[g for r in runs for g in r['gardens'] if g['g']==f'{G}-6']
        grove=[g for r in runs for g in r['gardens'] if g['g'].startswith(f'{G}-')]
        buys=[b for r in runs for b in (r['buys'] or []) if b['at']==G]
        print(f"G{G:2} tries/garden {st.mean(g['tries'] for g in grove):.2f}  levels behind goal at hard {st.mean(g['behind'] for g in hg):.1f}  coins at hard {st.mean(g['coins'] for g in hg):.0f}  upgrades bought in grove {len(buys)/len(runs):.1f}  min/garden {st.mean(g['minutes'] for g in grove):.1f}  gardens/upgrade {8/max(0.01,len(buys)/len(runs)):.1f}")
