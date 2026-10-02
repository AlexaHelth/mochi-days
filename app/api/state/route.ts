import { getChatGPTUser } from '../../chatgpt-auth';
import { database } from '@/lib/store';
import { normalizeSettings } from '@/lib/mochi';
import { updateSchema, isRecordableDay, starActions, mergeSettings, lockedReward } from '@/lib/state-rules';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
async function state(id:string){
 const db=database();const results=await db.batch<Record<string,unknown>>([
 db.prepare('SELECT day, weight, walking_minutes AS walkingMinutes, mood, done, note, care FROM entries WHERE user_id = ? ORDER BY day DESC').bind(id),
 db.prepare('SELECT settings FROM profiles WHERE user_id = ?').bind(id),
 db.prepare('SELECT COUNT(*) AS count FROM stars WHERE user_id = ?').bind(id)]);
 return {entries:results[0].results.map((r:any)=>({...r,done:JSON.parse(r.done),care:JSON.parse(r.care)})),settings:normalizeSettings(results[1].results.length?JSON.parse(results[1].results[0].settings as string):null,results[0].results.length>0),stars:results[2].results[0].count};
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
 const db=database(),d=parsed.data,id=user.userId;
 if(d.kind==='entry'){
 if(!isRecordableDay(d.day))return json({error:'今日以前の日付を選んでください。'},400);
 const actions=starActions(d);
 await db.batch([db.prepare("INSERT INTO entries(user_id,day,weight,mood,done,note,walking_minutes) VALUES(?,?,?,?,?,COALESCE(?,''),?) ON CONFLICT(user_id,day) DO UPDATE SET weight=excluded.weight,mood=excluded.mood,done=excluded.done,note=COALESCE(?,entries.note),walking_minutes=CASE WHEN ? THEN excluded.walking_minutes ELSE entries.walking_minutes END").bind(id,d.day,d.weight,d.mood,JSON.stringify(d.done),d.note??null,d.walkingMinutes??null,d.note??null,d.walkingMinutes===undefined?0:1),...actions.map(a=>db.prepare('INSERT OR IGNORE INTO stars(user_id,day,action) VALUES(?,?,?)').bind(id,d.day,a))]);
 }else if(d.kind==='care'){
 if(!isRecordableDay(d.day)||d.visited&&d.day!==new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date()))return json({error:'会えた日は今日の日付で残します。'},400);
 const {kind,day,...patch}=d;
 // Merge only care flags atomically; an open older client cannot erase health records or a new rest choice.
 await db.prepare("INSERT INTO entries(user_id,day,done,note,care) VALUES(?,?,'[]','',?) ON CONFLICT(user_id,day) DO UPDATE SET care=json_patch(entries.care,excluded.care)").bind(id,day,JSON.stringify(patch)).run();
 }else{
 const count=await db.prepare('SELECT COUNT(*) AS count FROM stars WHERE user_id=?').bind(id).first<{count:number}>();
 const profile=await db.prepare('SELECT settings FROM profiles WHERE user_id = ?').bind(id).first<{settings:string}>();
 const settings=mergeSettings(normalizeSettings(profile?JSON.parse(profile.settings):null),d);
 const locked=lockedReward(settings,count?.count??0);if(locked)return json({error:locked},403);
 await db.prepare('INSERT INTO profiles(user_id,settings) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET settings=excluded.settings').bind(id,JSON.stringify(settings)).run();
 }
 return json(await state(id));
 }catch(e){console.error('Save failed',e);return json({error:'保存できませんでした。入力は残っています。もう一度お試しください。'},503);}
}
