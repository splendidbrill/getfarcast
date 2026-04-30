import { NextRequest, NextResponse } from 'next/server';

import {
    getAuthenticatedExtensionUser,
    getExtensionCorsHeaders,
} from '@/lib/extension/server';
import { getLLMClient, getModelId } from '@/lib/llm';
import { checkAndIncrementUsage } from '@/lib/usage';

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

    const usageCheck = await checkAndIncrementUsage(user.id, "replies", 1);
    if (!usageCheck.allowed) {
        return NextResponse.json({ error: usageCheck.error }, { status: 403, headers: cors });
    }

    const platformLabel =
        body.platform === 'twitter' ? 'X (Twitter)' :
        body.platform === 'linkedin' ? 'LinkedIn' :
        body.platform === 'reddit' ? 'Reddit' :
        body.platform;

    // const systemPrompt =
    //     `You are an authentic startup founder replying to a post on ${platformLabel}. ` +
    //     `Keep it under 2 sentences, add value or a subtle compliment, and do not use hashtags or sound like a bot.`;

    // const userPrompt = body.authorName
    //     ? `Here is a post by ${body.authorName}:\n\n${body.postText}`
    //     : `Here is the post:\n\n${body.postText}`;

    const systemPrompt = `You are a busy startup founder casually scrolling ${platformLabel}. 
Your goal is to write a 1-2 line reply that is so insightful, relatable, or uniquely angled that people read it, like it, and want to follow you. 

CRITICAL "ANTI-AI SLOP" RULES - DO NOT VIOLATE:
1. NO generic praise: NEVER start with "Great post!", "I completely agree", "Spot on", "Thanks for sharing", or "This is so true."
2. NO restating: Do not summarize what they just said. If they say "marketing is hard", do not reply "marketing is indeed a challenge."
3. NO transition words: Never use "Moreover", "Furthermore", "Additionally", "Importantly."
4. NO corporate therapist voice: Never use "powerful opportunity," "delve," "unpack," or "navigate the complexities."
5. NO neat little bows: Do not end with a cliché like "At the end of the day, it's about execution."
6. NO hashtags, NO emojis, and NO exclamation marks. 
7. NEVER pitch a product or mention what you are building. This is purely for organic audience building.

HOW TO ADD UNIQUE VALUE (Choose the best approach based on the post):
- The Relatable Truth: Say the thing every person in the replies is privately thinking but nobody typed. Focus on the actual, unglamorous reality of the topic.
- The Contrarian Pivot: Politely offer a completely different angle or second-order consequence they didn't think of.
- The Dry Observation: State a deadpan, entirely serious observation about their post that highlights the absurdity of building startups. 

TONE:
Write in plain, conversational English. Use casual sentence case (it is okay to skip the final period). Keep it under 2 sentences. Sound like a real human firing off a quick, sharp text from their phone.`;

const userPrompt = `
Post Author: ${body.authorName || "A user"}
The Post: "${body.postText}"

Task: Read the post, pick the best strategy (Relatable, Contrarian, or Dry), and generate the 1-2 line reply. 
Output ONLY the final reply text. No quotes, no placeholders, no commentary.`;


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
