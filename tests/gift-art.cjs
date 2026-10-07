const fs=require('node:fs');
const assert=require('node:assert/strict');
const ts=require('typescript');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');

function load(path,mocks={}){
 const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const exports={};
 new Function('require','exports',code)(id=>mocks[id]??require(id),exports);
 return exports;
}

const content=load('lib/companion-content.ts');
const flora=load('app/keepsake-flora-art.tsx');
const paper=load('app/keepsake-paper-art.tsx');
const material=load('app/keepsake-material-art.tsx');
const illustrations=load('app/keepsake-illustrations.tsx',{
 './keepsake-flora-art':flora,
 './keepsake-paper-art':paper,
 './keepsake-material-art':material,
});

const labels=[
 '今日の小さなお花','はじめましての一輪',
 ...['forest','town','sea'].flatMap(route=>Array.from({length:10},(_,index)=>content.journeyScene(route,index).souvenir)),
 ...content.restStories.map(story=>story[2]),
 ...content.seasonStories.map(story=>story[3]),
];
assert.equal(labels.length,39);
assert.equal(new Set(labels).size,39,'Each catalog gift needs its own name');

function artwork(label,id){
 return renderToStaticMarkup(React.createElement(illustrations.KeepsakeIllustration,{kind:illustrations.kindForLabel(label),label,id}));
}

const art=labels.map(label=>artwork(label,label==='今日の小さなお花'?'daily:2026-10-08':undefined));
assert.equal(new Set(art).size,labels.length,'Different named gifts must not reuse the same illustration');

const days=Array.from({length:30},(_,index)=>new Date(Date.UTC(2026,9,1+index)).toISOString().slice(0,10));
const dailyFlowers=days.map(day=>artwork('今日の小さなお花','daily:'+day));
assert.equal(new Set(dailyFlowers).size,days.length,'Daily flowers should vary visibly across a month');
assert.equal(artwork('葉っぱのしおり'),artwork('葉っぱのしおり'),'Art must be stable across renders');
console.log('PASS: all 39 named gifts have distinct SVG art and 30 consecutive daily flowers have stable, varying art.');
