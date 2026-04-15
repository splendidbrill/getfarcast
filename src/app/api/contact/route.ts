import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

type ContactPayload = {
  name?: string;
  email?: string;
  company?: string;
  message?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContactPayload;
    const name = body.name?.trim();
    const email = body.email?.trim();
    const company = body.company?.trim();
    const message = body.message?.trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    const contactToEmail = process.env.CONTACT_TO_EMAIL?.trim();
    const resendFromEmail =
      process.env.RESEND_FROM_EMAIL?.trim() ||
      (process.env.NODE_ENV === "development" ? "onboarding@resend.dev" : undefined);

    if (!resendApiKey || resendApiKey === "re_placeholder") {
      return NextResponse.json(
        { error: "Resend is not configured yet. Add your RESEND_API_KEY to .env.local." },
        { status: 500 }
      );
    }

    if (!contactToEmail) {
      return NextResponse.json(
        {
          error:
            "Email recipient is not configured. Add CONTACT_TO_EMAIL in your environment variables.",
        },
        { status: 500 }
      );
    }

    if (!resendFromEmail) {
      return NextResponse.json(
        {
          error:
            "Sender email is not configured. Add RESEND_FROM_EMAIL with a verified sender/domain in your environment variables.",
        },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);

    const { data, error } = await resend.emails.send({
      from: resendFromEmail,
      to: [contactToEmail],
      replyTo: email,
      subject: `New Farcast contact request from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Company: ${company || "Not provided"}`,
        "",
        "Message:",
        message,
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="margin-bottom: 16px;">New Farcast contact request</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Company:</strong> ${escapeHtml(company || "Not provided")}</p>
          <p><strong>Message:</strong></p>
          <div style="padding: 16px; background: #f9fafb; border-radius: 12px; white-space: pre-wrap;">${escapeHtml(message)}</div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend email send failed", {
        error,
        from: resendFromEmail,
        to: contactToEmail,
      });

      return NextResponse.json(
        {
          error:
            error.message ||
            "Resend could not deliver the message. Verify CONTACT_TO_EMAIL, RESEND_FROM_EMAIL, and your Resend domain/sender configuration.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, id: data?.id ?? null });
  } catch (error) {
    console.error("Contact form submission failed", error);
    return NextResponse.json(
      { error: "Something went wrong while sending your message. Please try again." },
      { status: 500 }
    );
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}