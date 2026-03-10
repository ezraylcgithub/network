const REQUEST_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36",
  "Accept-Language": "en"
};

const UA = REQUEST_HEADERS["User-Agent"];

const STATUS_COMING = 2;
const STATUS_AVAILABLE = 1;
const STATUS_NOT_AVAILABLE = 0;
const STATUS_TIMEOUT = -1;
const STATUS_ERROR = -2;

(async () => {
  const panel = {
    title: "流媒体解锁检测",
    content: "",
    icon: "play.tv.fill",
    "icon-color": "#FF2D55"
  };

  const disney = await testDisneyPlus();
  const results = await Promise.all([
    checkYouTubePremium(),
    checkNetflix()
  ]);

  results.push(formatDisneyResult(disney));
  panel.content = results.join("\n");

  $done(panel);
})();

async function checkYouTubePremium() {
  try {
    const code = await requestYouTubePremium();
    return code === "Not Available"
      ? "YouTube: 不支持解锁"
      : `YouTube: 已解锁 ➟ ${code.toUpperCase()}`;
  } catch (e) {
    return "YouTube: 检测失败，请刷新面板";
  }
}

function requestYouTubePremium() {
  return new Promise((resolve, reject) => {
    $httpClient.get(
      {
        url: "https://www.youtube.com/premium",
        headers: REQUEST_HEADERS
      },
      (error, response, data) => {
        if (error || !response || response.status !== 200) {
          reject("Error");
          return;
        }

        if (data.includes("Premium is not available in your country")) {
          resolve("Not Available");
          return;
        }

        const match = data.match(/"countryCode":"(.*?)"/);
        if (match && match[1]) {
          resolve(match[1]);
          return;
        }

        if (data.includes("www.google.cn")) {
          resolve("CN");
          return;
        }

        resolve("US");
      }
    );
  });
}

async function checkNetflix() {
  let result = "Netflix: ";

  try {
    const fullUnlock = await requestNetflixRegion(81280792);
    if (fullUnlock !== "Not Found") {
      return result + `已完整解锁 ➟ ${fullUnlock.toUpperCase()}`;
    }

    const originalsOnly = await requestNetflixRegion(80018499);
    if (originalsOnly !== "Not Found") {
      return result + `仅解锁自制剧 ➟ ${originalsOnly.toUpperCase()}`;
    }

    return result + "该节点不支持解锁";
  } catch (e) {
    if (e === "Not Available") {
      return result + "该节点不支持解锁";
    }
    return result + "检测失败，请刷新面板";
  }
}

function requestNetflixRegion(filmId) {
  return new Promise((resolve, reject) => {
    $httpClient.get(
      {
        url: `https://www.netflix.com/title/${filmId}`,
        headers: REQUEST_HEADERS
      },
      (error, response) => {
        if (error || !response) {
          reject("Error");
          return;
        }

        if (response.status === 403) {
          reject("Not Available");
          return;
        }

        if (response.status === 404) {
          resolve("Not Found");
          return;
        }

        if (response.status === 200) {
          const url = response.headers["x-originating-url"] || "";
          let region = (url.split("/")[3] || "").split("-")[0];
          if (!region || region === "title") region = "us";
          resolve(region);
          return;
        }

        reject("Error");
      }
    );
  });
}

async function testDisneyPlus() {
  try {
    const home = await Promise.race([requestDisneyHomePage(), timeout(7000)]);
    const location = await Promise.race([requestDisneyLocationInfo(), timeout(7000)]);

    const region = location.countryCode || home.region || "";

    if (location.inSupportedLocation === false || location.inSupportedLocation === "false") {
      return { region, status: STATUS_COMING };
    }

    return { region, status: STATUS_AVAILABLE };
  } catch (e) {
    if (e === "Not Available") return { status: STATUS_NOT_AVAILABLE };
    if (e === "Timeout") return { status: STATUS_TIMEOUT };
    return { status: STATUS_ERROR };
  }
}

function formatDisneyResult({ region = "", status }) {
  if (status === STATUS_COMING) {
    return `Disney+: 即将登陆~${region.toUpperCase()}`;
  }
  if (status === STATUS_AVAILABLE) {
    return `Disney+: 已解锁 ➟ ${region.toUpperCase()}`;
  }
  if (status === STATUS_NOT_AVAILABLE) {
    return "Disney+: 未支持 🚫";
  }
  if (status === STATUS_TIMEOUT) {
    return "Disney+: 检测超时 🚦";
  }
  return "Disney+: 检测失败，请刷新面板";
}

function requestDisneyLocationInfo() {
  return new Promise((resolve, reject) => {
    $httpClient.post(
      {
        url: "https://disney.api.edge.bamgrid.com/graph/v1/device/graphql",
        headers: {
          "Accept-Language": "en",
          Authorization: "ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84",
          "Content-Type": "application/json",
          "User-Agent": UA
        },
        body: JSON.stringify({
          query: "mutation registerDevice($input: RegisterDeviceInput!) { registerDevice(registerDevice: $input) { grant { grantType assertion } } }",
          variables: {
            input: {
              applicationRuntime: "chrome",
              attributes: {
                browserName: "chrome",
                browserVersion: "94.0.4606",
                manufacturer: "apple",
                model: null,
                operatingSystem: "macintosh",
                operatingSystemVersion: "10.15.7",
                osDeviceIds: []
              },
              deviceFamily: "browser",
              deviceLanguage: "en",
              deviceProfile: "macosx"
            }
          }
        })
      },
      (error, response, data) => {
        if (error || !response || response.status !== 200) {
          reject("Not Available");
          return;
        }

        let json;
        try {
          json = JSON.parse(data);
        } catch (e) {
          reject("Error");
          return;
        }

        if (json?.errors) {
          reject("Not Available");
          return;
        }

        const countryCode = json?.extensions?.sdk?.session?.location?.countryCode;
        const inSupportedLocation = json?.extensions?.sdk?.session?.inSupportedLocation;

        resolve({ countryCode, inSupportedLocation });
      }
    );
  });
}

function requestDisneyHomePage() {
  return new Promise((resolve, reject) => {
    $httpClient.get(
      {
        url: "https://www.disneyplus.com/",
        headers: {
          "Accept-Language": "en",
          "User-Agent": UA
        }
      },
      (error, response, data) => {
        if (error || !response) {
          reject("Error");
          return;
        }

        if (response.status !== 200 || data.includes("Sorry, Disney+ is not available in your region.")) {
          reject("Not Available");
          return;
        }

        const match = data.match(/Region: ([A-Za-z]{2})[\s\S]*?CNBL: ([12])/);
        if (!match) {
          resolve({ region: "" });
          return;
        }

        resolve({ region: match[1] });
      }
    );
  });
}

function timeout(ms = 5000) {
  return new Promise((_, reject) => {
    setTimeout(() => reject("Timeout"), ms);
  });
}
