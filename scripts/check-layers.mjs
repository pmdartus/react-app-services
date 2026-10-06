// Enforces the dependency rule between service scopes (see README, "Where things live"):
// - nothing under src/services imports React or TanStack;
// - a scope uses its own scope and outer ones (session → app → global → shared);
// - only an owner may reach one scope inward, to create the child scope it owns.
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const ROOT = 'src/services'
const SCOPES = ['shared', 'global', 'app', 'session'] // outermost first
const OWNERS = {
  'app/sessionHost.ts': 'session', // opens and closes the session
}

const files = readdirSync(ROOT, { recursive: true }).filter((file) => file.endsWith('.ts'))
const errors = []

for (const file of files) {
  const scope = file.split('/')[0]
  const source = readFileSync(join(ROOT, file), 'utf8')
  for (const [, spec] of source.matchAll(/(?:from|import) '([^']+)'/g)) {
    if (/^(react|react-dom|@tanstack\/)/.test(spec)) errors.push(`${file} imports ${spec}`)
    if (!spec.startsWith('.')) continue
    const target = relative(ROOT, resolve(ROOT, dirname(file), spec)).split('/')[0]
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
