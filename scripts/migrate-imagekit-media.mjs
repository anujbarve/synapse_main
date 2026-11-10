#!/usr/bin/env node
/*
 * Migrate legacy ImageKit media URLs to the Supabase Storage bucket `media`.
 *
 * Dry run (default, writes nothing):
 *   SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... node scripts/migrate-imagekit-media.mjs
 *
 * Apply (uploads objects to storage and updates rows):
 *   SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... node scripts/migrate-imagekit-media.mjs --apply
 *
 * Optional env: NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT. Its hostname is matched in addition to ik.imagekit.io.
 * Every processed row is appended to scripts/.migration-log.jsonl (original and new URL, status, error).
 *
 * Idempotency: rows already pointing at the Supabase `media` public prefix are skipped. Re-running only
 * touches rows that still hold an ImageKit URL, so previously failed rows are retried and successful
 * rows are never re-processed. Uploads use upsert, so a retry after a partial failure overwrites the object.
 * ImageKit data is never deleted.
 */
import { createClient } from '@supabase/supabase-js'
import { appendFile, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const LOG_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '.migration-log.jsonl')
const BUCKET = 'media'
const CONCURRENCY = 4
const MAX_RETRIES = 3
const PAGE_SIZE = 500
const APPLY = process.argv.includes('--apply')

// Media columns that can hold ImageKit URLs. posts.content only holds a URL for Image/Video posts.
const TARGETS = [
  { table: 'users', column: 'profile_picture' },
  { table: 'community', column: 'banner_picture' },
  { table: 'messages', column: 'file_url' },
  { table: 'resources', column: 'file_url' },
  { table: 'posts', column: 'content', filter: (q) => q.in('type', ['Image', 'Video']) },
]

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    console.error(`Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value
}

const SUPABASE_URL = requireEnv('NEXT_PUBLIC_SUPABASE_URL').replace(/\/+$/, '')
// The key is only passed to the client. It is never logged.
const SERVICE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

const IK_HOSTS = new Set(['ik.imagekit.io'])
if (process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT) {
  try {
    IK_HOSTS.add(new URL(process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT).hostname)
  } catch {
    console.warn('NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT is not a valid URL; ignoring it.')
  }
}

const PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

class MigrationError extends Error {
  constructor(message, { transient = false, status = null } = {}) {
    super(message)
    this.transient = transient
    this.status = status
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Retries transient failures up to MAX_RETRIES times with exponential backoff.
async function withRetry(fn) {
  let attempt = 0
  for (;;) {
    try {
      return await fn()
    } catch (err) {
      if (!(err instanceof MigrationError && err.transient) || attempt >= MAX_RETRIES) throw err
      attempt++
      await sleep(500 * 2 ** (attempt - 1))
    }
  }
}

function classify(value) {
  if (typeof value !== 'string' || value === '') return 'other'
  if (value.startsWith(PUBLIC_PREFIX)) return 'migrated'
  let url
  try {
    url = new URL(value)
  } catch {
    return 'other'
  }
  if ((url.protocol === 'https:' || url.protocol === 'http:') && IK_HOSTS.has(url.hostname)) return 'imagekit'
  return 'other'
}

function safeFileName(url) {
  const raw = url.pathname.split('/').filter(Boolean).pop() ?? ''
  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    // keep the raw segment
  }
  const cleaned = decoded
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120)
  return cleaned || 'file'
}

async function download(originalUrl) {
  return withRetry(async () => {
    let res
    try {
      res = await fetch(originalUrl, { redirect: 'follow' })
    } catch (err) {
      throw new MigrationError(`network error fetching source: ${err.cause?.code ?? err.message}`, { transient: true })
    }
    if (res.status === 429 || res.status >= 500) {
      throw new MigrationError(`source HTTP ${res.status}`, { transient: true, status: res.status })
    }
    // 401/403/404 are terminal: the row is recorded as failed and not retried.
    if (!res.ok) throw new MigrationError(`source HTTP ${res.status}`, { status: res.status })
    let bytes
    try {
      bytes = Buffer.from(await res.arrayBuffer())
    } catch (err) {
      throw new MigrationError(`network error reading source: ${err.message}`, { transient: true })
    }
    const contentType = res.headers.get('content-type')?.split(';')[0].trim() || 'application/octet-stream'
    return { bytes, contentType }
  })
}

async function upload(objectPath, bytes, contentType) {
  return withRetry(async () => {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, new Blob([bytes], { type: contentType }), { contentType, upsert: true })
    if (error) {
      const status = Number(error.statusCode) || null
      throw new MigrationError(`storage upload failed: ${error.message}`, {
        transient: !status || status >= 500 || status === 429,
        status,
      })
    }
  })
}

async function updateRow(target, row, originalUrl, newUrl) {
  return withRetry(async () => {
    // Conditional on the old value, so a row changed concurrently is not overwritten.
    const { error } = await supabase
      .from(target.table)
      .update({ [target.column]: newUrl })
      .eq('id', row.id)
      .eq(target.column, originalUrl)
    if (error) throw new MigrationError(`row update failed: ${error.message}`, { transient: !error.code })
  })
}

async function scan(target) {
  const rows = []
  let lastId = null
  for (;;) {
    let query = supabase
      .from(target.table)
      .select(`id, ${target.column}`)
      .not(target.column, 'is', null)
      .order('id', { ascending: true })
      .limit(PAGE_SIZE)
    if (target.filter) query = target.filter(query)
    if (lastId !== null) query = query.gt('id', lastId)
    const { data, error } = await query
    if (error) throw new Error(`reading ${target.table}.${target.column}: ${error.message}`)
    if (!data || data.length === 0) break
    for (const row of data) rows.push({ id: row.id, value: row[target.column] })
    lastId = data[data.length - 1].id
    if (data.length < PAGE_SIZE) break
  }
  return rows
}

function logKey(table, column, id) {
  return `${table}.${column}#${id}`
}

