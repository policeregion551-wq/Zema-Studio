import {
  applyCors,
  handlePhotoToVideo,
  type HttpReqLike,
  type HttpResLike,
  parseApiError,
  parseBody,
} from "./_lib/geminiStudio.ts";

export default async function handler(req: HttpReqLike, res: HttpResLike) {
  if (applyCors(req, res)) return;
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }
  try {
    const result = await handlePhotoToVideo(parseBody(req));
    res.status(200).json(result);
  } catch (err) {
    const parsed = parseApiError(err);
    res.status(parsed.status).json({ error: parsed.message });
  }
}
