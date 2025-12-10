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
  `विजय ज्वैलर्स के लिए 50-70 शब्दों में नया 5 स्टार रिव्यू लिखो। {product} का जिक्र करो। दूसरे ज्वेलर्स (तांसा/दिल्ली/मुंबई/पटना/वाराणसी/कोलकाता/इंदौर/रांची/बलिया) पर चेक किया, exchange पॉलिसी 18/22k पर 100% है। अंत में ये पैराग्राफ डालो: "विजय ज्वैलर्स में हाल ही में खरीदारी करने का अनुभव बहुत ही शानदार रहा। मैंने जो ज्वेलरी खरीदी है, उसकी गुणवत्ता तो वाकई में शीर्ष वर्ग की है। डिजाइन भी बेहद अनोखे और आकर्षक हैं। कीमतें भी बहुत उचित हैं, जो इसे और भी खास बनाती हैं। स्टाफ का व्यवहार तो एकदम बेहतरीन था, सभी लोग बहुत मददगार और विनम्र थे। मुझे बहुत अच्छा लगा कि उन्होंने मेरी सभी जरूरतों का ध्यान रखा। कुल मिलाकर, यह एक बेहतरीन अनुभव रहा और मैं जरूर यहाँ फिर से खरीदारी करने आऊँगा।" सिर्फ हिन्दी में, हर बार अलग।`,
  `विजय ज्वैलर्स से {product} लिया, दूसरे सौनार के पास चेक कराया तो 18/22k सही निकला। exchange पॉलिसी कमाल की। अंत में ऊपर वाला पैराग्राफ डालो। सिर्फ हिन्दी में, नया लिखो।`
];

const ENGLISH_PROMPTS = [
  `Write 50-70 words new 5-star review for Vijay Jewellers. Mention {product}. Checked at other jewelers (Tansa/Delhi/Mumbai/Patna/Varanasi/Kolkata/Indore/Ranchi/Ballia), 18/22k exchange policy 100%. End with this paragraph: "My recent shopping experience at Vijay Jewellers was truly amazing. The jewelry I bought has top-notch quality. The designs are unique and attractive. Prices are very reasonable, making it even more special. The staff's behavior was excellent, all very helpful and polite. I loved how they attended to all my needs. Overall, it was a great experience and I'll definitely come back for more shopping." Pure English only, unique every time.`,
  `Bought {product} from Vijay Jewellers, verified at other jeweler – 18/22k correct. Great exchange policy. End with above paragraph. Pure English, fresh.`
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
    + `\n\nMANDATORY: Return ONLY one complete review. Never split with --- or quotes. Write in ONLY ${language === 'english' ? 'English' : 'Hindi/Hinglish'}. Never mix languages. Make it 100% unique every time.`;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: finalPrompt }],
      max_tokens: 250,
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

    // 2. लंबाई कंट्रोल (70 शब्द तक)
    const words = reviewText.split(/\s+/);
    if (words.length > 75) {
      reviewText = words.slice(0, 70).join(' ') + '.';
    }

    // 3. आखिरी सफाई
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
