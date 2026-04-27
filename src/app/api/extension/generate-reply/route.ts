import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

import {
    getAuthenticatedExtensionUser,
    getExtensionCorsHeaders,
} from '@/lib/extension/server';

export const dynamic = 'force-dynamic';

// Azure AI Foundry exposes an OpenAI-compatible endpoint at {endpoint}/models.
// Uses the same AZURE_API_KEY + AZURE_ENDPOINT already in .env.local.
const GROK_MODEL = 'grok-4-1-fast-reasoning';

function buildGrokClient(): OpenAI {
    const base = (process.env.AZURE_ENDPOINT ?? '').replace(/\/+$/, '');
    const baseURL = base.endsWith('/models') ? base : `${base}/models`;
    return new OpenAI({
        apiKey: process.env.AZURE_API_KEY ?? '',
        baseURL,
        defaultQuery: { 'api-version': '2024-05-01-preview' },
        defaultHeaders: { 'api-key': process.env.AZURE_API_KEY ?? '' },
    });
}

const grok = buildGrokClient();

const cors = getExtensionCorsHeaders();

type RequestBody = {
    platform: string;
    postText: string;
    authorName?: string;
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(request: NextRequest) {
    const { user, error } = await getAuthenticatedExtensionUser(request);

    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    }

    const body: RequestBody | null = await request.json().catch(() => null);

    if (!body || !body.platform || !body.postText?.trim()) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400, headers: cors });
    }

    const platformLabel =
        body.platform === 'twitter' ? 'X (Twitter)' :
        body.platform === 'linkedin' ? 'LinkedIn' :
        body.platform === 'reddit' ? 'Reddit' :
        body.platform;

    const systemPrompt =
        `You are an authentic startup founder replying to a post on ${platformLabel}. ` +
        `Keep it under 2 sentences, add value or a subtle compliment, and do not use hashtags or sound like a bot.`;

    const userPrompt = body.authorName
        ? `Here is a post by ${body.authorName}:\n\n${body.postText}`
        : `Here is the post:\n\n${body.postText}`;

    try {
        const completion = await grok.chat.completions.create({
            model: GROK_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            max_tokens: 150,
            temperature: 0.8,
        });

        const reply = completion.choices[0]?.message?.content?.trim() ?? '';

        return NextResponse.json({ reply }, { headers: cors });
    } catch (err) {
        console.error('[extension/generate-reply] Grok API error', err);
        return NextResponse.json({ error: 'AI generation failed' }, { status: 502, headers: cors });
    }
}
