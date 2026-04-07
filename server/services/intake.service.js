const toCategory = (raw = '') => {
  const value = String(raw || '').toLowerCase().trim();
  const allowed = [
    'cooked_meals',
    'raw_vegetables',
    'fruits',
    'dairy',
    'bakery',
    'canned_goods',
    'beverages',
    'grains',
    'mixed',
    'other',
  ];
  return allowed.includes(value) ? value : undefined;
};

const toUnit = (raw = '') => {
  const value = String(raw || '').toLowerCase().trim();
  const allowed = ['kg', 'lbs', 'servings', 'packets', 'boxes', 'items'];
  return allowed.includes(value) ? value : undefined;
};

const toCondition = (raw = '') => {
  const value = String(raw || '').toLowerCase().trim();
  const allowed = ['fresh', 'near_expiry', 'packaged'];
  return allowed.includes(value) ? value : undefined;
};

const parseJsonFromText = (text) => {
  const cleaned = String(text || '').trim();
  const direct = cleaned.startsWith('{') ? cleaned : null;
  if (direct) {
    try {
      return JSON.parse(direct);
    } catch {
      // Continue to fallback extraction.
    }
  }

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  return null;
};

const buildSystemPrompt = (currentData, preferredLanguage) => `
You are a voice intake assistant for donor food listing creation on ResQFood.
Your job is to extract listing fields from user messages and ask only missing details.
Respond strictly in JSON only with this schema:
{
  "aiReply": "short conversational next question or confirmation",
  "isComplete": boolean,
  "extractedData": {
    "title": string,
    "description": string,
    "quantity": number,
    "unit": "kg|lbs|servings|packets|boxes|items",
    "category": "cooked_meals|raw_vegetables|fruits|dairy|bakery|canned_goods|beverages|grains|mixed|other",
    "condition": "fresh|near_expiry|packaged",
    "address": string,
    "expiryHours": number
  }
}

Rules:
- Language for aiReply must be ${preferredLanguage}.
- Never use markdown.
- Keep aiReply short (1-2 lines).
- Merge with existing data, do not erase valid existing fields.
- isComplete=true only when title, quantity, unit, category, condition, address, expiryHours are all present and valid.
- quantity must be >= 1.
- expiryHours should be between 1 and 168.

Current extracted data:
${JSON.stringify(currentData || {}, null, 2)}
`.trim();

const extractDonationData = async ({ userMessage, currentData = {}, preferredLanguage = 'English' }) => {
  const openRouterKey = (process.env.OPEN_ROUTER || '').trim();
  if (!openRouterKey) {
    return {
      aiReply: 'AI intake is not configured right now.',
      isComplete: false,
      extractedData: currentData,
    };
  }

  const model = process.env.OPEN_ROUTER_MODEL || 'google/gemini-2.5-flash';
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.CLIENT_URL || 'https://res-q-food-00.vercel.app',
      'X-Title': 'ResQFood Donor Voice Intake',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: buildSystemPrompt(currentData, preferredLanguage) },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 280,
    }),
  });

  if (!response.ok) {
    let details = '';
    try {
      const body = await response.json();
      details = body?.error?.message || JSON.stringify(body);
    } catch {
      details = await response.text();
    }
    throw new Error(`OpenRouter request failed: ${response.status} ${details}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || '{}';
  const parsed = parseJsonFromText(content) || {};

  const incoming = parsed.extractedData || {};
  const merged = {
    ...currentData,
    ...(incoming.title ? { title: String(incoming.title).trim() } : {}),
    ...(incoming.description ? { description: String(incoming.description).trim() } : {}),
    ...(Number.isFinite(Number(incoming.quantity)) && Number(incoming.quantity) >= 1
      ? { quantity: Number(incoming.quantity) }
      : {}),
    ...(toUnit(incoming.unit) ? { unit: toUnit(incoming.unit) } : {}),
    ...(toCategory(incoming.category) ? { category: toCategory(incoming.category) } : {}),
    ...(toCondition(incoming.condition) ? { condition: toCondition(incoming.condition) } : {}),
    ...(incoming.address ? { address: String(incoming.address).trim() } : {}),
    ...(Number.isFinite(Number(incoming.expiryHours))
      ? { expiryHours: Math.max(1, Math.min(168, Number(incoming.expiryHours))) }
      : {}),
  };

  const required = ['title', 'quantity', 'unit', 'category', 'condition', 'address', 'expiryHours'];
  const isComplete = required.every((key) => merged[key] !== undefined && merged[key] !== null && merged[key] !== '');

  return {
    aiReply:
      String(parsed.aiReply || '').trim() ||
      (isComplete
        ? 'Great. I collected all listing details. Please review and submit.'
        : 'Please provide the missing listing details.'),
    isComplete,
    extractedData: merged,
  };
};

module.exports = { extractDonationData };
