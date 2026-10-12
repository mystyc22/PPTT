import type { APIRoute } from "astro";
import { Resend } from "resend";

export const prerender = false;

const audiences = new Set(["Investor", "Shop", "Rider", "Partner"]);
const maxLength = {
  email: 160,
  message: 1400,
  name: 120,
  type: 120,
};

interface LeadPayload {
  audience?: string;
  email?: string;
  message?: string;
  name?: string;
  page?: string;
  submittedAt?: string;
  subject?: string;
  type?: string;
  website?: string;
}

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
    status: init.status || 200,
  });

const clean = (value: unknown, limit: number) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);

const cleanMessage = (value: unknown, limit: number) =>
  String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .slice(0, limit);

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char] || char;
  });

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const parsePayload = async (request: Request): Promise<LeadPayload> => {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as LeadPayload;
  }

  const form = await request.formData();
  return Object.fromEntries(form.entries()) as LeadPayload;
};

export const POST: APIRoute = async ({ request }) => {
  let payload: LeadPayload;

  try {
    payload = await parsePayload(request);
  } catch {
    return json({ error: "Invalid lead request." }, { status: 400 });
  }

  if (clean(payload.website, 200)) {
    return json({ ok: true });
  }

  const audience = clean(payload.audience, 40);
  const email = clean(payload.email, maxLength.email).toLowerCase();
  const message = cleanMessage(payload.message, maxLength.message);
  const name = clean(payload.name, maxLength.name);
  const page = clean(payload.page, 260);
  const submittedAt = clean(payload.submittedAt, 80) || new Date().toISOString();
  const type = clean(payload.type, maxLength.type);

  if (!audiences.has(audience)) {
    return json({ error: "Choose a valid lead lane." }, { status: 400 });
  }

  if (name.length < 2) {
    return json({ error: "Add your name before sending." }, { status: 400 });
  }

  if (!isEmail(email)) {
    return json({ error: "Add a valid email address." }, { status: 400 });
  }

  if (!type) {
    return json({ error: "Choose a lead type before sending." }, { status: 400 });
  }

  const apiKey = import.meta.env.RESEND_API_KEY as string | undefined;
  const fromEmail = (import.meta.env.RESEND_FROM_EMAIL as string | undefined) || "PPTT Network <onboarding@resend.dev>";
  const toEmail = (import.meta.env.LEADS_TO_EMAIL as string | undefined) || "pptt_vercel@outlook.com";
  const subject = `[PPTT] ${audience} inquiry: ${name}`;

  if (apiKey) {
    const resend = new Resend(apiKey);
    const text = [
      `New PPTT Inquiry`,
      ``,
      `Audience: ${audience}`,
      `Type: ${type}`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Submitted: ${submittedAt}`,
      page ? `Page: ${page}` : "",
      ``,
      `Message:`,
      message || "No message provided.",
    ]
      .filter(Boolean)
      .join("\n");

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.5;color:#101417">
        <p style="margin:0 0 16px;color:#fe7f2d;font-size:12px;font-weight:800;text-transform:uppercase">New PPTT Inquiry</p>
        <h1 style="margin:0 0 20px;font-size:28px;line-height:1.05">${escapeHtml(audience)} inquiry from ${escapeHtml(name)}</h1>
        <table style="width:100%;border-collapse:collapse;margin:0 0 22px">
          <tbody>
            <tr><td style="padding:8px 0;color:#657782">Audience</td><td style="padding:8px 0;font-weight:700">${escapeHtml(audience)}</td></tr>
            <tr><td style="padding:8px 0;color:#657782">Type</td><td style="padding:8px 0;font-weight:700">${escapeHtml(type)}</td></tr>
            <tr><td style="padding:8px 0;color:#657782">Name</td><td style="padding:8px 0;font-weight:700">${escapeHtml(name)}</td></tr>
            <tr><td style="padding:8px 0;color:#657782">Email</td><td style="padding:8px 0;font-weight:700">${escapeHtml(email)}</td></tr>
            <tr><td style="padding:8px 0;color:#657782">Submitted</td><td style="padding:8px 0;font-weight:700">${escapeHtml(submittedAt)}</td></tr>
            ${
              page
                ? `<tr><td style="padding:8px 0;color:#657782">Page</td><td style="padding:8px 0;font-weight:700">${escapeHtml(page)}</td></tr>`
                : ""
            }
          </tbody>
        </table>
        <div style="padding:18px;border:1px solid #dde3e7;border-radius:14px;background:#f8fafb">
          ${escapeHtml(message || "No message provided.").replace(/\n/g, "<br />")}
        </div>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: fromEmail,
      html,
      replyTo: email,
      subject,
      text,
      to: toEmail.split(",").map((item) => item.trim()).filter(Boolean),
    });

    if (error) {
      return json({ error: error.message || "Could not send lead email." }, { status: 502 });
    }

    return json({ ok: true });
  }

  // Automatic fallback to FormSubmit without external accounts/domain
  try {
    const fsResponse = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(toEmail)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": page || "https://pptt-alpha.vercel.app/",
      },
      body: JSON.stringify({
        _subject: subject,
        _replyto: email,
        _captcha: "false",
        Audience: audience,
        Type: type,
        Name: name,
        Email: email,
        SubmittedAt: submittedAt,
        Page: page || "",
        Message: message || "No message provided.",
      }),
    });

    const rawText = await fsResponse.text();
    let fsData: { success?: string | boolean; message?: string } | null = null;
    try {
      fsData = JSON.parse(rawText) as { success?: string | boolean; message?: string };
    } catch {
      fsData = null;
    }

    if (fsData && (fsData.success === "true" || fsData.success === true)) {
      return json({ ok: true });
    }

    if (fsData && typeof fsData.message === "string" && fsData.message.includes("Activation")) {
      return json({
        ok: true,
        message: "Activation email sent to administrator. Form will receive leads once confirmed.",
      });
    }

    if (fsData?.message) {
      return json({ error: fsData.message }, { status: 502 });
    }

    return json({ error: "Backend relay blocked by provider. Falling back to direct browser channel." }, { status: 502 });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Service error";
    return json({ error: `Could not send inquiry: ${errMsg}` }, { status: 502 });
  }
};
