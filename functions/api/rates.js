export async function onRequest(context) {
  const { request, env } = context;

  // 检查 Referer 和 Origin
  const url = new URL(request.url);
  const host = url.host;
  const referer = request.headers.get('referer');
  const origin = request.headers.get('origin');

  const refererValid = referer && new URL(referer).host === host;
  const originValid = origin && new URL(origin).host === host;

  if (!refererValid && !originValid) {
    return new Response(JSON.stringify({ error: 'Invalid Origin' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 从 KV 获取缓存的汇率数据
  const cached = await env.RATES_CACHE?.get('rates', { type: 'json' });
  if (cached && Date.now() < cached.expiresAt) {
    const ageMs = Date.now() - cached.cachedAt;
    const ageMins = Math.floor(ageMs / 60000);
    const ageSecs = Math.floor((ageMs % 60000) / 1000);
    const timeStr = ageMins > 0 ? `${ageMins}分${ageSecs}秒前` : `${ageSecs}秒前`;

    return new Response(JSON.stringify({
      source: `${cached.source} (缓存于 ${timeStr})`,
      rates: cached.rates
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 尝试获取汇率
  const V6_API_KEY = env.V6_API_KEY;
  const apis = [
    { url: 'https://api.exchangerate.fun/latest?base=USD', name: 'ExchangeRate.fun', ttl: 3600000 },
    { url: `https://v6.exchangerate-api.com/v6/${V6_API_KEY}/latest/USD`, name: 'ExchangeRate-API V6', ttl: 3600000 },
    { url: 'https://api.exchangerate-api.com/v4/latest/USD', name: 'ExchangeRate-API V4', ttl: 300000 }
  ];

  for (const api of apis) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(api.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('API Error');

        const data = await response.json();
        const rates = data.rates || data.conversion_rates;

        if (rates) {
          const cacheData = {
            source: api.name,
            rates,
            cachedAt: Date.now(),
            expiresAt: Date.now() + api.ttl
          };

          // 存入 KV
          await env.RATES_CACHE?.put('rates', JSON.stringify(cacheData), {
            expirationTtl: Math.floor(api.ttl / 1000)
          });

          return new Response(JSON.stringify({
            source: api.name,
            rates
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (e) {
        // 继续尝试下一个 API
      }
    }
  }

  // 离线备用汇率
  const fallbackRates = {
    "AUD": 1.44, "CAD": 1.42, "CHF": 0.808, "CNY": 6.78,
    "EUR": 0.876, "GBP": 0.75, "HKD": 7.84, "INR": 95.44,
    "JPY": 161.80, "KRW": 1502.98, "NZD": 1.73, "RUB": 76.40,
    "SGD": 1.29, "TWD": 32.08, "USD": 1
  };

  return new Response(JSON.stringify({
    source: '离线备用汇率',
    rates: fallbackRates
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
