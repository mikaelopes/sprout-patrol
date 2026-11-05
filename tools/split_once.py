# One-time split of the single-file game into src/. Kept for the record; the build (tools/build.py) is the source of truth now.
import sys, os, json
src, out = sys.argv[1], sys.argv[2]
L = open(src).read().split('\n')
assert L[4] == '<style>' and L[637] == '</style>' and L[673] == '<script>' and L[-2] == '</script>', (L[4], L[637], L[673], L[-2:])
parts = [  # (first line no. 1-based, file)
 (675, 'core.js'), (732, 'i18n.js'), (910, 'content.js'), (1011, 'save.js'), (1239, 'state.js'), (1305, 'maze.js'),
 (1498, 'balance.js'), (1585, 'player.js'), (1697, 'combat.js'), (2002, 'skills-enemies.js'), (2553, 'fx.js'), (2584, 'audio.js'),
 (2725, 'render-world.js'), (2850, 'art.js'), (2851, 'render-actors.js'), (3386, 'render-frame.js'), (3576, 'hud-cards.js'),
 (3820, 'menu-core.js'), (3966, 'daily-road.js'), (4260, 'screens.js'), (4531, 'onboarding.js'), (4929, 'adventure.js'),
 (5313, 'runmap.js'), (5427, 'demo.js'), (5568, 'input.js'), (5655, 'loop.js')]
idx = [p[0] - 1 for p in parts]  # 0-based starts
# pull leading comment lines into the file they describe
for k in range(1, len(idx)):
    i = idx[k]
    while i - 1 > idx[k - 1] and L[i - 1].lstrip().startswith(('//', '/*', '*')) and not L[i - 1].rstrip().endswith(';'): i -= 1
    idx[k] = i
end = len(L) - 2  # index of </script>
os.makedirs(out + '/js', exist_ok=True); os.makedirs(out + '/css', exist_ok=True)
order = []
for k, (_, name) in enumerate(parts):
    a, b = idx[k], (idx[k + 1] if k + 1 < len(idx) else end)
    open(out + '/js/' + name, 'w').write('\n'.join(L[a:b]) + '\n'); order.append(name)
open(out + '/css/game.css', 'w').write('\n'.join(L[5:637]) + '\n')
head = '\n'.join(L[0:4]); body = '\n'.join(L[638:673]); pre = '\n'.join(L[674:idx[0]])
open(out + '/head.html', 'w').write(head + '\n'); open(out + '/body.html', 'w').write(body + '\n')
assert pre == '', repr(pre[:80])
json.dump({'scripts': order, 'tail': L[-1]}, open(out + '/build.json', 'w'), indent=1)
print(len(order), 'files')
