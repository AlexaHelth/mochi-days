import { getChatGPTUser } from '../../chatgpt-auth';
import { database } from '@/lib/store';
import { rooms, today, speciesIds, outfitIds, outfits, normalizeSettings } from '@/lib/mochi';
import { z } from 'zod';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
const entrySchema=z.object({kind:z.literal('entry'),day:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),weight:z.number().finite().min(1).max(500).nullable(),mood:z.number().int().min(0).max(2).nullable(),done:z.array(z.enum(['h0','h1','h2'])).max(3).transform(a=>[...new Set(a)])}).strict();
const settingsSchema=z.object({kind:z.literal('settings'),name:z.string().trim().min(1).max(12),habits:z.array(z.string().trim().min(1).max(30)).min(1).max(3),showWeight:z.boolean(),room:z.enum(['cream','peach','sky','flower']),species:z.enum(speciesIds).optional(),outfit:z.enum(outfitIds).optional(),onboardingComplete:z.boolean().optional()}).strict();
async function state(id:string){
 const db=database();const results=await db.batch<Record<string,unknown>>([
 db.prepare('SELECT day, weight, mood, done FROM entries WHERE user_id = ? ORDER BY day DESC').bind(id),
 db.prepare('SELECT settings FROM profiles WHERE user_id = ?').bind(id),
 db.prepare('SELECT COUNT(*) AS count FROM stars WHERE user_id = ?').bind(id)]);
 return {entries:results[0].results.map((r:any)=>({...r,done:JSON.parse(r.done)})),settings:normalizeSettings(results[1].results.length?JSON.parse(results[1].results[0].settings as string):null,results[0].results.length>0),stars:results[2].results[0].count};
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
 let parsed;try{parsed=z.union([entrySchema,settingsSchema]).safeParse(JSON.parse(raw));}catch{return json({error:'入力内容を確認してください。'},400);}
 if(!parsed.success)return json({error:'入力内容を確認してください。体重は1〜500kg、名前は12文字以内です。'},400);
 try{
 const db=database(),d=parsed.data,id=user.userId;
 if(d.kind==='entry'){
 if(d.day>today() || d.day<'2000-01-01' || Number.isNaN(Date.parse(d.day)) || new Date(d.day+'T00:00:00Z').toISOString().slice(0,10)!==d.day)return json({error:'今日以前の日付を選んでください。'},400);
 const actions=[...(d.weight!==null?['weight']:[]),...(d.mood!==null?['mood']:[]),...d.done];
 await db.batch([db.prepare('INSERT INTO entries(user_id,day,weight,mood,done) VALUES(?,?,?,?,?) ON CONFLICT(user_id,day) DO UPDATE SET weight=excluded.weight,mood=excluded.mood,done=excluded.done').bind(id,d.day,d.weight,d.mood,JSON.stringify(d.done)),...actions.map(a=>db.prepare('INSERT OR IGNORE INTO stars(user_id,day,action) VALUES(?,?,?)').bind(id,d.day,a))]);
 }else{
 const count=await db.prepare('SELECT COUNT(*) AS count FROM stars WHERE user_id=?').bind(id).first<{count:number}>();
 if((rooms.find(r=>r.id===d.room)?.cost??Infinity)>(count?.count??0))return json({error:'このお部屋はまだ開いていません。'},403);
 const profile=await db.prepare('SELECT settings FROM profiles WHERE user_id = ?').bind(id).first<{settings:string}>();
 const previous=normalizeSettings(profile?JSON.parse(profile.settings):null);
 const {kind,...incoming}=d;
 const settings={...previous,...incoming,onboardingComplete:true};
 if((outfits.find(o=>o.id===settings.outfit)?.cost??Infinity)>(count?.count??0))return json({error:'この衣装はまだ開いていません。おほしさまを集めよう。'},403);
 await db.prepare('INSERT INTO profiles(user_id,settings) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET settings=excluded.settings').bind(id,JSON.stringify(settings)).run();
 }
 return json(await state(id));
 }catch(e){console.error('Save failed',e);return json({error:'保存できませんでした。入力は残っています。もう一度お試しください。'},503);}
}
