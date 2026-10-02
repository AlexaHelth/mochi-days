import { getChatGPTUser } from '../../chatgpt-auth';
import { database } from '@/lib/store';
import { normalizeSettings, today, type State } from '@/lib/mochi';
import { normalizeCompanion, syncCompanion, applyCompanionAction, rewardSource, type CompanionAction, type CompanionState } from '@/lib/companion';
import { updateSchema, isRecordableDay, starActions, mergeSettings, lockedReward } from '@/lib/state-rules';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
async function state(id:string){
 const db=database();const results=await db.batch<Record<string,unknown>>([
 db.prepare('SELECT day, weight, walking_minutes AS walkingMinutes, mood, done, note, care, partial, feelings, tags FROM entries WHERE user_id = ? ORDER BY day DESC').bind(id),
 db.prepare('SELECT settings FROM profiles WHERE user_id = ?').bind(id),
 db.prepare('SELECT COUNT(*) AS count FROM stars WHERE user_id = ?').bind(id),db.prepare('SELECT state FROM companions WHERE user_id = ?').bind(id)]);
 const result={entries:results[0].results.map((r:any)=>({...r,done:JSON.parse(r.done),care:JSON.parse(r.care),partial:JSON.parse(r.partial),feelings:JSON.parse(r.feelings),tags:JSON.parse(r.tags)})),settings:normalizeSettings(results[1].results.length?JSON.parse(results[1].results[0].settings as string):null,results[0].results.length>0),stars:Number(results[2].results[0].count)};
 return {...result,companion:normalizeCompanion(results[3].results.length?JSON.parse(results[3].results[0].state as string):null,{...result,day:today()})};
}
async function saveCompanion(id:string,initial:CompanionState,command?:CompanionAction,source?:string){
 const db=database();
 for(let attempt=0;attempt<4;attempt++){
  const stored=await db.prepare('SELECT state,revision FROM companions WHERE user_id = ?').bind(id).first<{state:string;revision:number}>();
  const context={...await state(id),day:today(),source};
  const previous=stored?normalizeCompanion(JSON.parse(stored.state),context):initial;
  const next=command?applyCompanionAction(previous,command,context):syncCompanion(previous,context);
  const result=await db.prepare('INSERT INTO companions(user_id,state,revision) VALUES(?,?,0) ON CONFLICT(user_id) DO UPDATE SET state=excluded.state,revision=companions.revision+1 WHERE companions.revision=? RETURNING revision').bind(id,JSON.stringify(next),stored?.revision??-1).first<{revision:number}>();
  if(result)return;
 }
 throw new Error('思い出の保存が重なりました。もう一度保存してください。');
}
export async function GET(){
 const user=await getChatGPTUser();if(!user)return json({error:'ログインしてからお使いください。'},401);
 try{return json(await state(user.userId));}catch(e){console.error('Read failed',e);return json({error:'記録を読み込めませんでした。少し待って、もう一度お試しください。'},503);}
}
export async function POST(req:Request){
 const user=await getChatGPTUser();if(!user)return json({error:'ログインし直してください。'},401);
 if(req.headers.get('origin')!==new URL(req.url).origin)return json({error:'この操作を確認できませんでした。'},403);
 if(!req.headers.get('content-type')?.startsWith('application/json'))return json({error:'入力形式を確認してください。'},415);
 const raw=await req.text();if(raw.length>5000)return json({error:'入力が長すぎます。'},413);
 let parsed;try{parsed=updateSchema.safeParse(JSON.parse(raw));}catch{return json({error:'入力内容を確認してください。'},400);}
 if(!parsed.success)return json({error:'入力内容を確認してください。体重は1〜500kg、名前は12文字以内です。'},400);
 try{
 const db=database(),d=parsed.data,id=user.userId,previous=await state(id) as State;
 if(d.kind==='entry'){
 if(!isRecordableDay(d.day))return json({error:'今日以前の日付を選んでください。'},400);
 const actions=starActions(d);
 const old=previous.entries.find(entry=>entry.day===d.day),partial=(d.partial??old?.partial??[]).filter(h=>!d.done.includes(h as 'h0'|'h1'|'h2'));
 await db.batch([db.prepare("INSERT INTO entries(user_id,day,weight,mood,done,note,walking_minutes,partial,feelings,tags) VALUES(?,?,?,?,?,COALESCE(?,''),?,?,?,?) ON CONFLICT(user_id,day) DO UPDATE SET weight=excluded.weight,mood=excluded.mood,done=excluded.done,note=COALESCE(?,entries.note),walking_minutes=CASE WHEN ? THEN excluded.walking_minutes ELSE entries.walking_minutes END,partial=excluded.partial,feelings=COALESCE(?,entries.feelings),tags=COALESCE(?,entries.tags)").bind(id,d.day,d.weight,d.mood,JSON.stringify(d.done),d.note??null,d.walkingMinutes??null,JSON.stringify(partial),JSON.stringify(d.feelings??old?.feelings??[]),JSON.stringify(d.tags??old?.tags??[]),d.note??null,d.walkingMinutes===undefined?0:1,d.feelings===undefined?null:JSON.stringify(d.feelings),d.tags===undefined?null:JSON.stringify(d.tags)),...actions.map(a=>db.prepare('INSERT OR IGNORE INTO stars(user_id,day,action) VALUES(?,?,?)').bind(id,d.day,a))]);
 }else if(d.kind==='care'){
 if(!isRecordableDay(d.day)||d.visited&&d.day!==new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date()))return json({error:'会えた日は今日の日付で残します。'},400);
 const {kind,day,...patch}=d;
 // Merge only care flags atomically; an open older client cannot erase health records or a new rest choice.
 await db.prepare("INSERT INTO entries(user_id,day,done,note,care) VALUES(?,?,'[]','',?) ON CONFLICT(user_id,day) DO UPDATE SET care=json_patch(entries.care,excluded.care)").bind(id,day,JSON.stringify(patch)).run();
 }else if(d.kind==='settings'){
 const count=await db.prepare('SELECT COUNT(*) AS count FROM stars WHERE user_id=?').bind(id).first<{count:number}>();
 const profile=await db.prepare('SELECT settings FROM profiles WHERE user_id = ?').bind(id).first<{settings:string}>();
 const settings=mergeSettings(normalizeSettings(profile?JSON.parse(profile.settings):null),d);
 const locked=lockedReward(settings,count?.count??0);if(locked)return json({error:locked},403);
 await db.prepare('INSERT INTO profiles(user_id,settings) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET settings=excluded.settings').bind(id,JSON.stringify(settings)).run();
 }
 await saveCompanion(id,previous.companion!,d.kind==='companion'?d.command as CompanionAction:undefined,d.kind==='entry'?rewardSource(previous.entries.find(entry=>entry.day===d.day),d):undefined);
 return json(await state(id));
 }catch(e){console.error('Save failed',e);return json({error:'保存できませんでした。入力は残っています。もう一度お試しください。'},503);}
}