async function readLog() {
  const latest = new Map()
  let text
  try {
    text = await readFile(LOG_PATH, 'utf8')
  } catch (err) {
    if (err.code === 'ENOENT') return latest
    throw err
  }
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    try {
      const entry = JSON.parse(line)
      latest.set(logKey(entry.table, entry.column, entry.id), entry)
    } catch {
      // ignore malformed lines
    }
  }
  return latest
}

async function appendLog(entry) {
  await appendFile(LOG_PATH, `${JSON.stringify({ ts: new Date().toISOString(), ...entry })}\n`)
}

async function migrateRow(target, row) {
  const originalUrl = row.value
  const { bytes, contentType } = await download(originalUrl)
  const objectPath = `migrated/${target.table}/${row.id}/${safeFileName(new URL(originalUrl))}`
  await upload(objectPath, bytes, contentType)
  const newUrl = supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl
  await updateRow(target, row, originalUrl, newUrl)
  return newUrl
}

function printTable(headers, rows) {
  const all = [headers, ...rows.map((r) => r.map(String))]
  const widths = headers.map((_, i) => Math.max(...all.map((r) => r[i].length)))
  const fmt = (r) => r.map((c, i) => String(c).padEnd(widths[i])).join('  ')
  console.log(fmt(headers))
  console.log(widths.map((w) => '-'.repeat(w)).join('  '))
  for (const r of rows) console.log(fmt(r))
}

async function runPool(items, limit, worker) {
  let next = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++]
      await worker(item)
    }
  })
  await Promise.all(runners)
}

async function main() {
  console.log(APPLY ? 'Mode: APPLY (writes enabled)' : 'Mode: DRY RUN (no writes). Pass --apply to migrate.')
  console.log(`Supabase project URL: ${SUPABASE_URL}`)
  console.log(`ImageKit hosts matched: ${[...IK_HOSTS].join(', ')}`)

  const priorLog = await readLog()
  const stats = []
  const pending = []

  for (const target of TARGETS) {
    const rows = await scan(target)
    const stat = { target, label: `${target.table}.${target.column}`, total: rows.length, found: 0, migrated: 0, other: 0, previouslyFailed: 0, done: 0, failed: 0 }
    for (const row of rows) {
      const kind = classify(row.value)
      if (kind === 'imagekit') {
        stat.found++
        pending.push({ target, row, stat })
        if (priorLog.get(logKey(target.table, target.column, row.id))?.status === 'failed') stat.previouslyFailed++
      } else if (kind === 'migrated') {
        stat.migrated++
      } else {
        stat.other++
      }
    }
    stats.push(stat)
  }

  const headers = ['Table.column', 'Total', 'Found (ImageKit)', 'Already migrated', 'Other', 'To migrate']
  if (APPLY) headers.push('Migrated', 'Failed')
  const tableRows = () =>
    stats.map((s) => {
      const base = [s.label, s.total, s.found, s.migrated, s.other, s.found]
      return APPLY ? [...base, s.done, s.failed] : base
    })

  console.log('')
  console.log('Summary before migration:')
  printTable(headers, tableRows())
  console.log('')
  console.log(`Rows previously failed (per log): ${stats.reduce((n, s) => n + s.previouslyFailed, 0)}`)

  if (!APPLY) {
    console.log('')
    console.log('Dry run complete. Nothing was written.')
    return
  }

  await runPool(pending, CONCURRENCY, async ({ target, row, stat }) => {
    const originalUrl = row.value
    try {
      const newUrl = await migrateRow(target, row)
      await appendLog({ status: 'ok', table: target.table, column: target.column, id: row.id, originalUrl, newUrl })
      stat.done++
    } catch (err) {
      stat.failed++
      await appendLog({
        status: 'failed',
        table: target.table,
        column: target.column,
        id: row.id,
        originalUrl,
        error: err.message,
        httpStatus: err.status ?? null,
      })
      console.warn(`FAILED ${target.table}.${target.column}#${row.id}: ${err.message}`)
    }
  })

  console.log('')
  console.log('Results:')
  printTable(headers, tableRows())
  console.log('')
  console.log(`Log: ${LOG_PATH}`)
  if (stats.some((s) => s.failed > 0)) process.exitCode = 1
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
