const { GoogleGenerativeAI } = require('@google/generative-ai');

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
  if (!process.env.GEMINI_API_KEY) {
    return 'AI assistant is not configured right now.';
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: buildListingPrompt({ listing, preferredLanguage }),
  });

  const result = await model.generateContent(userMessage);
  const text = result?.response?.text?.() || '';
  return text || 'I can only help with questions about this current listing.';
};

module.exports = { generateListingChatResponse };
