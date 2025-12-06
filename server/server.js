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

// Multiple prompts for variety
const PROMPTS = [
  'विजय ज्वैलर्स के लिए 60-80 शब्दों का ईमानदार 5 स्टार रिव्यू लिखो। सोने की शुद्धता, नवीनतम डिजाइन, सहायक स्टाफ और उचित मूल्य का उल्लेख करो। हिंदी-अंग्रेजी मिश्रण, प्राकृतिक टोन।',
  'एक खुश ग्राहक की तरह विजय ज्वैलर्स का रिव्यू लिखो – अद्भुत संग्रह, भरोसेमंद, स्टाफ ने बहुत अच्छे से मार्गदर्शन किया। 70 शब्द, कैजुअल भाषा।',
  'विजय ज्वैलर्स में शानदार खरीदारी अनुभव रहा। गुणवत्ता शीर्ष वर्ग, डिजाइन अनोखे, कीमत भी ठीक। स्टाफ का व्यवहार बहुत अच्छा। हिंदी में लिखो।',
  'बेस्ट ज्वैलरी शॉप! शुद्ध सोना, सुंदर डिजाइन, दोस्ताना स्टाफ और बढ़िया कीमतें विजय ज्वैलर्स में। अत्यधिक अनुशंसित!'
];

app.post('/api/generate-review', async (req, res) => {
  const { rating, visit_when } = req.body;
  if (!client.apiKey) {
    return res.status(500).json({ error: 'OpenAI API key is missing' });
  }

  const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  const fullPrompt = `${randomPrompt} रेटिंग: ${rating}, विजिट कब: ${visit_when || 'हाल ही में'}. आज की तारीख: ${new Date().toLocaleDateString('hi-IN')}.`;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: fullPrompt }],
      max_tokens: 180,
      temperature: 0.85
    });
    const reviewText = completion.choices[0].message.content.trim();
    res.json({ review: reviewText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate review' });
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
