
import 'dotenv/config';

console.log('BASE=', process.env.OPENAI_BASE_URL);
console.log('KEY_LEN=', process.env.OPENAI_API_KEY?.length || 0);

const r = await fetch(`${process.env.OPENAI_BASE_URL}/chat/completions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: process.env.OPENAI_LARGE_MODEL || 'qwen72b',
    max_tokens: 8,
    messages: [{ role: 'user', content: 'ping' }]
  })
});
console.log('STATUS=', r.status);
console.log(await r.text());
