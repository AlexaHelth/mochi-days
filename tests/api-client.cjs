const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('lib/api-client.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const api={};new Function('exports',code)(api);
const original=global.fetch;
(async()=>{
 const body={kind:'entry',day:'2026-09-27',weight:null,mood:0,done:['h0'],note:'再送するメモ'};
 let sent;
 global.fetch=async(url,options)=>{sent=options;return Response.json({entries:[],settings:{},stars:1})};
 const result=await api.requestState(body);assert.equal(result.stars,1);assert.deepEqual(JSON.parse(sent.body),body);assert.equal(sent.method,'POST');
 await api.requestState();assert.equal(sent.cache,'no-store');
 global.fetch=async()=>Response.json({error:'ログインし直してください。'},{status:401});await assert.rejects(()=>api.requestState(body),/ログイン/);
 global.fetch=async()=>{throw new TypeError('Network failure')};await assert.rejects(()=>api.requestState(body),/通信できません/);
 global.fetch=(_url,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true}));
 await assert.rejects(()=>api.requestState(body,5),/保存結果を確認できません/);
 global.fetch=async(_url,options)=>{assert.deepEqual(JSON.parse(options.body),body);return Response.json({entries:[body],settings:{},stars:1})};
 assert.equal((await api.requestState(body)).entries[0].note,body.note);
 console.log('PASS: bounded requests, read cache policy, server errors, network failure, timeout and identical-payload retry.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{global.fetch=original});
