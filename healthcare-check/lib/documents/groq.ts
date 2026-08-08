const GROQ_VISION_MODEL = "qwen/qwen3.6-27b";

/**
 * Transcribes the visible text of a single image (JPG/PNG) using Groq's
 * vision model. Used for image uploads and, later, for scanned PDF pages
 * once page-image rasterization exists — for now PDFs rely on their
 * embedded text layer only (see pdf.ts).
 */
export async function extractTextFromImage(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const base64 = buffer.toString("base64");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
      temperature: 0,
      // Plain transcription doesn't need chain-of-thought, and leaving
      // reasoning on leaks raw <think> tags into the stored page text.
      reasoning_effort: "none",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Transcribe all visible text in this image exactly as written, " +
                "preserving line breaks and table-like structure where possible. " +
                "Do not summarize, explain, or add commentary — output only the " +
                "transcribed text. If the image contains no legible text, output " +
                "exactly NO_TEXT_FOUND and nothing else — never invent or guess " +
                "text that is not actually visible in the image.",
            },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq vision request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}
