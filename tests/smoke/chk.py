import re,sys,subprocess
s=open(sys.argv[1]).read()
for k,m in enumerate(re.finditer(r'<script>(.*?)</script>',s,re.S)):
    off=s[:m.start(1)].count('\n')
    open('/tmp/_s.js','w').write('\n'*off+m.group(1))
    r=subprocess.run(['node','--check','/tmp/_s.js'],capture_output=True,text=True); print(k, r.stderr[:600] or 'ok')
