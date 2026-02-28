import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq();

// --- 1. RATE LIMITING SETUP (In-Memory for MVP) ---
// Note: In production, this would be an Upstash Redis database.
const rateLimitMap = new Map<string, { count: number, lastReset: number }>();
const LIMIT = 5; // Max 5 requests
const WINDOW_MS = 60000; // Per 1 minute

export async function POST(request: Request) {
  try {
    // --- 2. EXECUTE RATE LIMIT CHECK ---
    const ip = request.headers.get('x-forwarded-for') || 'anonymous_ip';
    const now = Date.now();
    const userLimit = rateLimitMap.get(ip);

    if (userLimit) {
      if (now - userLimit.lastReset < WINDOW_MS) {
        if (userLimit.count >= LIMIT) {
          return NextResponse.json(
            { error: "Rate limit exceeded. Please wait 60 seconds to prevent API abuse." },
            { status: 429 }
          );
        }
        userLimit.count++;
      } else {
        rateLimitMap.set(ip, { count: 1, lastReset: now }); // Reset after 1 min
      }
    } else {
      rateLimitMap.set(ip, { count: 1, lastReset: now });
    }

    // --- 3. PROCESS IMAGE ---
    const fileBlob = await request.blob();
    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const base64Image = buffer.toString('base64');
    const mimeType = fileBlob.type || 'image/jpeg';

    // --- 4. HARDENED AI PROMPT ---
    const systemPrompt = `You are a strict OCR machine. Extract the handwritten text from this image exactly as it is written. 
    Only return the extracted text, no other comments or markdown. 
    If there is absolutely no text in the image, you must return exactly this string: NO_TEXT_FOUND`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: systemPrompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
          ]
        }
      ],
      model: 'meta-llama/llama-4-scout-17b-16e-instruct', 
    });

    const extractedText = chatCompletion.choices[0]?.message?.content?.trim() || "Could not extract text.";
    
    // --- 5. CATCH HALLUCINATIONS ---
    if (extractedText === "NO_TEXT_FOUND") {
      return NextResponse.json({ generated_text: "No handwritten text was detected in this image." });
    }
    
    return NextResponse.json({ generated_text: extractedText });

  } catch (error: any) {
    console.error("Groq Backend Error:", error);
    return NextResponse.json({ error: "Failed to communicate with AI backend." }, { status: 500 });
  }
}