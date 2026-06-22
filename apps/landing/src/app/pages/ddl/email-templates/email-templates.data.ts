/**
 * Email template variant data — staged for visual review before committing
 * a redesign of the real templates in
 * `apps/api/src/modules/email-template/infrastructure/templates/`.
 *
 * Each variant returns a full HTML document so the DDL page can drop it into
 * an `<iframe srcdoc>` — that's the closest in-app simulation of an email
 * client: isolated CSS, no inheritance from the host page, inline-styles
 * only (or scoped `<style>` inside the document head), table-based layout
 * for Gmail/Outlook compatibility.
 *
 * The sample data here mirrors what the BE handler passes to
 * `EmailTemplateRepository.getTemplate(...)` at submit time.
 *
 * Design direction (locked 2026-05-19): friendly-transactional, in the spirit
 * of Railway's changelog emails — white background, wordmark on top, one bold
 * heading, prose body with a tight list, accent CTA button, signature line,
 * thin footer divider with the legal one-liner. Goal is "alive without trying
 * too hard" — not corporate, not stiff, but recognizably this brand.
 */

import type { DdlVariant } from '../ddl.types';

// Decision record — this page is still EXPLORING: V0 in each row is the current
// production baseline (reference, not a candidate), V1 / V2 are the two
// directions on the board per email type. No `selected`; each carries its
// trade-off as a `note`, so the widget tags them all "Candidate".
export const EMAIL_TEMPLATES_VARIANTS: readonly DdlVariant[] = [
  {
    id: 'auto-v1',
    label: 'Auto-reply V1 — Friendly transactional',
    note: 'Railway-style: wordmark, bold heading, summary as a tight list, accent CTA. Reads as a real product touchpoint — but the CTA can feel cold for a simple hello.',
  },
  {
    id: 'auto-v2',
    label: 'Auto-reply V2 — Warm letter',
    note: 'Serif heading, single-column letter rhythm, the message echoed back as a quote, "Until soon" signoff. Warmer and more personal — but no CTA, so it nudges toward nothing.',
  },
  {
    id: 'admin-v1',
    label: 'Admin V1 — Friendly triage',
    note: 'Same scaffold as auto-reply V1: eyebrow + heading, metadata row, quoted body, "View in Console" button. Scans at a glance — but heavier chrome than a raw inbox row.',
  },
  {
    id: 'admin-v2',
    label: 'Admin V2 — Inbox-ready compact',
    note: 'Lowest chrome, mimics a native Gmail/Apple Mail row: subject as heading, unboxed body, right-aligned Reply + View. Minimal weight — but less on-brand, closer to a plain forward.',
  },
];

export interface EmailSampleData {
  readonly name: string;
  readonly email: string;
  readonly purpose: string;
  readonly subject: string;
  readonly message: string;
  readonly locale: 'en' | 'vi';
  readonly consoleUrl: string;
  readonly messageId: string;
}

export const SAMPLE_AUTO_REPLY: EmailSampleData = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  purpose: 'Hire me',
  subject: '[Hire me] John Doe',
  message:
    "Hi! Loved your portfolio — we're hiring a senior FE engineer at a small Series A startup in HCMC. Would love to chat about whether the role might be a fit. Available for a call any afternoon next week.",
  locale: 'en',
  consoleUrl: '/messages/01956e57-aa3b-7c10-b9d2-d1c2f0e8f311',
  messageId: '01956e57-aa3b-7c10-b9d2-d1c2f0e8f311',
};

export const SAMPLE_ADMIN: EmailSampleData = {
  ...SAMPLE_AUTO_REPLY,
};

export interface EmailVariant {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly render: (data: EmailSampleData) => string;
}

const PHUONG_SIG_EN = 'Phuong Tran';
const ACCENT = '#5b6cff';
const INK = '#1a1a1a';
const INK_SOFT = '#4a4a4a';
const INK_MUTE = '#8a8a8a';
const RULE = '#e5e5e5';

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'";

const SERIF_STACK = "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Georgia', serif";

