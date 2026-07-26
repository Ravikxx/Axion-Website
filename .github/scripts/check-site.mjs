import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

const root = process.cwd()
const pages = fs.readdirSync(root).filter(name => name.endsWith('.html')).sort()
const errors = []
let localReferences = 0
let scriptsChecked = 0
const accountMobilePages = new Set(['keys.html', 'settings.html', 'usage.html'])

function fail(file, message) {
  errors.push(`${file}: ${message}`)
}

function displayPath(file) {
  return path.relative(root, file).replaceAll('\\', '/')
}

function resolveLocalReference(page, rawReference) {
  const reference = rawReference.trim().replaceAll('&amp;', '&')
  if (
    !reference ||
    reference.startsWith('#') ||
    reference.startsWith('//') ||
    reference.includes('$') ||
    /^(?:https?:|mailto:|tel:|data:|blob:|javascript:)/i.test(reference)
  ) {
    return null
  }

  const pathname = reference.split(/[?#]/, 1)[0]
  if (!pathname) return null

  let decoded
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    fail(page, `invalid URL encoding in "${rawReference}"`)
    return null
  }

  const relative = decoded.startsWith('/') ? decoded.slice(1) : decoded
  const base = decoded.startsWith('/') ? root : path.dirname(path.join(root, page))
  const candidate = path.resolve(base, relative || 'index.html')
  const rootPrefix = `${root}${path.sep}`
  if (candidate !== root && !candidate.startsWith(rootPrefix)) {
    fail(page, `reference escapes the site root: "${rawReference}"`)
    return null
  }

  const possibilities = [candidate]
  if (!path.extname(candidate)) {
    possibilities.push(`${candidate}.html`, path.join(candidate, 'index.html'))
  }
  return { rawReference, possibilities }
}

function checkReference(page, rawReference) {
  const resolved = resolveLocalReference(page, rawReference)
  if (!resolved) return
  localReferences++
  if (!resolved.possibilities.some(file => fs.existsSync(file))) {
    fail(page, `missing local target "${rawReference}"`)
  }
}

function checkJavaScript(source, filename) {
  try {
    new vm.Script(source, { filename })
    scriptsChecked++
  } catch (error) {
    fail(filename, `JavaScript syntax error: ${error.message}`)
  }
}

for (const page of pages) {
  const source = fs.readFileSync(path.join(root, page), 'utf8')
  if (/^google-site-verification:/i.test(source.replace(/^\uFEFF/, '').trim())) continue
  if (source.includes('github.com/AxionLabsAI/axion')) {
    fail(page, 'uses the retired AxionLabsAI/axion repository URL')
  }
  if (accountMobilePages.has(page) && !source.includes('/assets/account-mobile-nav.js')) {
    fail(page, 'account page is missing the shared mobile navigation')
  }
  if (source.includes('/auth/register')) {
    if (!source.includes('challenges.cloudflare.com/turnstile')) {
      fail(page, 'registration form is missing Cloudflare Turnstile')
    }
    if (/turnstile\s*:\s*(['"])\s*\1/.test(source)) {
      fail(page, 'registration form submits an empty Turnstile token')
    }
  }
  if (page === 'docs.html' && /\bIndexedDB\b/i.test(source)) {
    fail(page, 'describes chat history as IndexedDB-backed instead of account-synced')
  }
  if ((page === 'privacy.html') && /\banonymous usage\b/i.test(source)) {
    fail(page, 'describes current hosted access as anonymous')
  }
  if (page === 'announcements.html' && source.includes('/assets/theme-light.css')) {
    fail(page, 'public announcements page must use the adaptive theme')
  }
  if (page === 'settings.html' && source.includes('Permanently deletes your account, API keys, and usage history')) {
    fail(page, 'account deletion copy omits the safety-record retention exception')
  }
  if (/<div\b[^>]*\bonclick\s*=/i.test(source)) {
    fail(page, 'clickable div found; use a keyboard-accessible button or link')
  }

  if (!/<meta\b[^>]*\bname=["']referrer["'][^>]*>/i.test(source)) {
    fail(page, 'missing <meta name="referrer">')
  }

  for (const tag of source.matchAll(/<(?:a|area|audio|form|iframe|img|input|link|object|script|source|video)\b[^>]*>/gi)) {
    for (const match of tag[0].matchAll(/\b(?:href|src|action)\s*=\s*(["'])(.*?)\1/gi)) {
      checkReference(page, match[2])
    }
    for (const match of tag[0].matchAll(/\b(?:href|src|action)\s*=\s*(["'])http:\/\/.*?\1/gi)) {
      fail(page, `mixed-content URL "${match[0]}"`)
    }
  }

  for (const match of source.matchAll(/<(?:a|area)\b([^>]*)>/gi)) {
    const attributes = match[1]
    if (/\bonclick\s*=/i.test(attributes) && !/\bhref\s*=/i.test(attributes)) {
      fail(page, 'clickable anchor is missing href; use a button for actions')
    }
    if (/\btarget\s*=\s*(["'])_blank\1/i.test(attributes)) {
      const rel = attributes.match(/\brel\s*=\s*(["'])(.*?)\1/i)?.[2] || ''
      if (!/\bnoopener\b/i.test(rel)) fail(page, 'target="_blank" link is missing rel="noopener"')
    }
  }

  for (const match of source.matchAll(/\bfetch\s*\(/g)) {
    const nearby = source.slice(match.index, match.index + 800)
    if (!/\bsignal\s*:/.test(nearby)) {
      fail(page, 'direct fetch call is missing an AbortController signal or shared timeout wrapper')
    }
  }

  let inlineIndex = 0
  for (const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attributes = match[1]
    const body = match[2]
    if (/\bsrc\s*=/i.test(attributes)) continue
    inlineIndex++
    const type = attributes.match(/\btype\s*=\s*(["'])(.*?)\1/i)?.[2]?.toLowerCase()
    if (type === 'application/ld+json' || type === 'application/json') {
      try {
        JSON.parse(body)
      } catch (error) {
        fail(page, `invalid inline JSON block ${inlineIndex}: ${error.message}`)
      }
      continue
    }
    if (type && !['text/javascript', 'application/javascript'].includes(type)) continue
    checkJavaScript(body, `${page}:inline-${inlineIndex}`)
  }

  for (const style of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    for (const match of style[1].matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)) {
      checkReference(page, match[2])
    }
  }
}

for (const filename of fs.readdirSync(root).filter(name => name.endsWith('.md'))) {
  const source = fs.readFileSync(path.join(root, filename), 'utf8')
  if (source.includes('github.com/AxionLabsAI/axion')) {
    fail(filename, 'uses the retired AxionLabsAI/axion repository URL')
  }
  if (filename === 'privacy.md' && /\banonymous usage\b/i.test(source)) {
    fail(filename, 'describes current hosted access as anonymous')
  }
}

for (const filename of fs.readdirSync(path.join(root, 'assets'), { recursive: true })) {
  const fullPath = path.join(root, 'assets', filename)
  if (!fs.statSync(fullPath).isFile()) continue
  if (filename.endsWith('.js')) checkJavaScript(fs.readFileSync(fullPath, 'utf8'), displayPath(fullPath))
  if (filename.endsWith('.js')) {
    const source = fs.readFileSync(fullPath, 'utf8')
    for (const match of source.matchAll(/\bfetch\s*\(/g)) {
      const nearby = source.slice(match.index, match.index + 800)
      if (!/\bsignal\s*:/.test(nearby)) {
        fail(displayPath(fullPath), 'direct fetch call is missing an AbortController signal or shared timeout wrapper')
      }
    }
  }
  if (filename.endsWith('.css')) {
    const source = fs.readFileSync(fullPath, 'utf8')
    for (const match of source.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)) {
      checkReference(displayPath(fullPath), match[2])
    }
  }
}

for (const filename of ['theme-adaptive.css', 'theme-dark.css', 'theme-light.css']) {
  const source = fs.readFileSync(path.join(root, 'assets', filename), 'utf8')
  if (!source.includes('--font-body:') || !source.includes('Newsreader')) {
    fail(`assets/${filename}`, 'shared theme is missing the serif body-font token')
  }
  if (!/body\s*\{\s*font-family:\s*var\(--font-body\)\s*!important;?\s*\}/.test(source)) {
    fail(`assets/${filename}`, 'shared theme does not apply the body-font token')
  }
}

for (const filename of fs.readdirSync(root).filter(name => name.endsWith('.json'))) {
  try {
    JSON.parse(fs.readFileSync(path.join(root, filename), 'utf8'))
  } catch (error) {
    fail(filename, `invalid JSON: ${error.message}`)
  }
}

if (errors.length) {
  console.error(`Site validation failed with ${errors.length} error(s):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(
  `Validated ${pages.length} HTML pages, ${localReferences} local references, and ${scriptsChecked} JavaScript blocks/files.`
)
