ts
import { NextRequest, NextResponse } from 'next/server'

// Runs on the server only, so the key never reaches the browser. Uses
// Google Gemini's free-tier Flash model — no card, no expiring trial,
// unlike a paid-only API. Response shape is unchanged so the rest of the
// app doesn't need to know which provider is behind this.

function buildPrompt(roomType: string) {
  return `You are a strict content filter for a house-rental listing app. The person was asked specifically to photograph their "${roomType}". Look at this image very carefully.

Approve it (is_house:true) ONLY if the clear main subject, filling most of the frame, is genuinely a ${roomType} — not just any room, but specifically a ${roomType}. Use these cues:
- "Sitting Room" / living room: sofas/seating arranged around a TV or coffee table, no bed, no stove/sink, no toilet.
- "Bedroom": a bed is the dominant object.
- "Kitchen": stove/cooker, sink, counters, cabinets — food prep area.
- "Washroom": toilet, shower, sink/basin — a bathroom.

Reject it (is_house:false) if:
- It shows a DIFFERENT room than the one requested (e.g. a bedroom photo submitted for "Kitchen") — say so specifically in the reason.
- It's not a room/house photo at all: selfies, people, portraits, screenshots, memes, documents/IDs, food, animals, cars, streets, landscapes, products, artwork, or anything blurry/unclear.

When in doubt, reject it. Respond with ONLY raw JSON, no markdown fences, no other text: {"is_house":true or false,"reason":"under 10 words, say what it actually shows and whether that matches ${roomType}"}`
}

export async function POST(req: NextRequest) {
  const { imageBase64, mediaType, roomType } = await req.json()

  if (!imageBase64 || !mediaType) {
    return NextResponse.json({ error: 'Missing image data' }, { status: 400 })
  }
  const expectedRoom = typeof roomType === 'string' && roomType ? roomType : 'room'

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      is_house: true,
      reason: '',
      unverified: true,
      warning: 'AI photo verification is not configured on this server yet (GEMINI_API_KEY missing). Photo accepted without a content check.'
    })
  }

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { inline_data: { mime_type: mediaType, data: imageBase64 } },
              { text: buildPrompt(expectedRoom) }
            ]
          }],
          generationConfig: { temperature: 0, maxOutputTokens: 200 }
        })
      }
    )

    const data = await r.json()

    if (!r.ok) {
      return NextResponse.json({
        is_house: true, reason: '', unverified: true,
        warning: 'AI verification request failed (' + (data?.error?.message || r.status) + '). Photo accepted without a content check.'
      })
    }

    const text = (data?.candidates?.[0]?.content?.parts || [])
      .map((p: any) => p.text || '')
      .join('')
      .trim()
      .replace(/^```json/i, '')
      .replace(/```$/, '')
      .trim()

    let parsed: any = null
    try { parsed = JSON.parse(text) } catch {}

    if (parsed && typeof parsed.is_house === 'boolean') {
      return NextResponse.json({ is_house: parsed.is_house, reason: parsed.reason || '', unverified: false })
    }
    return NextResponse.json({ is_house: true, reason: '', unverified: true, warning: "Couldn't parse a verdict — photo accepted without a content check." })
  } catch (e: any) {
    return NextResponse.json({
      is_house: true, reason: '', unverified: true,
      warning: 'AI verification request failed (' + (e?.message || 'network error') + '). Photo accepted without a content check.'
    })
  }
}

