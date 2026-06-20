/**
 * Install script proxy with source-channel tracking.
 *
 * Cloudflare analytics records request count, status, geography, and URL
 * path/query. This worker does not store transcripts, source URLs, output
 * paths, asset filenames, local usernames, credentials, or stack traces.
 *
 * Routes:
 *   GET /install.sh      -> proxy install.sh from GitHub
 *   GET /ping?source=X   -> install-source beacon
 *   GET /                -> redirect to the repository
 */

const CACHE_TTL_SECONDS = 300
const VALID_SOURCES = new Set(['plugin', 'npx', 'install_sh', 'local'])

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/' || url.pathname === '') {
      return Response.redirect(env.REPOSITORY_URL, 302)
    }

    if (url.pathname === '/install.sh') {
      return handleInstallScript(request, env)
    }

    if (url.pathname === '/ping') {
      return handlePing(url)
    }

    return new Response('Not Found', {status: 404})
  },
}

export function handlePing(url) {
  const source = url.searchParams.get('source') ?? 'unknown'
  const version = url.searchParams.get('v') ?? 'unknown'

  if (!VALID_SOURCES.has(source)) {
    return new Response('ok', {status: 200})
  }

  return new Response('ok', {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
      'X-Install-Source': source,
      'X-Version': version,
    },
  })
}

async function handleInstallScript(request, env) {
  const cache = defaultCache()
  const cacheKey = new Request(request.url, request)
  const cached = await cache.match(cacheKey)
  if (cached) return cached

  const upstream = await fetch(`${env.GITHUB_RAW_BASE}/install.sh`, {
    headers: {'User-Agent': 'pain-point-mining-agent-install-worker'},
  })

  if (!upstream.ok) {
    return new Response('Failed to fetch install script', {status: 502})
  }

  const response = new Response(await upstream.text(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
      'X-Content-Type-Options': 'nosniff',
    },
  })

  await cache.put(cacheKey, response.clone())
  return response
}

function defaultCache() {
  return caches.default
}
