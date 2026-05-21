/**
 * Shared design tokens + structural helpers for the contact-flow email
 * templates. The V1 "friendly transactional" direction (locked 2026-05-19,
 * see `/ddl/email-templates`) is the baseline both auto-reply and admin
 * notification render from — same wordmark, same accent, same outer shell.
 *
 * Email clients are CSS hell, so:
 * - Inline styles only. No external stylesheets, no `<style>` blocks for
 *   anything that needs to survive Outlook / Gmail.
 * - Table-based layout for the outer shell so Outlook on Windows doesn't
 *   collapse it. Inner content can use `<div>` once the table holds the shape.
 * - Web fonts are declared but fall back to the system stack — most clients
 *   strip the web-font load, the system stack is what 80% of recipients see.
 */

import { sanitizeUrl } from './html-escape.util';

export const EMAIL_TOKENS = {
  accent: '#5b6cff',
  ink: '#1a1a1a',
  inkSoft: '#4a4a4a',
  inkMute: '#8a8a8a',
  rule: '#e5e5e5',
  surface: '#ffffff',
  blockBg: '#f7f7f8',
  fontStack:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'",
} as const;

const T = EMAIL_TOKENS;

/**
 * Inline-SVG-free wordmark (round dot + name). Renders consistently across
 * clients that strip remote images by default — no <img> tag involved.
 */
export function wordmark(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
  <tr>
    <td style="vertical-align:middle;padding-right:10px;">
      <div style="width:24px;height:24px;border-radius:50%;background:${T.ink};display:inline-block;"></div>
    </td>
    <td style="vertical-align:middle;font-family:${T.fontStack};font-size:17px;font-weight:600;color:${T.ink};letter-spacing:-0.01em;">
      Phương Tran
    </td>
  </tr>
</table>`;
}

/**
 * Wrap a body string in the standard `<!doctype html>` shell. Outer table is
 * the centered max-560px column on a white page — every variant lives inside
 * this same envelope.
 */
export function wrapEmail(innerRows: string, options?: { footerHtml?: string }): string {
  const footer = options?.footerHtml ?? defaultFooter();
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:${T.surface};">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${T.surface};">
  <tr>
    <td align="center" style="padding:40px 16px 0 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;font-family:${T.fontStack};color:${T.ink};">
        <tr>
          <td align="center" style="padding:0 0 36px 0;">
            ${wordmark()}
          </td>
        </tr>
        ${innerRows}
        <tr>
          <td style="padding:32px 8px 48px 8px;">
            <div style="border-top:1px solid ${T.rule};padding-top:18px;font-size:12px;line-height:1.6;color:${T.inkMute};">
              ${footer}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function defaultFooter(): string {
  return `You're receiving this because you submitted a message via <a href="https://thunderphong.com/contact" style="color:${T.inkMute};text-decoration:underline;">thunderphong.com/contact</a>. Your data is kept for 18 months per the <a href="https://thunderphong.com/privacy" style="color:${T.inkMute};text-decoration:underline;">privacy policy</a>.`;
}

/** Localized footer for the auto-reply (VI variant). */
export function defaultFooterVi(): string {
  return `Bạn nhận email này vì đã gửi tin nhắn qua <a href="https://thunderphong.com/contact" style="color:${T.inkMute};text-decoration:underline;">thunderphong.com/contact</a>. Dữ liệu được lưu trong 18 tháng theo <a href="https://thunderphong.com/privacy" style="color:${T.inkMute};text-decoration:underline;">chính sách bảo mật</a>.`;
}

/**
 * Render the standard solid-accent CTA button (rounded pill, 12×22 padding,
 * white text). Outlook on Windows ignores border-radius — the pill silently
 * degrades to a rectangle there, which is acceptable.
 *
 * `href` is run through `sanitizeUrl` defensively so callers can pass values
 * sourced (now or later) from user input without opening a `javascript:` URL
 * vector. Current callers pass hardcoded URLs, but the contract should be
 * safe by default.
 */
export function ctaButton(href: string, label: string): string {
  const safeHref = sanitizeUrl(href);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="border-radius:8px;background:${T.accent};">
      <a href="${safeHref}" style="display:inline-block;padding:12px 22px;font-family:${T.fontStack};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:-0.005em;">${label}</a>
    </td>
  </tr>
</table>`;
}
