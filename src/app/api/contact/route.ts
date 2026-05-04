import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    const { name, email, company, message } = (await request.json()) as {
        name: string;
        email: string;
        company?: string;
        message: string;
    };

    if (!name || !email || !message) {
        return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
    }

    const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: process.env.CONTACT_TO_EMAIL!,
        replyTo: email,
        subject: `Contact form: ${name}${company ? ` (${company})` : ""}`,
        text: `From: ${name} <${email}>${company ? `\nCompany: ${company}` : ""}\n\n${message}`,
    });

    if (error) {
        return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
