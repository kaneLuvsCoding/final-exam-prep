const DEFAULT_MODEL = "gemini-3-flash-preview";

const tryParseJson = (value) => {
  if (typeof value !== "string") return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const getKeyCandidates = () => {
  const primaryKey =
    process.env.GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY_PRIMARY ||
    process.env.VITE_GEMINI_API_KEY;

  const backupKey =
    process.env.GEMINI_API_KEY_BACKUP ||
    process.env.GEMINI_API_KEY_2 ||
    process.env.GEMINI_API_KEY2 ||
    process.env.VITE_GEMINI_API_KEY_2 ||
    process.env.VITE_GEMINI_API_KEY2;

  return [...new Set([primaryKey, backupKey].filter(Boolean))];
};

const shouldRetryWithNextKey = (statusCode, errorPayload, rawText) => {
  const status = String(errorPayload?.status || "").toUpperCase();
  const message = String(errorPayload?.message || rawText || "");

  if ([401, 403, 429, 500, 503].includes(Number(statusCode))) return true;

  if (
    status === "PERMISSION_DENIED" ||
    status === "UNAUTHENTICATED" ||
    status === "RESOURCE_EXHAUSTED" ||
    status === "UNAVAILABLE"
  ) {
    return true;
  }

  return /(rate.?limit|quota|resource has been exhausted|too many requests|unauthenticated|permission denied|api key|high demand|temporarily unavailable)/i.test(
    message
  );
};

const parseBody = (req) => {
  if (!req?.body) return {};

  if (typeof req.body === "string") {
    const parsed = tryParseJson(req.body);
    return parsed && typeof parsed === "object" ? parsed : {};
  }

  if (typeof req.body === "object") {
    return req.body;
  }

  return {};
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: {
        code: 405,
        status: "METHOD_NOT_ALLOWED",
        message: "Use POST /api/gemini"
      }
    });
  }

  const body = parseBody(req);
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const model = typeof body.model === "string" && body.model.trim() ? body.model.trim() : DEFAULT_MODEL;

  if (!prompt) {
    return res.status(400).json({
      error: {
        code: 400,
        status: "INVALID_ARGUMENT",
        message: "Missing prompt"
      }
    });
  }

  const keys = getKeyCandidates();

  if (keys.length === 0) {
    return res.status(500).json({
      error: {
        code: 500,
        status: "INTERNAL",
        message: "Missing GEMINI_API_KEY (and optional GEMINI_API_KEY_BACKUP) in environment variables."
      }
    });
  }

  const requestPayload = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ]
  };

  let lastFailure = null;

  for (let index = 0; index < keys.length; index += 1) {
    const apiKey = keys[index];
    const hasAnotherKey = index < keys.length - 1;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

    try {
      const upstreamResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestPayload)
      });

      const rawText = await upstreamResponse.text();
      const parsedJson = tryParseJson(rawText);

      if (upstreamResponse.ok) {
        res.setHeader("Cache-Control", "no-store");
        return res.status(200).json(parsedJson || { text: rawText });
      }

      const errorPayload = parsedJson?.error || parsedJson || {
        code: upstreamResponse.status,
        status: "UPSTREAM_ERROR",
        message: rawText || "Gemini request failed"
      };

      lastFailure = {
        statusCode: upstreamResponse.status,
        payload: errorPayload,
        rawText
      };

      if (hasAnotherKey && shouldRetryWithNextKey(upstreamResponse.status, errorPayload, rawText)) {
        continue;
      }

      res.setHeader("Cache-Control", "no-store");
      return res.status(upstreamResponse.status).json({ error: errorPayload });
    } catch (error) {
      lastFailure = {
        statusCode: 500,
        payload: {
          code: 500,
          status: "INTERNAL",
          message: error instanceof Error ? error.message : "Failed to contact Gemini"
        },
        rawText: String(error || "")
      };

      if (!hasAnotherKey) {
        break;
      }
    }
  }

  const statusCode = Number(lastFailure?.statusCode) || 500;
  const payload =
    lastFailure?.payload || {
      code: statusCode,
      status: "INTERNAL",
      message: "Failed to get a response from Gemini"
    };

  res.setHeader("Cache-Control", "no-store");
  return res.status(statusCode).json({ error: payload });
}