function wrap(body: string, title: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;">
${body}
</body>
</html>`;
}

/**
 * Render the "Phương Tran" wordmark as an inline SVG so it survives email
 * clients that strip <img> tags or block remote images by default. Small dot
 * mimics a logo affordance.
 */
function wordmark(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
    <tr>
      <td style="vertical-align:middle;padding-right:10px;">
        <div style="width:24px;height:24px;border-radius:50%;background:${INK};display:inline-block;"></div>
      </td>
      <td style="vertical-align:middle;font-family:${FONT_STACK};font-size:17px;font-weight:600;color:${INK};letter-spacing:-0.01em;">
        Phương Tran
      </td>
    </tr>
  </table>`;
}

/* ─────────────────────────────────────────────────────────────────────────
 * AUTO-REPLY VARIANTS — sent to the submitter
 * ────────────────────────────────────────────────────────────────────── */

export const AUTO_REPLY_VARIANTS: readonly EmailVariant[] = [
  {
    id: 'v0',
    title: 'V0 · Current production',
    summary:
      'What the BE actually sends today: bare `font-family: sans-serif`, h2 + ul + p signoff. Baseline reference — looks like a 2008 transactional email.',
    render: (d) =>
      wrap(
        `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Thank you for your message, ${d.name}</h2>
  <p>I've received your message and will get back to you within 1–3 days.</p>
  <p><strong>Here's a summary of what you sent:</strong></p>
  <ul>
    <li><strong>Subject:</strong> ${d.subject}</li>
    <li><strong>Purpose:</strong> ${d.purpose}</li>
  </ul>
  <p>If you need to follow up sooner, feel free to reply to this email.</p>
  <p>Best regards,<br/>${PHUONG_SIG_EN}</p>
</div>`,
        'V0 baseline'
      ),
  },

  {
    id: 'v1',
    title: 'V1 · Friendly transactional · picked, shipped 2026-05-19',
    summary:
      'Railway-style. Wordmark centered on white, bold heading, conversational prose, summary as a tight bulleted list, solid accent CTA button (links back to the site), Regards line, thin footer divider with the legal one-liner. Reads as a real product touchpoint without trying too hard. **Graduated** — this is what production sends today (see `contact-auto-reply.template.ts`).',
    render: (d) =>
      wrap(
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;">
  <tr>
    <td align="center" style="padding:40px 16px 0 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;font-family:${FONT_STACK};color:${INK};">
        <tr>
          <td align="center" style="padding:0 0 36px 0;">
            ${wordmark()}
          </td>
        </tr>
        <tr>
          <td style="padding:0 8px;">
            <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.35;font-weight:700;letter-spacing:-0.015em;color:${INK};">Thanks for reaching out, ${d.name}!</h1>
            <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:${INK_SOFT};">Your message landed in my inbox. I'll come back to you within a few days — usually faster. Here's what you sent for your own thread:</p>
            <ul style="margin:0 0 20px 0;padding-left:22px;font-size:15px;line-height:1.8;color:${INK_SOFT};">
              <li><strong style="color:${INK};">Purpose:</strong> ${d.purpose}</li>
              <li><strong style="color:${INK};">Subject:</strong> ${d.subject}</li>
            </ul>
            <p style="margin:0 0 28px 0;font-size:15px;line-height:1.7;color:${INK_SOFT};">If something's time-sensitive, hit reply and add a one-liner — this address goes straight to me.</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:8px 8px 40px 8px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="border-radius:8px;background:${ACCENT};">
                  <a href="https://thunderphong.com" style="display:inline-block;padding:12px 22px;font-family:${FONT_STACK};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:-0.005em;">Visit thunderphong.com</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 8px 8px 8px;font-size:15px;line-height:1.7;color:${INK_SOFT};">
            <p style="margin:0;">Regards,</p>
            <p style="margin:0;color:${INK};font-weight:500;">${PHUONG_SIG_EN}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 8px 48px 8px;">
            <div style="border-top:1px solid ${RULE};padding-top:18px;font-size:12px;line-height:1.6;color:${INK_MUTE};">
              You're receiving this because you submitted a message via <a href="https://thunderphong.com/contact" style="color:${INK_MUTE};text-decoration:underline;">thunderphong.com/contact</a>. Your data is kept for 18 months per the <a href="https://thunderphong.com/privacy" style="color:${INK_MUTE};text-decoration:underline;">privacy policy</a>.
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`,
        'V1 friendly transactional'
      ),
  },

  {
    id: 'v2',
    title: 'V2 · Warm letter',
    summary:
      'Same white-clean baseline, but with a more personal voice — small wordmark top-left (not center), bold serif heading for warmth, single-column letter rhythm without bullets, quoted message echoes the original, signature reads as "Until soon, Phuong". For when "transactional CTA" feels too cold for a hello.',
    render: (d) =>
      wrap(
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;">
  <tr>
    <td align="center" style="padding:40px 16px 0 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;font-family:${FONT_STACK};color:${INK};">
        <tr>
          <td style="padding:0 0 36px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle;padding-right:8px;">
                  <div style="width:18px;height:18px;border-radius:50%;background:${INK};display:inline-block;"></div>
                </td>
                <td style="vertical-align:middle;font-family:${FONT_STACK};font-size:14px;font-weight:600;color:${INK};letter-spacing:-0.01em;">
                  Phương Tran
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 8px;">
            <h1 style="margin:0 0 20px 0;font-family:${SERIF_STACK};font-size:28px;line-height:1.3;font-weight:600;letter-spacing:-0.01em;color:${INK};">Hi ${d.name},</h1>
            <p style="margin:0 0 16px 0;font-size:16px;line-height:1.75;color:${INK_SOFT};">Thanks for writing. I've got your message and will reply within a few days. If it's time-sensitive, just reply to this email and add a one-liner — it'll bump you up.</p>
            <p style="margin:0 0 14px 0;font-size:16px;line-height:1.75;color:${INK_SOFT};">For your own thread, what you sent under <strong style="color:${INK};">${d.subject}</strong>:</p>
            <blockquote style="margin:0 0 24px 0;padding:14px 18px;background:#f7f7f8;border-left:3px solid ${ACCENT};border-radius:0 8px 8px 0;font-size:15px;line-height:1.7;color:${INK_SOFT};white-space:pre-wrap;">${d.message}</blockquote>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 8px 8px 8px;font-size:16px;line-height:1.75;color:${INK_SOFT};">
            <p style="margin:0;">Until soon,</p>
            <p style="margin:0;color:${INK};font-weight:500;">${PHUONG_SIG_EN}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 8px 48px 8px;">
            <div style="border-top:1px solid ${RULE};padding-top:18px;font-size:12px;line-height:1.6;color:${INK_MUTE};">
              You're receiving this because you submitted a message via <a href="https://thunderphong.com/contact" style="color:${INK_MUTE};text-decoration:underline;">thunderphong.com/contact</a>. Your data is kept for 18 months per the <a href="https://thunderphong.com/privacy" style="color:${INK_MUTE};text-decoration:underline;">privacy policy</a>.
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`,
        'V2 warm letter'
      ),
  },
];

