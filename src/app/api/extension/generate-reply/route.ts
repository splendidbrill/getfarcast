import { NextRequest, NextResponse } from 'next/server';

import {
    getAuthenticatedExtensionUser,
    getExtensionCorsHeaders,
} from '@/lib/extension/server';
import { getLLMClient, getModelId } from '@/lib/llm';

export const dynamic = 'force-dynamic';

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
        const completion = await getLLMClient().chat.completions.create({
            model: getModelId(),
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
