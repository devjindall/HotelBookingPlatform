const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

/**
 * Local Rule-based Multilingual NLP Parser (Fallback & Offline Engine)
 * Parses natural language in English and Japanese into structured filter preferences.
 */
function localRuleBasedExtract(prompt) {
  const p = prompt.toLowerCase();
  
  let city = null;
  if (p.includes('tokyo') || prompt.includes('東京')) city = 'Tokyo';
  else if (p.includes('kyoto') || prompt.includes('京都')) city = 'Kyoto';
  else if (p.includes('osaka') || prompt.includes('大阪')) city = 'Osaka';

  // Extract Guests count
  let guests = null;
  const guestMatchEn = p.match(/(\d+)\s*(people|person|persons|guests?)/i);
  const guestMatchJa = prompt.match(/(\d+)\s*(人|名)/);
  if (guestMatchEn) {
    guests = parseInt(guestMatchEn[1], 10);
  } else if (guestMatchJa) {
    guests = parseInt(guestMatchJa[1], 10);
  } else if (p.includes('two people') || p.includes('for two') || p.includes('couple')) {
    guests = 2;
  } else if (p.includes('one person') || p.includes('solo') || p.includes('single')) {
    guests = 1;
  } else if (p.includes('family') || p.includes('4 people') || p.includes('four people')) {
    guests = 4;
  }

  // Extract Maximum Price
  let maxPrice = null;
  // Japanese patterns: 1万5千円, 15000円, 2万円, etc.
  if (prompt.includes('1万5千') || prompt.includes('1.5万') || prompt.includes('15,000') || prompt.includes('15000')) {
    maxPrice = 15000;
  } else if (prompt.includes('1万円') || prompt.includes('1万') || prompt.includes('10,000') || prompt.includes('10000')) {
    maxPrice = 10000;
  } else if (prompt.includes('2万円') || prompt.includes('2万') || prompt.includes('20,000') || prompt.includes('20000')) {
    maxPrice = 20000;
  } else if (prompt.includes('2万5千') || prompt.includes('25,000') || prompt.includes('25000')) {
    maxPrice = 25000;
  } else if (prompt.includes('3万円') || prompt.includes('30,000') || prompt.includes('30000')) {
    maxPrice = 30000;
  } else {
    // English regex: under ¥15,000, below 12000 yen, < 20000, etc.
    const priceMatch = p.match(/(?:under|below|less than|max|budget of|\<)\s*(?:¥|yen|jpy)?\s*([0-9,]+)/i);
    if (priceMatch) {
      maxPrice = parseInt(priceMatch[1].replace(/,/g, ''), 10);
    }
  }

  // Extract Breakfast requirement
  let breakfast = null;
  if (
    p.includes('breakfast') || 
    p.includes('morning meal') || 
    prompt.includes('朝食') || 
    prompt.includes('モーニング')
  ) {
    breakfast = true;
  }

  // Extract Minimum Rating
  let minRating = null;
  const ratingMatch = p.match(/(\d(?:\.\d)?)\s*(?:stars?|rating|\+)/i);
  if (ratingMatch) {
    const val = parseFloat(ratingMatch[1]);
    if (val >= 3.0 && val <= 5.0) minRating = val;
  } else if (p.includes('luxury') || p.includes('top rated') || p.includes('high rating') || prompt.includes('高級') || prompt.includes('高評価')) {
    minRating = 4.5;
  }

  // Extract keywords (e.g., station, river, park, castle, traditional)
  let searchKeyword = null;
  if (p.includes('station') || prompt.includes('駅')) searchKeyword = 'Station';
  else if (p.includes('river') || prompt.includes('川')) searchKeyword = 'River';
  else if (p.includes('park') || prompt.includes('公園')) searchKeyword = 'Park';
  else if (p.includes('castle') || prompt.includes('城')) searchKeyword = 'Castle';
  else if (p.includes('traditional') || p.includes('ryokan') || prompt.includes('伝統') || prompt.includes('旅館')) searchKeyword = 'Traditional';
  else if (p.includes('shibuya') || prompt.includes('渋谷')) searchKeyword = 'Shibuya';
  else if (p.includes('shinjuku') || prompt.includes('新宿')) searchKeyword = 'Shinjuku';
  else if (p.includes('ginza') || prompt.includes('銀座')) searchKeyword = 'Ginza';

  // Build summary
  const summaryParts = [];
  if (city) summaryParts.push(`in ${city}`);
  if (guests) summaryParts.push(`for ${guests} guest${guests > 1 ? 's' : ''}`);
  if (maxPrice) summaryParts.push(`under ¥${maxPrice.toLocaleString()}`);
  if (breakfast) summaryParts.push(`with breakfast included`);
  if (minRating) summaryParts.push(`rated ${minRating}+ stars`);
  if (searchKeyword) summaryParts.push(`near ${searchKeyword}`);

  const summary = summaryParts.length > 0 
    ? `Searching for hotels ${summaryParts.join(', ')}`
    : `Showing top recommended hotels`;

  return {
    city,
    guests,
    maxPrice,
    minRating,
    breakfast,
    search: searchKeyword,
    summary,
    source: 'rule_based_parser'
  };
}

/**
 * Extract structured travel preferences using Google Gemini API or fallback parser
 */
async function extractHotelPreferences(userPrompt) {
  if (!userPrompt || !userPrompt.trim()) {
    return localRuleBasedExtract('');
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // If no API key is set, use the robust local multilingual parser directly
  if (!apiKey || apiKey.trim() === '') {
    return localRuleBasedExtract(userPrompt);
  }

  try {
    const systemInstruction = `You are a hotel recommendation assistant. Convert user travel requests (in English or Japanese) into a strict JSON object with these exact keys:
{
  "city": "Tokyo" | "Kyoto" | "Osaka" | null,
  "guests": number | null,
  "maxPrice": number | null (in Japanese Yen JPY),
  "minRating": number | null (between 1.0 and 5.0),
  "breakfast": boolean | null,
  "search": string | null (e.g. "station", "river", "ryokan", "luxury", or null),
  "summary": string (short 1-line friendly summary of what the user is looking for)
}
Return ONLY pure JSON. Do not include markdown formatting, backticks, or extra commentary.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nUser request: "${userPrompt}"` }]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      console.warn(`[AI Service] Gemini API returned status ${response.status}. Using fallback parser.`);
      return localRuleBasedExtract(userPrompt);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return localRuleBasedExtract(userPrompt);
    }

    // Clean potential markdown wrappers
    const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    return {
      city: ['Tokyo', 'Kyoto', 'Osaka'].includes(parsed.city) ? parsed.city : (parsed.city ? parsed.city : null),
      guests: typeof parsed.guests === 'number' && parsed.guests > 0 ? parsed.guests : null,
      maxPrice: typeof parsed.maxPrice === 'number' && parsed.maxPrice > 0 ? parsed.maxPrice : null,
      minRating: typeof parsed.minRating === 'number' && parsed.minRating >= 1 && parsed.minRating <= 5 ? parsed.minRating : null,
      breakfast: typeof parsed.breakfast === 'boolean' ? parsed.breakfast : null,
      search: typeof parsed.search === 'string' && parsed.search.trim() ? parsed.search.trim() : null,
      summary: parsed.summary || 'Custom travel recommendations',
      source: 'gemini_api'
    };
  } catch (error) {
    console.warn('[AI Service] Error calling LLM API, falling back gracefully:', error.message);
    return localRuleBasedExtract(userPrompt);
  }
}

module.exports = {
  extractHotelPreferences,
  localRuleBasedExtract
};
