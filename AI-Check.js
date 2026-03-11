const POLICY = "🤖 AI";

const SERVICES = [
  { name: "OpenAI", url: "https://chatgpt.com" },
  { name: "Claude", url: "https://claude.ai" },
  { name: "Gemini", url: "https://gemini.google.com" }
];

function check(service) {
  return new Promise((resolve) => {
    $httpClient.get(
      {
        url: service.url,
        policy: POLICY,
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
        }
      },
      (error, response, data) => {
        if (error || !response) {
          resolve(`${service.name}: 无法访问`);
          return;
        }

        const status = response.status || 0;
        const body = data || "";

        if (status >= 200 && status < 400) {
          resolve(`${service.name}: 正常`);
          return;
        }

        if (status === 451) {
          resolve(`${service.name}: 地区限制`);
          return;
        }

        if (status === 403) {
          if (
            body.includes("unsupported country") ||
            body.includes("not available in your country")
          ) {
            resolve(`${service.name}: 地区限制`);
          } else {
            resolve(`${service.name}: 可访问但可能受限`);
          }
          return;
        }

        resolve(`${service.name}: 受限 (${status})`);
      }
    );
  });
}

(async () => {
  const result = [];
  result.push(`检测分组: ${POLICY}`);
  result.push("");

  let success = 0;

  for (const s of SERVICES) {
    const line = await check(s);
    if (line.includes("正常") || line.includes("可访问")) success++;
    result.push(line);
  }

  result.push("");
  result.push(`AI 可用数量: ${success}/${SERVICES.length}`);

  $done({
    title: "AI 服务检测",
    content: result.join("\n")
  });
})();
