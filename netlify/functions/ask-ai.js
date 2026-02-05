/**
 * Netlify Function: OpenAI Chat Completions 프록시
 * body: { apiKey, model, messages, max_tokens?, temperature? }
 */
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

function mapModel(name) {
    var map = { 'gpt-5.2': 'gpt-4o', 'gpt-5-mini': 'gpt-4o-mini' };
    return map[name] || name;
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }
    var body;
    try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }
    var apiKey = (body.apiKey || process.env.OPENAI_API_KEY || '').trim();
    if (!apiKey) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'OpenAI API Key가 없습니다.' })
        };
    }
    var model = mapModel(body.model || 'gpt-4o');
    var messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'messages 배열이 필요합니다.' })
        };
    }
    var payload = {
        model: model,
        messages: messages,
        max_tokens: body.max_tokens != null ? body.max_tokens : 800,
        temperature: body.temperature != null ? body.temperature : 0.7
    };
    try {
        var res = await fetch(OPENAI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify(payload)
        });
        var data = await res.json();
        if (!res.ok) {
            return {
                statusCode: res.status,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: data.error && data.error.message ? data.error.message : res.statusText, details: data.error })
            };
        }
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: err.message || 'OpenAI 호출 오류' })
        };
    }
};
