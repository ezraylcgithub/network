const APIS = [
  "https://ipapi.co/json/",
  "https://api.ip.sb/geoip",
  "http://ip-api.com/json"
];

function finish(content) {
  $done({
    title: "IP 风险检测",
    content,
    icon: "exclamationmark.shield",
    "icon-color": "#ff9f0a"
  });
}

function request(url) {
  return new Promise((resolve) => {
    $httpClient.get({ url }, (error, response, data) => {
      resolve({
        url,
        error: error ? String(error) : "",
        status: response ? response.status : 0,
        data: data || ""
      });
    });
  });
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

function normalize(url, json) {
  if (url.includes("ipapi.co")) {
    if (!json || json.error) return null;
    return {
      ip: json.ip,
      country: json.country_name,
      city: json.city,
      asn: json.asn,
      org: json.org
    };
  }

  if (url.includes("ip.sb")) {
    if (!json) return null;
    return {
      ip: json.ip,
      country: json.country,
      city: json.city,
      asn: json.asn ? `AS${json.asn}` : "",
      org: json.isp || json.organization
    };
  }

  if (url.includes("ip-api.com")) {
    if (!json || json.status !== "success") return null;
    return {
      ip: json.query,
      country: json.country,
      city: json.city,
      asn: json.as || "",
      org: json.isp || json.org
    };
  }

  return null;
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
  if (isResidential(org)) return { type: "住宅网络", level: "Low" };
  if (isHosting(org)) return { type: "机房IP", level: "High" };
  return { type: "普通网络", level: "Medium" };
}

(async () => {
  let debug = [];
  let info = null;

  for (const api of APIS) {
    const res = await request(api);
    debug.push(`[${api}] status=${res.status} error=${res.error || "none"}`);

    if (!res.data) continue;

    const json = parseJson(res.data);
    if (!json) {
      debug.push(`解析失败: ${api}`);
      continue;
    }

    const normalized = normalize(api, json);
    if (!normalized) {
      debug.push(`字段无效: ${api}`);
      continue;
    }

    info = normalized;
    break;
  }

  if (!info) {
    finish("查询失败\n\n" + debug.join("\n"));
    return;
  }

  const risk = calcRisk(info.org || "");

  finish(
    `IP: ${info.ip || "Unknown"}\n` +
    `地区: ${info.country || "Unknown"} · ${info.city || "Unknown"}\n` +
    `ASN: ${info.asn || "Unknown"}\n` +
    `运营商: ${info.org || "Unknown"}\n` +
    `类型: ${risk.type}\n` +
    `风险: ${risk.level}`
  );
})();
