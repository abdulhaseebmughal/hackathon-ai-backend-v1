/**
 * AI-CLIENT — Groq API Service
 * Central service for all AI-powered features in ClinIQ Pro.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Model selection - Using ultra-fast Groq models (free tier)
const MODELS = {
    quality: 'llama-3.3-70b-versatile',
    fast: 'llama-3.1-8b-instant',
};

/**
 * Core AI-CLIENT call function.
 * @param {Object} options
 * @param {string} options.systemPrompt   - The system prompt (role + rules)
 * @param {string} options.userMessage    - The user/doctor query
 * @param {'quality'|'fast'} options.model - Which model tier to use
 * @param {boolean} options.expectJson    - If true, parses response as JSON
 * @param {number} options.maxTokens      - Max tokens (default 1500)
 */
const callAI = async ({ systemPrompt, userMessage, model = 'quality', expectJson = false, maxTokens = 1500 }) => {
    const apiKey = process.env.GROQ_API_KEY || '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';

    if (!apiKey || apiKey.startsWith('your_')) {
        console.warn('[AI-CLIENT] API key missing or placeholder. Returning fallback.');
        return { ok: false, fallback: true, message: 'AI service unavailable — API key not configured.' };
    }

    const requestBody = {
        model: MODELS[model] || MODELS.quality,
        max_tokens: maxTokens,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ],
    };

    if (expectJson) {
        requestBody.response_format = { type: 'json_object' };
    }

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error(`[AI-CLIENT] HTTP ${response.status}: ${errBody}`);

            let detailedError = `Groq API returned ${response.status}`;
            try {
                const p = JSON.parse(errBody);
                if (p.error && p.error.message) detailedError = p.error.message;
            } catch (e) { }

            throw new Error(detailedError);
        }

        const data = await response.json();
        const rawText = data?.choices?.[0]?.message?.content ?? '';

        if (!rawText) {
            throw new Error('AI-CLIENT: Empty response from Groq API');
        }

        if (expectJson) {
            let parsed;
            try {
                parsed = JSON.parse(rawText);
            } catch (parseErr) {
                console.error('[AI-CLIENT] JSON parse error:', rawText);
                throw new Error('AI returned malformed JSON — could not parse response');
            }
            return { ok: true, fallback: false, data: parsed };
        }

        return { ok: true, fallback: false, message: rawText };

    } catch (error) {
        console.error(`[AI-CLIENT] Error: ${error.message}`);
        return {
            ok: false,
            fallback: true,
            message: error.message || 'AI service temporarily unavailable',
        };
    }
};

module.exports = { callAI, MODELS };
