// Enforces the dependency rule between service scopes (see README, "Where things live"):
// - nothing under src/services imports React or TanStack;
// - a scope uses its own scope and outer ones (session → app → global → shared);
// - only an owner may reach one scope inward, to create the child scope it owns;
// - services receive the injected globals (notifier, errorReporter): outside global/, only their types are imported.
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const ROOT = 'src/services'
const SCOPES = ['shared', 'global', 'app', 'session'] // outermost first
const OWNERS = {
  'app/sessionHost.ts': 'session', // opens and closes the session
}
const INJECTED = ['global/notifier', 'global/errorReporter'] // `logger` stays a plain import

const files = readdirSync(ROOT, { recursive: true }).filter((file) => file.endsWith('.ts'))
const errors = []

for (const file of files) {
  const scope = file.split('/')[0]
  const source = readFileSync(join(ROOT, file), 'utf8')
  // Where each `import type … from '…'` names its module, multi-line ones included.
  const typeOnly = new Set([...source.matchAll(/import type [^;']*?from '/g)].map((m) => m.index + m[0].length - 6))
  for (const { 1: spec, index } of source.matchAll(/(?:from|import) '([^']+)'/g)) {
    if (/^(react|react-dom|@tanstack\/)/.test(spec)) errors.push(`${file} imports ${spec}`)
    if (!spec.startsWith('.')) continue
    const path = relative(ROOT, resolve(ROOT, dirname(file), spec))
    const target = path.split('/')[0]
    if (scope !== 'global' && INJECTED.includes(path) && !typeOnly.has(index)) {
      errors.push(`${file} imports ${spec}: services receive it injected, so import only its type`)
    }
    const step = SCOPES.indexOf(target) - SCOPES.indexOf(scope)
    if (step <= 0) continue
    if (step === 1 && OWNERS[file] === target) continue
    errors.push(`${file} (${scope}) imports ${spec} (${target}): inner scopes are only reachable by their owner`)
  }
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(`check:layers ✓ ${files.length} files`)
