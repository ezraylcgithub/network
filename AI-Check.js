const POLICY = "🤖 AI"

const GEO_API = "http://ip-api.com/json"

const SERVICES = [
{ name:"OpenAI", url:"https://chatgpt.com"},
{ name:"Claude", url:"https://claude.ai"},
{ name:"Gemini", url:"https://gemini.google.com"},
{ name:"Perplexity", url:"https://www.perplexity.ai"},
{ name:"Poe", url:"https://poe.com"},
{ name:"Copilot", url:"https://copilot.microsoft.com"}
]

function getJSON(url){
return new Promise((resolve,reject)=>{
$httpClient.get({url,policy:POLICY},(error,response,data)=>{
if(error||!response||!data){reject("无法获取节点地区");return}
try{resolve(JSON.parse(data))}
catch(e){reject("地区解析失败")}
})
})
}

function check(service){
return new Promise(resolve=>{
$httpClient.get({
url:service.url,
policy:POLICY,
headers:{
"User-Agent":"Mozilla/5.0",
"Accept-Language":"zh-CN"
}
},(error,response,data)=>{

if(error||!response){
resolve(`${service.name}: 无法访问`)
return
}

const status=response.status||0
const body=data||""

if(status>=200&&status<400){

if(body.includes("unsupported country")||
body.includes("not available in your country")){
resolve(`${service.name}: 地区限制`)
return
}

resolve(`${service.name}: 可访问`)
return
}

if(status===403){
resolve(`${service.name}: 被拦截`)
return
}

resolve(`${service.name}: 受限`)

})
})
}

(async()=>{

try{

const geo=await getJSON(GEO_API)
const region=geo.countryCode||"未知"

let result=[]
result.push(`检测分组: ${POLICY}`)
result.push(`出口地区: ${region}`)
result.push("")

let success=0

for(const s of SERVICES){
const r=await check(s)
if(r.includes("可访问"))success++
result.push(r)
}

result.push("")
result.push(`AI 可用数量: ${success}/${SERVICES.length}`)

$done({
title:"AI 服务检测",
content:result.join("\n")
})

}catch(e){

$done({
title:"AI 服务检测",
content:String(e)
})

}

})()
