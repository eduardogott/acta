// Cloudflare Pages Function — HTTP Basic Auth gate for the whole site.
// Runs on every request before any static asset is served.
//
// Set these in the Pages project dashboard:
//   Settings → Environment variables → add BASIC_AUTH_USER and BASIC_AUTH_PASS
// (mark BASIC_AUTH_PASS as "encrypted"). No values are hardcoded here.

function unauthorized() {
  return new Response("Autenticação necessária.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Acta", charset="UTF-8"',
    },
  });
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function onRequest(context) {
  const { request, env, next } = context;

  const expectedUser = env.BASIC_AUTH_USER;
  const expectedPass = env.BASIC_AUTH_PASS;

  if (!expectedUser || !expectedPass) {
    // Vars not configured — fail closed rather than serving the site unprotected.
    return unauthorized();
  }

  const authHeader = request.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Basic ")) {
    return unauthorized();
  }

  let user = "";
  let pass = "";
  try {
    const decoded = atob(authHeader.slice(6));
    const idx = decoded.indexOf(":");
    user = decoded.slice(0, idx);
    pass = decoded.slice(idx + 1);
  } catch {
    return unauthorized();
  }

  const ok =
    timingSafeEqual(user, expectedUser) && timingSafeEqual(pass, expectedPass);

  if (!ok) {
    return unauthorized();
  }

  const response = await next();

  // _headers não é aplicado a respostas que passam por uma Function do
  // Pages (mesmo via next()) — ver https://developers.cloudflare.com/pages/configuration/headers/.
  // Como este middleware roda em toda rota, precisamos setar aqui o
  // COOP/COEP que o _headers configurava para /conversor.html (necessário
  // para o ffmpeg.wasm multi-thread via SharedArrayBuffer).
  // O Pages serve conversor.html em mais de um caminho (/conversor.html,
  // /conversor e com barra no fim), então normalizamos antes de comparar —
  // uma igualdade exata com "/conversor.html" deixava a rota /conversor sem
  // os cabeçalhos, e o ffmpeg multi-thread não carregava.
  const url = new URL(request.url);
  const rota = url.pathname.replace(/\/+$/, "").replace(/\.html$/, "");
  if (rota === "/conversor") {
    const headers = new Headers(response.headers);
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    headers.set("Cross-Origin-Embedder-Policy", "require-corp");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
}
