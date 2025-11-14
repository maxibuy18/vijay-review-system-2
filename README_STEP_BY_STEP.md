Vijay Jewellers — NFC Review (Step-by-step, हिंदी)

फाइलें:
- frontend/index.html   (API_BASE placeholder को अपने backend URL से बदलें)
- server/server.js
- server/package.json

लोकल टेस्ट:
1) unzip और server में जाएँ:
   cd server
   npm install
2) सेट करें OPENAI_API_KEY:
   export OPENAI_API_KEY="sk-..."
3) चलाएँ:
   npm start
4) ब्राउज़र खोलें:
   http://localhost:3000/review?place_id=YOUR_PLACE_ID

Deploy Backend (Render.com):
1) Render पर अकाउंट बनाएं।
2) New → Web Service → GitHub repo चुनें या ZIP अपलोड करें।
3) Start Command: npm install && npm start
4) Environment Variable: OPENAI_API_KEY
5) Deploy करें और public URL याद रखें (उदा: https://your-backend.onrender.com)

Deploy Frontend (Netlify / Cloudflare Pages):
1) frontend/index.html में ऊपर API_BASE = "REPLACE_WITH_YOUR_BACKEND_URL" बदलिए।
2) Netlify पर frontend फोल्डर को deploy करें (Static site).
3) NFC टैग में रखें:
   https://your-frontend-domain.com/review?place_id=YOUR_GOOGLE_PLACE_ID

टेस्ट चेकलिस्ट:
- backend URL काम कर रहा हो
- frontend deployed और HTTPS हो
- browser (mobile) पर खोलकर जांचें — draft बने, clipboard copy हो और maps खुले

मैं आपकी मदद कर सकता हूँ:
- मैं backend को Render पर deploy करने के exact steps और GitHub repo बनाने में मदद कर दूँ।
- या मैं frontend में API_BASE बदलकर नया ZIP दे दूँ — बस आपकी backend URL दें।