/* ─────────────────────────────────────────────────────────────────────────
 * ADMIN NOTIFICATION VARIANTS — sent to me only, EN by design
 * ────────────────────────────────────────────────────────────────────── */

export const ADMIN_NOTIFICATION_VARIANTS: readonly EmailVariant[] = [
  {
    id: 'v0',
    title: 'V0 · Current production',
    summary:
      'Current BE output: 4-row bold-label table, h3 "Message" + grey card, plain link to console. Functional but visually noisy — bold labels compete with values.',
    render: (d) =>
      wrap(
        `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>New Contact Message</h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr><td style="padding:8px;font-weight:bold;vertical-align:top;">From:</td><td style="padding:8px;">${d.name} &lt;${d.email}&gt;</td></tr>
    <tr><td style="padding:8px;font-weight:bold;vertical-align:top;">Purpose:</td><td style="padding:8px;">${d.purpose}</td></tr>
    <tr><td style="padding:8px;font-weight:bold;vertical-align:top;">Subject:</td><td style="padding:8px;">${d.subject}</td></tr>
    <tr><td style="padding:8px;font-weight:bold;vertical-align:top;">Locale:</td><td style="padding:8px;">${d.locale}</td></tr>
  </table>
  <h3>Message</h3>
  <div style="padding:16px;background:#f5f5f5;border-radius:4px;white-space:pre-wrap;">${d.message}</div>
  <p style="margin-top:16px;"><a href="${d.consoleUrl}">View in Console</a></p>
</div>`,
        'V0 admin baseline'
      ),
  },

  {
    id: 'v1',
    title: 'V1 · Friendly triage · picked, shipped 2026-05-19',
    summary:
      'Same Railway-style scaffold as auto-reply V1, repurposed for triage: wordmark + bold heading "New message — [purpose]", quick metadata row, message body as quoted block, accent "View in Console" button, footer line. Reads at-a-glance in a busy inbox without feeling like a system alert. **Graduated** — this is what production sends today (see `admin-notification.template.ts`).',
    render: (d) =>
      wrap(
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;">
  <tr>
    <td align="center" style="padding:40px 16px 0 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;font-family:${FONT_STACK};color:${INK};">
        <tr>
          <td align="center" style="padding:0 0 36px 0;">
            ${wordmark()}
          </td>
        </tr>
        <tr>
          <td style="padding:0 8px;">
            <div style="font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${ACCENT};margin-bottom:10px;">New message · ${d.purpose}</div>
            <h1 style="margin:0 0 18px 0;font-size:22px;line-height:1.35;font-weight:700;letter-spacing:-0.015em;color:${INK};">${d.name} just wrote in.</h1>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px 0;font-size:14px;color:${INK_SOFT};">
              <tr>
                <td style="padding:4px 0;width:88px;color:${INK_MUTE};">From</td>
                <td style="padding:4px 0;"><a href="mailto:${d.email}" style="color:${ACCENT};text-decoration:none;">${d.email}</a></td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:${INK_MUTE};">Subject</td>
                <td style="padding:4px 0;color:${INK};">${d.subject}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:${INK_MUTE};">Locale</td>
                <td style="padding:4px 0;color:${INK};">${d.locale}</td>
              </tr>
            </table>
            <blockquote style="margin:0 0 28px 0;padding:14px 18px;background:#f7f7f8;border-left:3px solid ${ACCENT};border-radius:0 8px 8px 0;font-size:14px;line-height:1.7;color:${INK_SOFT};white-space:pre-wrap;">${d.message}</blockquote>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 8px 40px 8px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="border-radius:8px;background:${ACCENT};">
                  <a href="${d.consoleUrl}" style="display:inline-block;padding:12px 22px;font-family:${FONT_STACK};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:-0.005em;">View in Console</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 8px 48px 8px;">
            <div style="border-top:1px solid ${RULE};padding-top:18px;font-size:12px;line-height:1.6;color:${INK_MUTE};">
              Admin notification · message id <span style="font-family:ui-monospace,'SF Mono',Menlo,Consolas,monospace;">${d.messageId.slice(0, 8)}…</span>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`,
        'V1 friendly triage'
      ),
  },

  {
    id: 'v2',
    title: 'V2 · Inbox-ready compact',
    summary:
      'Lowest-chrome variant — mimics a native Gmail/Apple Mail row. From + email at top, subject as the heading, purpose/locale as a meta line, full body unboxed below, action row right-aligned with Reply + View. Best if the admin inbox is busy and you want minimal weight.',
    render: (d) =>
      wrap(
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;font-family:${FONT_STACK};color:${INK};">
        <tr>
          <td style="padding:0 8px;">
            <div style="font-size:13px;color:${INK_SOFT};margin-bottom:4px;">
              <span style="font-weight:600;color:${INK};">${d.name}</span>
              &nbsp;·&nbsp;<a href="mailto:${d.email}" style="color:${ACCENT};text-decoration:none;">${d.email}</a>
            </div>
            <h1 style="margin:0;font-size:18px;line-height:1.4;font-weight:700;color:${INK};letter-spacing:-0.01em;">${d.subject}</h1>
            <div style="margin-top:6px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${ACCENT};">${d.purpose} · ${d.locale}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 8px 0 8px;">
            <div style="font-size:15px;line-height:1.7;color:${INK_SOFT};white-space:pre-wrap;">${d.message}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 8px 0 8px;">
            <div style="border-top:1px solid ${RULE};padding-top:14px;text-align:right;">
              <a href="mailto:${d.email}?subject=Re:%20${encodeURIComponent(d.subject)}" style="display:inline-block;margin-right:10px;padding:8px 14px;color:${INK_SOFT};text-decoration:none;font-size:13px;font-weight:500;border-radius:6px;">Reply</a>
              <a href="${d.consoleUrl}" style="display:inline-block;padding:8px 16px;background:${ACCENT};color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;border-radius:6px;">View →</a>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`,
        'V2 inbox-ready compact'
      ),
  },
];
