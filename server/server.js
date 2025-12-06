const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const openai = require('openai');

const app = express();
const client = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// सही Google Review URL with 5-star pre-filled (2025 format)
const PLACE_ID = 'CQASqQgR4RvOEBE';
const GOOGLE_REVIEW_URL = `https://g.page/r/${PLACE_ID}/review?rating=5`;

// Products/Features to mention randomly (old jewellery repair ऐड किया)
const PRODUCTS_FEATURES = [
  '18k hallmark gold necklace',
  'silver payal',
  'silver chain',
  '92.5 silver Vaigrah articles',
  '22k gold rings',
  'card payment via swipe machine',
  'old jewellery repair (broken pieces fixing)'  // नया ऐड किया
];

// Prompts for Hindi/Hinglish (with product mentions + ending structure)
const HINDI_PROMPTS = [
  `विजय ज्वैलर्स के लिए 60-80 शब्दों का ईमानदार 5 स्टार रिव्यू लिखो। ${randomProduct} का जिक्र करो, सोने की शुद्धता (18k hallmark या 22k gold), चांदी की 92.5 purity, सहायक स्टाफ, स्वाइप मशीन से आसान कार्ड पेमेंट या पुरानी ज्वेलरी की मरम्मत का उल्लेख। अंत में ये स्ट्रक्चर यूज करो: "विजय ज्वैलर्स में हाल ही में खरीदारी करने का अनुभव बहुत ही शानदार रहा। मैंने जो ज्वेलरी खरीदी है, उसकी गुणवत्ता तो वाकई में शीर्ष वर्ग की है। डिजाइन भी बेहद अनोखे और आकर्षक हैं। कीमतें भी बहुत उचित हैं, जो इसे और भी खास बनाती हैं। स्टाफ का व्यवहार तो एकदम बेहतरीन था, सभी लोग बहुत मददगार और विनम्र थे। मुझे बहुत अच्छा लगा कि उन्होंने मेरी सभी जरूरतों का ध्यान रखा। कुल मिलाकर, यह एक बेहतरीन अनुभव रहा और मैं जरूर यहाँ फिर से खरीदारी करने आऊँगा।" हिंदी-अंग्रेजी मिश्रण, प्राकृतिक टोन।`,
  `एक खुश ग्राहक की तरह विजय ज्वैलर्स का रिव्यू लिखो – ${randomProduct} खरीदा या मरम्मत करवाई, अद्भुत संग्रह (silver payal या chain), भरोसेमंद hallmark, स्टाफ ने बहुत अच्छे से मार्गदर्शन किया, card payment smooth। 70 शब्द, कैजुअल भाषा। अंत में ऊपर वाला स्ट्रक्चर वैरिएट करके ऐड करो।`,
  `विजय ज्वैलर्स में शानदार खरीदारी अनुभव रहा। ${randomProduct} की क्वालिटी टॉप (92.5 silver या 22k gold), डिजाइन अनोखे, swipe machine से पेमेंट आसान या पुरानी ज्वेलरी की फिक्सिंग। स्टाफ का व्यवहार बहुत अच्छा। हिंदी में लिखो। अंत में दिया स्ट्रक्चर यूज करो।`
];

// Prompts for English (with product mentions + ending structure)
const ENGLISH_PROMPTS = [
  `Write a genuine 5-star review for Vijay Jewellers in 60-80 words. Mention ${randomProduct}, gold purity (18k hallmark or 22k gold), 92.5 silver Vaigrah, helpful staff, easy card payment via swipe machine or old jewellery repair, and reasonable prices. End with this structure: "My recent shopping experience at Vijay Jewellers was truly amazing. The jewelry I bought has top-notch quality. The designs are unique and attractive. Prices are very reasonable, making it even more special. The staff's behavior was excellent, all very helpful and polite. I loved how they attended to all my needs. Overall, it was a great experience and I'll definitely come back for more shopping." Natural, casual tone in English.`,
  `Write a review as a happy customer for Vijay Jewellers – bought or repaired ${randomProduct}, amazing collection (silver payal or chain), trustworthy hallmark, staff guided perfectly, smooth card payment. 70 words, casual language. End with the above structure variation.`,
  `Great shopping experience at Vijay Jewellers. Top quality ${randomProduct} (92.5 silver or 22k gold), unique designs, easy swipe machine payment or broken jewellery fixing. Staff was excellent. Write in English. End with the given structure.`
];

