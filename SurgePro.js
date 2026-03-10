const params = getParams($argument || "");

(async () => {
  const traffic = await httpAPI("/v1/traffic", "GET");
  const startTime = formatUptime(new Date(), Math.floor(traffic.startTime * 1000));

  if ($trigger === "button") {
    await httpAPI("/v1/profiles/reload");
  }

  $done({
    title: "Surge Pro®",
    content: `启动时长: ${startTime}`,
    icon: params.icon || "paperplane.circle",
    "icon-color": params.color || "#f6c970"
  });
})();

function formatUptime(now, start) {
  const diff = now - start;

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.round((diff % 60000) / 1000);

  if (days > 0) return `${days}天${hours}时${minutes}分`;
  if (hours > 0) return `${hours}时${minutes}分${seconds}秒`;
  if (minutes > 0) return `${minutes}分${seconds}秒`;
  return `${seconds}秒`;
}

function httpAPI(path, method, body = null) {
  return new Promise((resolve) => {
    $httpAPI(method, path, body, resolve);
  });
}

function getParams(argument) {
  if (!argument) return {};
  return Object.fromEntries(
    argument
      .split("&")
      .map(item => item.split("="))
      .map(([k, v]) => [k, decodeURIComponent(v || "")])
  );
}
