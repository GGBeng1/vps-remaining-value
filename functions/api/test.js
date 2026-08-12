// 最简单的测试 Function
export async function onRequest() {
  return new Response(JSON.stringify({
    status: "ok",
    message: "Function 工作正常",
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
