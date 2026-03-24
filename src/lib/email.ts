import { Resend } from "resend";
import type { Briefing } from "./types";

const resendKey = process.env.RESEND_API_KEY;
const toEmail = process.env.BRIEFING_TO_EMAIL;
const fromEmail = process.env.BRIEFING_FROM_EMAIL;

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderHtml(briefing: Briefing): string {
  const storiesHtml = briefing.top_stories
    .map(
      (story) => `
      <div style="padding:14px 0;border-top:1px solid #e5dfd4;">
        <div style="font-size:12px;color:#7a746a;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px;">
          #${story.rank} · ${story.tag}
        </div>
        <div style="font-size:20px;line-height:1.35;color:#1a1a1a;font-weight:600;margin-bottom:8px;">
          ${escapeHtml(story.headline)}
        </div>
        <p style="margin:0 0 10px;color:#2a2925;line-height:1.65;font-size:15px;">${escapeHtml(
          story.summary
        )}</p>
        <a href="${story.source_url}" style="color:#355f7a;text-decoration:none;font-size:14px;">${
        story.source_name
      }</a>
      </div>
    `
    )
    .join("");

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f8f5ef;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
    <div style="max-width:680px;margin:0 auto;padding:28px 20px 42px;">
      <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#7b766d;">AI Daily Briefing</div>
      <h1 style="margin:8px 0 8px;font-size:44px;line-height:1.1;">${briefing.date}</h1>
      <p style="margin:0 0 24px;color:#6f695f;font-size:13px;">Generated at ${new Date(
        briefing.created_at
      ).toLocaleString("en-SG", { timeZone: "Asia/Singapore" })}</p>
      ${storiesHtml}
      <div style="padding:18px 0;border-top:1px solid #e5dfd4;">
        <h2 style="font-size:24px;margin:0 0 8px;">Corporate vs Ground-Level View</h2>
        <p style="margin:0;color:#2a2925;line-height:1.7;font-size:15px;">${escapeHtml(
          briefing.analysis
        )}</p>
      </div>
      <div style="margin-top:18px;background:#f0e7d7;border:1px solid #ddcfb5;padding:16px;">
        <h2 style="font-size:22px;margin:0 0 8px;">Personal Implications</h2>
        <p style="margin:0;color:#2a2925;line-height:1.7;font-size:15px;">${escapeHtml(
          briefing.personal_implications
        )}</p>
      </div>
    </div>
  </body>
</html>`;
}

export async function sendBriefingEmail(briefing: Briefing): Promise<void> {
  if (!resendKey || !toEmail || !fromEmail) {
    return;
  }

  const resend = new Resend(resendKey);
  await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    subject: `AI Daily Briefing — ${briefing.date}`,
    html: renderHtml(briefing),
  });
}
