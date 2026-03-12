import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File;

    if (!audio) {
      return Response.json({ error: "No audio file provided" }, { status: 400 });
    }

    const transcription = await groq.audio.transcriptions.create({
      file: audio,
      model: "whisper-large-v3-turbo", // free + fast
      response_format: "text",
    });

    return Response.json({ text: transcription });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Transcription failed" }, { status: 500 });
  }
}