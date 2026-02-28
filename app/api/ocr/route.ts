import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize Groq (Automatically uses process.env.GROQ_API_KEY)
const groq = new Groq();

export async function POST(request: Request) {
  try {
    const fileBlob = await request.blob();
    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Convert to Base64 for the Vision AI
    const base64Image = buffer.toString('base64');
    const mimeType = fileBlob.type || 'image/jpeg';

    // Call Groq's lightning-fast open-source vision model
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            { 
              type: 'text', 
              text: 'Extract all the handwritten text from this image exactly as it is written. Only return the extracted text, no other comments or markdown.' 
            },
            { 
              type: 'image_url', 
              image_url: { url: `data:${mimeType};base64,${base64Image}` } 
            }
          ]
        }
      ],
      // UPGRADED to Meta's brand new Llama 4 Scout Vision Model
      model: 'meta-llama/llama-4-scout-17b-16e-instruct', 
    });

    const extractedText = chatCompletion.choices[0]?.message?.content || "Could not extract text.";
    
    return NextResponse.json({ generated_text: extractedText });

  } catch (error: any) {
    console.error("Groq Backend Error:", error);
    return NextResponse.json({ error: "Failed to communicate with AI backend." }, { status: 500 });
  }
}