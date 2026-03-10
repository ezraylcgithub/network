const APIS = [
  "https://ipapi.co/json/",
  "https://api.ip.sb/geoip",
  "http://ip-api.com/json"
];

function done(content) {
  $done({
    title: "IP 风险检测",
    content,
    icon: "exclamationmark.shield",
    "icon-color": "#ff9f0a"
  });
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    $httpClient.get({ url, timeout: 6 }, (error, response, data) => {
      if (error || !response || !data) {
        reject("Request failed");
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject("Parse failed");
      }
    });
  });
}

function normalize(data, source) {
  if (source.includes("ipapi.co")) {
    if (data.error) throw new Error(data.reason || "ipapi error");
    return {
      ip: data.ip,
      country: data.country_name,
      countryCode: data.country_code,
      city: data.city,
      asn: data.asn,
      org: data.org
    };
  }

  if (source.includes("ip.sb")) {
    return {
      ip: data.ip,
      country: data.country,
      countryCode: data.country_code,
      city: data.city,
      asn: data.asn ? `AS${data.asn}` : "",
      org: data.isp || data.organization
    };
  }

  if (source.includes("ip-api.com")) {
    if (data.status !== "success") throw new Error(data.message || "ip-api error");
    return {
      ip: data.query,
      country: data.country,
      countryCode: data.countryCode,
      city: data.city,
      asn: data.as || "",
      org: data.isp || data.org
    };
  }

  throw new Error("Unknown source");
}

function isHosting(org) {
  const s = (org || "").toLowerCase();
  const list = [
    "amazon", "aws", "google", "microsoft", "azure", "oracle",
    "cloudflare", "digitalocean", "linode", "vultr", "akamai",
    "ovh", "hetzner", "contabo", "server", "hosting",
    "datacenter", "data center", "alibaba cloud", "tencent cloud"
  ];
  return list.some(k => s.includes(k));
}

function isResidential(org) {
  const s = (org || "").toLowerCase();
  const list = [
    "telecom", "unicom", "mobile", "comcast", "verizon", "att",
    "spectrum", "softbank", "kddi", "vodafone", "orange",
    "telefonica", "bt", "telstra", "rogers", "cox"
  ];
  return list.some(k => s.includes(k));
}

function calcRisk(org) {
  if (isResidential(org)) {
    return { type: "住宅网络", level: "Low" };
  }
  if (isHosting(org)) {
    return { type: "机房IP", level: "High" };
  }
  return { type: "普通网络", level: "Medium" };
}

(async () => {
  let info = null;
  let lastError = "";

  for (const api of APIS) {
    try {
      const raw = await httpGet(api);
      info = normalize(raw, api);
      break;
    } catch (e) {
      lastError = String(e);
    }
  }

  if (!info) {
    done(`查询失败\n原因: ${lastError || "所有接口均不可用"}`);
    return;
  }

  const ip = info.ip || "Unknown";
  const country = info.country || "Unknown";
  const city = info.city || "Unknown";
  const asn = info.asn || "Unknown";
  const org = info.org || "Unknown";
  const risk = calcRisk(org);

  done(
    `IP: ${ip}\n` +
    `地区: ${country} · ${city}\n` +
    `ASN: ${asn}\n` +
    `运营商: ${org}\n` +
    `类型: ${risk.type}\n` +
    `风险: ${risk.level}`
  );
})();
