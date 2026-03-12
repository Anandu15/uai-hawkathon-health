import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.3,
      max_tokens: 500,
    });

    return Response.json(completion);
  } catch (e) {
    console.error("Symptom AI error:", e);
    return Response.json({ error: "AI failed" }, { status: 500 });
  }
}