export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // 提取 base64 参数
  const pathMatch = url.pathname.match(/^\/vrv([A-Za-z0-9_-]+)$/);

  if (pathMatch && pathMatch[1]) {
    const b64 = pathMatch[1];

    // 使用相同的解码逻辑
    const SCHEMA = [
      { key: 'ra', type: 'float' },
      { key: 'rc', type: 'dict', dict: {'AUD': 1, 'CAD': 2, 'CHF': 3, 'CNY': 4, 'EUR': 5, 'GBP': 6, 'HKD': 7, 'INR': 8, 'JPY': 9, 'KRW': 10, 'NZD': 11, 'RUB': 12, 'SGD': 13, 'TWD': 14, 'USD': 15} },
      { key: 'pd', type: 'u16' },
      { key: 'cm', type: 'dict', dict: {'real': 1, 'fixed': 2} },
      { key: 'ed', type: 'date' },
      { key: 'td', type: 'date' },
      { key: 'dr', type: 'float' },
      { key: 'pa', type: 'float' },
      { key: 'ta', type: 'float' },
      { key: 'tc', type: 'dict', dict: {'AUD': 1, 'CAD': 2, 'CHF': 3, 'CNY': 4, 'EUR': 5, 'GBP': 6, 'HKD': 7, 'INR': 8, 'JPY': 9, 'KRW': 10, 'NZD': 11, 'RUB': 12, 'SGD': 13, 'TWD': 14, 'USD': 15} },
      { key: 'eom', type: 'dict', dict: {'exact': 1, 'eom': 2} },
      { key: 'er', type: 'float' }
    ];

    const daysToDate = (days) => new Date(days * 86400000).toISOString().split('T')[0];

    function decodeBase64Params(base64UrlStr) {
      if (!base64UrlStr) return {};
      let b64Str = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
      while (b64Str.length % 4) b64Str += '=';

      try {
        const binaryStr = atob(b64Str);
        const buffer = new ArrayBuffer(binaryStr.length);
        const uint8Array = new Uint8Array(buffer);
        for (let i = 0; i < binaryStr.length; i++) {
          uint8Array[i] = binaryStr.charCodeAt(i);
        }

        const view = new DataView(buffer);
        const mask = view.getUint16(0);
        const hasF64Mask = (mask & 0x8000) !== 0;
        let f64Mask = 0;
        let offset = 2;
        let isLegacyF32 = false;

        if (hasF64Mask) {
          f64Mask = view.getUint16(offset);
          offset += 2;
        } else {
          const expectedF64Len = SCHEMA.reduce((acc, s, i) =>
            acc + ((mask & (1 << i)) ? (s.type === 'float' ? 8 : s.type === 'dict' ? 1 : 2) : 0), 2);
          isLegacyF32 = buffer.byteLength !== expectedF64Len;
        }

        const outParams = {};
        for (let i = 0; i < SCHEMA.length; i++) {
          if ((mask & (1 << i)) !== 0) {
            const schemaDef = SCHEMA[i];
            if (schemaDef.type === 'float') {
              const isF64 = hasF64Mask ? ((f64Mask & (1 << i)) !== 0) : !isLegacyF32;
              if (isF64) {
                outParams[schemaDef.key] = Number(view.getFloat64(offset).toPrecision(15)).toString();
                offset += 8;
              } else {
                outParams[schemaDef.key] = Number(view.getFloat32(offset).toPrecision(7)).toString();
                offset += 4;
              }
            } else if (schemaDef.type === 'u16') {
              outParams[schemaDef.key] = view.getUint16(offset).toString();
              offset += 2;
            } else if (schemaDef.type === 'date') {
              outParams[schemaDef.key] = daysToDate(view.getUint16(offset));
              offset += 2;
            } else if (schemaDef.type === 'dict') {
              const dictVal = view.getUint8(offset);
              const reverseDict = Object.fromEntries(Object.entries(schemaDef.dict).map(([k, v]) => [v, k]));
              outParams[schemaDef.key] = reverseDict[dictVal] || '';
              offset += 1;
            }
          }
        }
        return outParams;
      } catch (e) {
        return ;
      }
    }

    const params = decodeBase64Params(b64);
    const qs = new URLSearchParams(params).toString();

    return Response.redirect(`/?${qs}`, 302);
  }

  return new Response('Not Found', { status: 404 });
}
