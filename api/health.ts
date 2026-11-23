import {
  applyCors,
  type HttpReqLike,
  type HttpResLike,
} from "./_lib/geminiStudio.ts";

export default function handler(req: HttpReqLike, res: HttpResLike) {
  if (applyCors(req, res)) return;
  res.status(200).json({ ok: true });
}
