const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const openai = require('openai');

const app = express();
const client = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const PLACE_ID = 'CQASqQgR4RvOEBE';

const PRODUCTS_FEATURES = [
  '18k hallmark gold necklace',
  'silver payal',
  'silver chain',
  '92.5 silver Vaigrah articles',
  '22k gold rings',
  'card payment via swipe machine',
  'old jewellery repair (broken pieces fixing)'
];

// हिंदी और इंग्लिश प्रॉम्प्ट्स अलग-अलग रखे – हर बार नया वैरिएशन
const HINDI_PROMPTS = [
  `विजय ज्वैलर्स के लिए 65-85 शब्दों का एकदम नया और अलग 5 स्टार रिव्यू लिखो। {product} का जिक्र जरूर करो। सोने की शुद्धता, डिजाइन, स्टाफ का व्यवहार, कीमत और पुरानी ज्वेलरी की मरम्मत का भी उल्लेख करो। अंत में ये स्ट्रक्चर यूज करो: "विजय ज्वैलर्स में हाल ही में खरीदारी करने का अनुभव बहुत ही शानदार रहा। मैंने जो ज्वेलरी खरीदी है, उसकी गुणवत्ता तो वाकई में शीर्ष वर्ग की है। डिजाइन भी बेहद अनोखे और आकर्षक हैं। कीमतें भी बहुत उचित हैं, जो इसे और भी खास बनाती हैं। स्टाफ का व्यवहार तो एकदम बेहतरीन था, सभी लोग बहुत मददगार और विनम्र थे। मुझे बहुत अच्छा लगा कि उन्होंने मेरी सभी जरूरतों का ध्यान रखा। कुल मिलाकर, यह एक बेहतरीन अनुभव रहा और मैं जरूर यहाँ फिर से खरीदारी करने आऊँगा।" हर बार बिल्कुल अलग लिखो, पहले वाला कॉपी मत करो।`,
  `एक खुश ग्राहक की तरह विजय ज्वैलर्स का रिव्यू लिखो। {product} खरीदा या मरम्मत करवाई, क्वालिटी कमाल की, स्टाफ ने बहुत अच्छे से गाइड किया। कार्ड पेमेंट भी आसान था। अंत में ऊपर वाला पैराग्राफ वैरिएट करके डालो। बिल्कुल नया लिखो।`
];

const ENGLISH_PROMPTS = [
  `Write a completely new and different 5-star review for Vijay Jewellers in 65-85 words. Must mention {product}, gold purity (18k/22k hallmark), unique designs, excellent staff, reasonable prices and old jewellery repair service. End exactly with this paragraph: "My recent shopping experience at Vijay Jewellers was truly amazing. The jewelry I bought has top-notch quality. The designs are unique and attractive. Prices are very reasonable, making it even more special. The staff's behavior was excellent, all very helpful and polite. I loved how they attended to all my needs. Overall, it was a great experience and I'll definitely come back for more shopping." Never repeat previous reviews.`,
  `Write a fresh review as a happy customer – bought/repaired {product}, amazing collection, trustworthy hallmark, staff guided perfectly, smooth card payment. End with the above paragraph variation. Make it unique every time.`
];

app.post('/api/generate-review', async (req, res) => {
  const { rating = 5, language = 'hindi' } = req.body;

  if (!client.apiKey) {
    return res.status(500).json({ error: 'OpenAI API key is missing' });
  }

  const randomProduct = PRODUCTS_FEATURES[Math.floor(Math.random() * PRODUCTS_FEATURES.length)];
  const prompts = language === 'english' ? ENGLISH_PROMPTS : HINDI_PROMPTS;
  const basePrompt = prompts[Math.floor(Math.random() * prompts.length)];

  const finalPrompt = basePrompt
    .replace(/{product}/g, randomProduct)
    + `\n\nImportant: This must be a completely unique review. Never repeat any previous version. Today's date: ${new Date().toLocaleDateString(language === 'english' ? 'en-US' : 'hi-IN')}`;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: finalPrompt }],
      max_tokens: 280,
      temperature: 0.95,  // ज्यादा वैरिएशन
      presence_penalty: 0.6,
      frequency_penalty: 0.6
    });

    const reviewText = completion.choices[0].message.content.trim();
    res.json({ review: reviewText });
  } catch (error) {
    console.error(error);
    const ending = language === 'english'
      ? "My recent shopping experience at Vijay Jewellers was truly amazing. The jewelry I bought has top-notch quality. The designs are unique and attractive. Prices are very reasonable, making it even more special. The staff's behavior was excellent, all very helpful and polite. I loved how they attended to all my needs. Overall, it was a great experience and I'll definitely come back for more shopping."
      : "विजय ज्वैलर्स में हाल ही में खरीदारी करने का अनुभव बहुत ही शानदार रहा। मैंने जो ज्वेलरी खरीदी है, उसकी गुणवत्ता तो वाकई में शीर्ष वर्ग की है। डिजाइन भी बेहद अनोखे और आकर्षक हैं। कीमतें भी बहुत उचित हैं, जो इसे और भी खास बनाती हैं। स्टाफ का व्यवहार तो एकदम बेहतरीन था, सभी लोग बहुत मददगार और विनम्र थे। मुझे बहुत अच्छा लगा कि उन्होंने मेरी सभी जरूरतों का ध्यान रखा। कुल मिलाकर, यह एक बेहतरीन अनुभव रहा और मैं जरूर यहाँ फिर से खरीदारी करने आऊँगा।";

    const fallback = language === 'english'
      ? `Excellent service at Vijay Jewellers! Loved the ${randomProduct}. Pure quality and great staff. ${ending}`
      : `विजय ज्वैलर्स में ${randomProduct} बहुत पसंद आया। क्वालिटी शानदार और स्टाफ कमाल का। ${ending}`;

    res.json({ review: fallback });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
