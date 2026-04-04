const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateAudioBuffer = async (text) => {
  const apiKey = (process.env.ELEVENLABS_API_KEY || '').trim();
  const voiceId = (process.env.ELEVENLABS_VOICE_ID || '').trim();

  if (!apiKey || !voiceId) {
    return null;
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

  const payload = {
    text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
    },
  };

  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`ElevenLabs request failed: ${response.status} ${body}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        await sleep(350);
      }
    }
  }

  throw lastError;
};

module.exports = { generateAudioBuffer };
