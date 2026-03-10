const url = "http://ip-api.com/json";

$httpClient.get(url, function(error, response, data) {
  if (error || !response || !data) {
    $done({
      title: "IP 风险检测",
      content: "请求失败"
    });
    return;
  }

  let json;
  try {
    json = JSON.parse(data);
  } catch (e) {
    $done({
      title: "IP 风险检测",
      content: "解析失败"
    });
    return;
  }

  const ip = json.query || "Unknown";
  const country = json.country || "Unknown";
  const city = json.city || "Unknown";
  const asn = json.as || "Unknown";
  const org = json.isp || json.org || "Unknown";

  const text = (org || "").toLowerCase();

  let type = "普通网络";
  let risk = "Medium";

  if (
    text.includes("amazon") ||
    text.includes("aws") ||
    text.includes("google") ||
    text.includes("azure") ||
    text.includes("oracle") ||
    text.includes("cloudflare") ||
    text.includes("digitalocean") ||
    text.includes("linode") ||
    text.includes("vultr") ||
    text.includes("akamai") ||
    text.includes("ovh") ||
    text.includes("hetzner") ||
    text.includes("contabo") ||
    text.includes("server") ||
    text.includes("hosting") ||
    text.includes("datacenter")
  ) {
    type = "机房IP";
    risk = "High";
  } else if (
    text.includes("telecom") ||
    text.includes("unicom") ||
    text.includes("mobile") ||
    text.includes("comcast") ||
    text.includes("verizon") ||
    text.includes("att") ||
    text.includes("spectrum") ||
    text.includes("softbank") ||
    text.includes("kddi") ||
    text.includes("vodafone") ||
    text.includes("orange") ||
    text.includes("telefonica") ||
    text.includes("bt") ||
    text.includes("telstra") ||
    text.includes("rogers") ||
    text.includes("cox")
  ) {
    type = "住宅网络";
    risk = "Low";
  }

  $done({
    title: "IP 风险检测",
    content:
      `IP: ${ip}\n` +
      `地区: ${country} · ${city}\n` +
      `ASN: ${asn}\n` +
      `运营商: ${org}\n` +
      `类型: ${type}\n` +
      `风险: ${risk}`
  });
});
