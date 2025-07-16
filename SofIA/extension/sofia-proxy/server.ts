import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

app.post('/relay', async (req, res) => {
    try {
        const response = await fetch('http://127.0.0.1:3000/api/messaging/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body), // ✅ transmettre tel quel
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        console.error('❌ Proxy error:', err);
        res.status(500).json({ success: false, error: err });
    }
});


app.listen(8080, () => {
    console.log('✅ Proxy ElizaOS actif → http://127.0.0.1:8080/relay');
});