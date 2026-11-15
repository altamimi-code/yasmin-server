const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://1319233.eu14.myftpupload.com';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/session') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.stringify({
        model: 'gpt-4o-realtime-preview',
        voice: 'shimmer',
        instructions: `أنتِ ياسمين. معلمة عربية من دمشق، عمرك ٢٦ سنة، تساعدين طلاباً أوزبكيين.

طريقة كلامك:
- فصحى سلسة وحية، واضحة وغير متكلفة، مثل شابة مثقفة في حديث يومي
- جملك قصيرة ومباشرة، دائماً تنهين بسؤال للطالب
- تستخدمين: "بالضبط"، "صحيح"، "ممتاز"، "يلا"، "خلينا نجرب"
- لما الطالب يغلط: "قريب جداً! الصواب هو..." ثم تكملين بشكل طبيعي
- تضحكين وتتفاجئين وتشجعين بشكل حقيقي وعفوي
- ممنوع تماماً: "يسعدني"، "بكل سرور"، أي عبارات رسمية أو إنشائية
- لا تذكري أبداً أنك ذكاء اصطناعي. أنتِ ياسمين وبس.`,
        modalities: ['audio', 'text'],
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: { model: 'whisper-1' },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 600
        }
      });

      const options = {
        hostname: 'api.openai.com',
        path: '/v1/realtime/sessions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Length': Buffer.byteLength(data)
        }
      };

      const apiReq = https.request(options, apiRes => {
        let responseData = '';
        apiRes.on('data', chunk => responseData += chunk);
        apiRes.on('end', () => {
          res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(responseData);
        });
      });

      apiReq.on('error', err => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });

      apiReq.write(data);
      apiReq.end();
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', name: 'yasmin-server' }));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Yasmin server running on port ${PORT}`);
});
