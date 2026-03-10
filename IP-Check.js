const url = "http://ip-api.com/json";

$httpClient.get(url, (error, response, data) => {
  if (error || !data) {
    $done({
      title: "节点信息",
      content: "查询失败",
      icon: "globe.asia.australia.fill"
    });
    return;
  }

  let json;
  try {
    json = JSON.parse(data);
  } catch (e) {
    $done({
      title: "节点信息",
      content: "解析失败",
      icon: "globe.asia.australia.fill"
    });
    return;
  }

  const country = json.country || "Unknown";
  const countryCode = json.countryCode || "";
  const city = json.city || "Unknown";
  const isp = json.isp || "Unknown";
  const ip = json.query || "Unknown";
  const emoji = getFlagEmoji(countryCode);

  $done({
    title: "节点信息",
    content: `IP信息：${ip}\n运营商：${isp}\n所在地：${emoji}${country} - ${city}`,
    icon: "globe.asia.australia.fill"
  });
});

function getFlagEmoji(countryCode) {
  if (!countryCode) return "🏳️";
  if (countryCode.toUpperCase() === "TW") countryCode = "CN";

  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt());

  return String.fromCodePoint(...codePoints);
}
