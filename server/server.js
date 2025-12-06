const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const openai = require('openai');

const app = express();
const client = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Google Review URL with 5-star pre-filled
const PLACE_ID = 'CQASqQgR4RvOEBE';
const GOOGLE_REVIEW_URL = `https://search.google.com/local/writereview?placeid=${PLACE_ID}&rating=5`;

// Prompts for Hindi/Hinglish
const HINDI_PROMPTS = [
  'विजय ज्वैलर्स के लिए 60-80 शब्दों का ईमानदार 5 स्टार रिव्यू लिखो। सोने की शुद्धता, नवीनतम डिजाइन, सहायक स्टाफ और उचित मूल्य का उल्लेख करो। हिंदी-अंग्रेजी मिश्रण, प्राकृतिक टोन।',
  'एक खुश ग्राहक की तरह विजय ज्वैलर्स का रिव्यू लिखो – अद्भुत संग्रह, भरोसेमंद, स्टाफ ने बहुत अच्छे से मार्गदर्शन किया। 70 शब्द, कैजुअल भाषा।',
  'विजय ज्वैलर्स में शानदार खरीदारी अनुभव रहा। गुणवत्ता शीर्ष वर्ग, डिजाइन अनोखे, कीमत भी ठीक। स्टाफ का व्यवहार बहुत अच्छा। हिंदी में लिखो।'
];

// Prompts for English
const ENGLISH_PROMPTS = [
  'Write a genuine 5-star review for Vijay Jewellers in 60-80 words. Mention gold purity, latest designs, helpful staff, and reasonable prices. Natural, casual tone in English.',
  'Write a review as a happy customer for Vijay Jewellers – amazing collection, trustworthy, staff guided perfectly. 70 words, casual language.',
  'Great shopping experience at Vijay Jewellers. Top quality, unique designs, fair prices. Staff was excellent. Write in English.'
];

app.post('/api/generate-review', async (req, res) => {
  const { rating, visit_when, language = 'hindi' } = req.body;  // Default to Hindi

  if (!client.apiKey) {
    return res.status(500).json({ error: 'OpenAI API key is missing' });
  }

  const prompts = language === 'english' ? ENGLISH_PROMPTS : HINDI_PROMPTS;
  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

  let langInstruction = '';
  if (language === 'english') {
    langInstruction = 'Write the entire review in natural, casual English only. Make it sound like a real customer.';
  } else {
    langInstruction = 'रिव्यू हिंदी या हिंग्लिश में लिखो, प्राकृतिक और असली ग्राहक जैसा लगे।';
  }

  const fullPrompt = `${randomPrompt} Rating: ${rating} stars. Visit when: ${visit_when || 'recently'}. ${langInstruction} Today\'s date: ${new Date().toLocaleDateString(language === 'english' ? 'en-US' : 'hi-IN')}.`;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: fullPrompt }],
      max_tokens: 180,
      temperature: 0.9  // Higher for more variety
    });
    const reviewText = completion.choices[0].message.content.trim();
    res.json({ review: reviewText });
  } catch (error) {
    console.error(error);
    // Language-specific fallback
    const fallback = language === 'english'
      ? 'Amazing experience at Vijay Jewellers! Pure gold, latest designs, very helpful staff and reasonable prices. Highly recommended! ⭐⭐⭐⭐⭐'
      : 'विजय ज्वैलर्स में कमाल का अनुभव! शुद्ध सोना, नए डिजाइन, स्टाफ बहुत अच्छा और कीमत भी सही। सबको सुझाव! ⭐⭐⭐⭐⭐';
    res.json({ review: fallback });
  }
});

// Frontend serve करो (NFC वाला हिस्सा यहीं से चलेगा)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
