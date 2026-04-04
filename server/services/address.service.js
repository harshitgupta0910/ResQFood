const GEMINI_MODEL = 'gemini-1.5-flash';

const normalizeAddressWithGemini = async (rawAddress) => {
  const address = String(rawAddress || '').trim();
  if (!address) return '';

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return address;

  try {
    const prompt = `Normalize this Indian address for Google Maps search. Return ONLY valid JSON with one key: normalizedAddress. Address: "${address}"`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            response_mime_type: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      return address;
    }

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return address;
    }

    const normalizedAddress = String(parsed?.normalizedAddress || '').trim();
    return normalizedAddress || address;
  } catch {
    return address;
  }
};

module.exports = { normalizeAddressWithGemini };
