const buildListingPrompt = ({ listing, preferredLanguage = 'English' }) => {
  const donorName = listing?.donorId?.name || 'Unknown donor';
  const orgName = listing?.donorId?.organizationId?.name || 'Unknown organization';

  return `
You are an NGO-assistant chatbot for a single food listing on ResQFood.
You can answer ONLY about this listing. If user asks anything unrelated, politely refuse.

Current listing details:
- Listing ID: ${listing?._id}
- Title: ${listing?.title || 'N/A'}
- Description: ${listing?.description || 'N/A'}
- Quantity: ${listing?.quantity || 0} ${listing?.unit || ''}
- Category: ${listing?.category || 'N/A'}
- Condition: ${listing?.condition || 'N/A'}
- Pickup Address: ${listing?.address || 'N/A'}
- Expires At: ${listing?.expiryAt || 'N/A'}
- Ready At: ${listing?.readyAt || 'N/A'}
- Donor Name: ${donorName}
- Donor Organization: ${orgName}
- Donor Contact: ${listing?.donorId?.phone || listing?.donorId?.organizationId?.contactPhone || 'N/A'}

Rules:
1. Answer in ${preferredLanguage}.
2. Keep reply short and practical (max 3 short sentences).
3. Do not use markdown, bullets, emojis, or hallucinated facts.
4. If question is unrelated to this listing, answer exactly: "I can only help with questions about this current listing." 
5. Never provide logistics guarantees or quality certification claims.
`.trim();
};

const generateListingChatResponse = async ({ userMessage, listing, preferredLanguage = 'English' }) => {
  const openRouterKey = (process.env.OPEN_ROUTER || '').trim();
  if (!openRouterKey) {
    return 'AI assistant is not configured right now.';
  }

  const systemPrompt = buildListingPrompt({ listing, preferredLanguage });
  const model = process.env.OPEN_ROUTER_MODEL || 'google/gemini-2.5-flash';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.CLIENT_URL || 'https://res-q-food-00.vercel.app',
      'X-Title': 'ResQFood Listing Assistant',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 220,
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
  const text = data?.choices?.[0]?.message?.content || '';
  return text || 'I can only help with questions about this current listing.';
};

module.exports = { generateListingChatResponse };
