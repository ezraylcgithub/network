/*
Surge Panel Script: IP Risk
查询当前出口 IP、ASN、运营商，并做简单风险判断
*/

const API = "https://ipapi.co/json/";

function done(title, content) {
  $done({
    title: title,
    content: content
  });
}

function safe(v, d = "Unknown") {
  if (!v) return d;
  return String(v);
}

function isHosting(org) {
  const s = (org || "").toLowerCase();

  const list = [
    "amazon",
    "aws",
    "google",
    "microsoft",
    "azure",
    "oracle",
    "cloudflare",
    "digitalocean",
    "linode",
    "vultr",
    "akamai",
    "ovh",
    "hetzner",
    "contabo",
    "server",
    "hosting",
    "datacenter",
    "data center"
  ];

  return list.some(k => s.includes(k));
}

function isResidential(org) {
  const s = (org || "").toLowerCase();

  const list = [
    "telecom",
    "unicom",
    "mobile",
    "comcast",
    "verizon",
    "att",
    "spectrum",
    "softbank",
    "kddi",
    "vodafone",
    "orange",
    "telefonica",
    "bt",
    "telstra",
    "rogers",
    "cox"
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

$httpClient.get(API, function(error, response, data) {

  if (error || !data) {
    done("IP 风险检测", "查询失败");
    return;
  }

  let info;

  try {
    info = JSON.parse(data);
  } catch(e) {
    done("IP 风险检测", "解析失败");
    return;
  }

  const ip = safe(info.ip);
  const country = safe(info.country_name);
  const city = safe(info.city);
  const asn = safe(info.asn);
  const org = safe(info.org);

  const risk = calcRisk(org);

  const result =
`IP: ${ip}
地区: ${country} · ${city}
ASN: ${asn}
运营商: ${org}
类型: ${risk.type}
风险: ${risk.level}`;

  done("IP 风险检测", result);

});
