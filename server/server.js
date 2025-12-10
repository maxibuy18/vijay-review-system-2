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

const HINDI_PROMPTS = [
  `विजय ज्वैलर्स के लिए 65-85 शब्दों में एकदम नया और अलग 5 स्टार रिव्यू लिखो। {product} का जरूर जिक्र करो। सोने की शुद्धता, नए डिजाइन, मददगार स्टाफ, उचित कीमत और पुरानी ज्वेलरी की मरम्मत का भी उल्लेख करो। अंत में ये पैराग्राफ बिल्कुल वैसा ही डालो: "विजय ज्वैलर्स में हाल ही में खरीदारी करने का अनुभव बहुत ही शानदार रहा। मैंने जो ज्वेलरी खरीदी है, उसकी गुणवत्ता तो वाकई में शीर्ष वर्ग की है। डिजाइन भी बेहद अनोखे और आकर्षक हैं। कीमतें भी बहुत उचित हैं, जो इसे और भी खास बनाती हैं। स्टाफ का व्यवहार तो एकदम बेहतरीन था, सभी लोग बहुत मददगार और विनम्र थे। मुझे बहुत अच्छा लगा कि उन्होंने मेरी सभी जरूरतों का ध्यान रखा। कुल मिलाकर, यह एक बेहतरीन अनुभव रहा और मैं जरूर यहाँ फिर से खरीदारी करने आऊँगा।" सिर्फ हिन्दी में लिखो, कोई इंग्लिश शब्द न आए। हर बार बिल्कुल अलग लिखो।`,
  `एक खुश ग्राहक की तरह विजय ज्वैलर्स का रिव्यू लिखो। {product} खरीदा या मरम्मत करवाई, क्वालिटी कमाल की थी, स्टाफ ने बहुत अच्छे से गाइड किया। कार्ड से पेमेंट भी आसान था। अंत में ऊपर वाला पूरा पैराग्राफ वैरिएट करके डालो। सिर्फ हिन्दी में, बिल्कुल नया लिखो।`
];

const ENGLISH_PROMPTS = [
  `Write a completely new and different 5-star review for Vijay Jewellers in 65-85 words. Must mention {product}, gold purity (18k/22k hallmark), unique designs, excellent staff, reasonable prices and old jewellery repair service. End exactly with this paragraph: "My recent shopping experience at Vijay Jewellers was truly amazing. The jewelry I bought has top-notch quality. The designs are unique and attractive. Prices are very reasonable, making it even more special. The staff's behavior was excellent, all very helpful and polite. I loved how they attended to all my needs. Overall, it was a great experience and I'll definitely come back for more shopping." Write in pure English only. Never repeat any previous review.`,
  `Write a fresh 5-star review as a happy customer – bought or repaired {product}, amazing collection, trustworthy hallmark, staff guided perfectly, smooth card payment. End with the above paragraph. Pure English only, completely unique every time.`
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
    + `\n\nMANDATORY: Return ONLY one complete review. Never split with --- or quotes. Write in ONLY ${language === 'english' ? 'English' : 'Hindi/Hinglish'}. Never mix languages. Make it 100% unique every time. Always end with the full paragraph provided.`;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: finalPrompt }],
      max_tokens: 320,
      temperature: 0.98,
      presence_penalty: 1.0,
      frequency_penalty: 1.0,
      top_p: 0.95
    });

    let reviewText = completion.choices[0].message.content.trim();

    // 1. दो रिव्यू हो तो सिर्फ पहला लो
    if (reviewText.includes('---')) {
      reviewText = reviewText.split('---')[0].trim();
    }

    // 2. अंत वाला पैराग्राफ जोड़ दो अगर कटा हो
    const HINDI_END = "विजय ज्वैलर्स में हाल ही में खरीदारी करने का अनुभव बहुत ही शानदार रहा। मैंने जो ज्वेलरी खरीदी है, उसकी गुणवत्ता तो वाकई में शीर्ष वर्ग की है। डिजाइन भी बेहद अनोखे और आकर्षक हैं। कीमतें भी बहुत उचित हैं, जो इसे और भी खास बनाती हैं। स्टाफ का व्यवहार तो एकदम बेहतरीन था, सभी लोग बहुत मददगार और विनम्र थे। मुझे बहुत अच्छा लगा कि उन्होंने मेरी सभी जरूरतों का ध्यान रखा। कुल मिलाकर, यह एक बेहतरीन अनुभव रहा और मैं जरूर यहाँ फिर से खरीदारी करने आऊँगा।";
    const ENGLISH_END = "My recent shopping experience at Vijay Jewellers was truly amazing. The jewelry I bought has top-notch quality. The designs are unique and attractive. Prices are very reasonable, making it even more special. The staff's behavior was excellent, all very helpful and polite. I loved how they attended to all my needs. Overall, it was a great experience and I'll definitely come back for more shopping.";

    const FULL_END = language === 'english' ? ENGLISH_END : HINDI_END;

    const endStartHi = "विजय ज्वैलर्स में हाल ही में";
    const endStartEn = "My recent shopping experience";

    // अगर अंत वाला पैराग्राफ शुरू हुआ है लेकिन पूरा नहीं है तो पूरा जोड़ दो
    if ((language === 'hindi' && reviewText.includes(endStartHi) && !reviewText.endsWith('फिर से खरीदारी करने आऊँगा')) ||
        (language === 'english' && reviewText.includes(endStartEn) && !reviewText.endsWith("I'll definitely come back"))) {
      if (language === 'hindi') {
        reviewText = reviewText.split(endStartHi)[0].trim() + " " + HINDI_END;
      } else {
        reviewText = reviewText.split(endStartEn)[0].trim() + " " + ENGLISH_END;
      }
    }

    // बाकी सफाई
    reviewText = reviewText.replace(/\s+/g, ' ').trim();

    res.json({ review: reviewText });

  } catch (error) {
    console.error(error);
    const ending = language === 'english'
      ? "My recent shopping experience at Vijay Jewellers was truly amazing. The jewelry I bought has top-notch quality. The designs are unique and attractive. Prices are very reasonable, making it even more special. The staff's behavior was excellent, all very helpful and polite. I loved how they attended to all my needs. Overall, it was a great experience and I'll definitely come back for more shopping."
      : "विजय ज्वैलर्स में हाल ही में खरीदारी करने का अनुभव बहुत ही शानदार रहा। मैंने जो ज्वेलरी खरीदी है, उसकी गुणवत्ता तो वाकई में शीर्ष वर्ग की है। डिजाइन भी बेहद अनोखे और आकर्षक हैं। कीमतें भी बहुत उचित हैं, जो इसे और भी खास बनाती हैं। स्टाफ का व्यवहार तो एकदम बेहतरीन था, सभी लोग बहुत मददगार और विनम्र थे। मुझे बहुत अच्छा लगा कि उन्होंने मेरी सभी जरूरतों का ध्यान रखा। कुल मिलाकर, यह एक बेहतरीन अनुभव रहा और मैं जरूर यहाँ फिर से खरीदारी करने आऊँगा।";
    const fallback = language === 'english'
      ? `Outstanding service at Vijay Jewellers! The ${randomProduct} was perfect. Highly recommend this place! ${ending}`
      : `विजय ज्वैलर्स में ${randomProduct} देखते ही पसंद आ गया। क्वालिटी शानदार, स्टाफ बहुत अच्छा। जरूर आएं! ${ending}`;
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