app.post('/api/generate-review', async (req, res) => {
  const { rating, visit_when, language = 'hindi' } = req.body;  // Default to Hindi

  if (!client.apiKey) {
    return res.status(500).json({ error: 'OpenAI API key is missing' });
  }

  // Random product/feature mention
  const randomProduct = PRODUCTS_FEATURES[Math.floor(Math.random() * PRODUCTS_FEATURES.length)];

  const prompts = language === 'english' ? ENGLISH_PROMPTS : HINDI_PROMPTS;
  const randomPromptTemplate = prompts[Math.floor(Math.random() * prompts.length)].replace('${randomProduct}', randomProduct);

  let langInstruction = '';
  if (language === 'english') {
    langInstruction = 'Write the entire review in natural, casual English only. Make it sound like a real customer, include the product mention naturally. End with the specified structure without adding rating or date at the end.';
  } else {
    langInstruction = 'रिव्यू हिंदी या हिंग्लिश में लिखो, प्राकृतिक और असली ग्राहक जैसा लगे। प्रोडक्ट का जिक्र नैचुरली ऐड करो। अंत में दिया स्ट्रक्चर यूज करो, बिना रेटिंग या तारीख के।';
  }

  const fullPrompt = `${randomPromptTemplate} Rating: ${rating} stars. Visit when: ${visit_when || 'recently'}. ${langInstruction} Today's date: ${new Date().toLocaleDateString(language === 'english' ? 'en-US' : 'hi-IN')}. Do not include rating stars or date in the review text.`;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: fullPrompt }],
      max_tokens: 250,  // बढ़ाया ताकि अंत का स्ट्रक्चर फिट हो
      temperature: 0.9  // Variety के लिए
    });
    const reviewText = completion.choices[0].message.content.trim();
    res.json({ review: reviewText });
  } catch (error) {
    console.error(error);
    // Language-specific fallback with product + ending structure
    const fallbackProduct = randomProduct;
    const endingStructure = language === 'english'
      ? "My recent shopping experience at Vijay Jewellers was truly amazing. The jewelry I bought has top-notch quality. The designs are unique and attractive. Prices are very reasonable, making it even more special. The staff's behavior was excellent, all very helpful and polite. I loved how they attended to all my needs. Overall, it was a great experience and I'll definitely come back for more shopping."
      : "विजय ज्वैलर्स में हाल ही में खरीदारी करने का अनुभव बहुत ही शानदार रहा। मैंने जो ज्वेलरी खरीदी है, उसकी गुणवत्ता तो वाकई में शीर्ष वर्ग की है। डिजाइन भी बेहद अनोखे और आकर्षक हैं। कीमतें भी बहुत उचित हैं, जो इसे और भी खास बनाती हैं। स्टाफ का व्यवहार तो एकदम बेहतरीन था, सभी लोग बहुत मददगार और विनम्र थे। मुझे बहुत अच्छा लगा कि उन्होंने मेरी सभी जरूरतों का ध्यान रखा। कुल मिलाकर, यह एक बेहतरीन अनुभव रहा और मैं जरूर यहाँ फिर से खरीदारी करने आऊँगा।";
    const fallback = language === 'english'
      ? `Loved buying or repairing ${fallbackProduct} at Vijay Jewellers! Pure quality and easy payment. ${endingStructure}`
      : `विजय ज्वैलर्स से ${fallbackProduct} खरीदना या मरम्मत करवाना शानदार रहा! क्वालिटी कमाल। ${endingStructure}`;
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
