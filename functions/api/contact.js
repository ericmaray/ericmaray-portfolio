// Cloudflare Pages Function — POST /api/contact
// All private values are supplied via Cloudflare environment secrets.
const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};
function respond(status, message) {
  return new Response(JSON.stringify({ ok: status >= 200 && status < 300, message }), {
    status, headers: JSON_HEADERS,
  });
}
function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max + 1) : '';
}
export async function onRequestPost({ request, env }) {
  if (!env.TURNSTILE_SECRET_KEY || !env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
    console.error('Contact configuration missing (check Cloudflare Variables and Secrets).');
    return respond(503, 'Contact form is temporarily unavailable. Please try again later.');
  }

  const origin = request.headers.get('Origin');
  // Reject requests explicitly coming from another site; do not enable CORS.
  if (origin && origin !== new URL(request.url).origin) {
    return respond(403, 'Submission origin not allowed.');
  }
  const type = request.headers.get('Content-Type') || '';
  if (!type.toLowerCase().includes('application/json')) {
    return respond(415, 'Unsupported submission format.');
  }
  if (Number(request.headers.get('Content-Length') || '0') > 12000) {
    return respond(413, 'Message too large.');
  }
  let input;
  try {
    const raw = await request.text();
    if (raw.length > 12000) return respond(413, 'Message too large.');
    input = JSON.parse(raw);
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid JSON');
  } catch {
    return respond(400, 'Please check the form and try again.');
  }

  // Honeypot: real visitors never fill this field.
  if (input.company_website) return respond(200, 'Thank you for your message.');

  const name = clean(input.name, 100);
  const email = clean(input.email, 254);
  const subject = clean(input.subject, 110);
  const message = clean(input.message, 4000);
  const token = clean(input.turnstileToken, 2048);
  if (!name || name.length > 100 || !email || email.length > 254 ||
      !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ||
      !subject || subject.length > 110 || !message || message.length > 4000 ||
      message.length < 10 || !token || token.length > 2048) {
    return respond(400, 'Please complete all fields and the security check.');
  }

  let verification;
  try {
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: request.headers.get('CF-Connecting-IP') || undefined,
      }),
    });
    if (!verify.ok) throw new Error('Verification service failed');
    verification = await verify.json();
  } catch {
    return respond(503, 'Security verification is temporarily unavailable. Please try again.');
  }

  const permittedHosts = (env.TURNSTILE_ALLOWED_HOSTNAMES || 'ericmaray.com,www.ericmaray.com,ericmaray-portfolio.pages.dev')
    .split(',').map((host) => host.trim().toLowerCase()).filter(Boolean);
  if (!verification.success ||
      !permittedHosts.includes(String(verification.hostname || '').toLowerCase()) ||
      verification.action !== 'portfolio_contact') {
    return respond(403, 'Security check expired or was unsuccessful. Please retry.');
  }

  // Strip control characters from headers. Never reflect visitor content in HTML.
  const safeName = name.replace(/[\r\n\x00-\x1f]/g, ' ');
  const safeSubject = subject.replace(/[\r\n\x00-\x1f]/g, ' ');
  const payload = {
    from: env.CONTACT_FROM_EMAIL,
    to: [env.CONTACT_TO_EMAIL],
    reply_to: email,
    subject: `[Portfolio] ${safeSubject}`,
    text: `New portfolio inquiry\n\nName: ${safeName}\nEmail: ${email}\nTopic: ${safeSubject}\n\nMessage:\n${message}\n`,
  };

  try {
    const sent = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!sent.ok) {
      // Don't log messages or secrets; log just the provider status.
      console.error('Email delivery provider returned:', sent.status);
      return respond(502, 'Message could not be delivered right now. Please try again later.');
    }
  } catch {
    return respond(502, 'Message could not be delivered right now. Please try again later.');
  }
  return respond(200, 'Message sent. Thanks for reaching out!');
}

export function onRequestGet() {
  return respond(405, 'Method not allowed.');
}
