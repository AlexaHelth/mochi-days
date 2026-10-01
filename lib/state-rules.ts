import { z } from 'zod';
import { rooms, outfits, speciesIds, outfitIds, today, type Settings } from './mochi';
/** Update rules shared by the Sites API (D1) and the GitHub Pages build (this device's storage). */
export const entrySchema=z.object({kind:z.literal('entry'),day:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),weight:z.number().finite().min(1).max(500).nullable(),walkingMinutes:z.number().int().min(0).max(1440).nullable().optional(),mood:z.number().int().min(0).max(2).nullable(),note:z.string().max(2000).optional(),done:z.array(z.enum(['h0','h1','h2'])).max(3).transform(a=>[...new Set(a)])}).strict();
export const settingsSchema=z.object({kind:z.literal('settings'),name:z.string().trim().min(1).max(12),habits:z.array(z.string().trim().min(1).max(30)).min(1).max(3),showWeight:z.boolean(),room:z.enum(['cream','peach','sky','flower']),species:z.enum(speciesIds).optional(),outfit:z.enum(outfitIds).optional(),onboardingComplete:z.boolean().optional(),goal:z.string().trim().max(80).optional()}).strict();
export const updateSchema=z.union([entrySchema,settingsSchema]);
export function isRecordableDay(day:string){return day<=today()&&day>='2000-01-01'&&!Number.isNaN(Date.parse(day))&&new Date(day+'T00:00:00Z').toISOString().slice(0,10)===day;}
// One star per day for weight, mood and each habit. Stars are never taken back.
export function starActions(d:{weight:number|null;mood:number|null;done:string[]}){return [...(d.weight!==null?['weight']:[]),...(d.mood!==null?['mood']:[]),...d.done];}
// Older clients omit species/outfit, so fields they do not send keep their saved values.
export function mergeSettings(previous:Settings,{kind,...incoming}:z.infer<typeof settingsSchema>):Settings{return {...previous,...incoming,onboardingComplete:true};}
export function lockedReward(settings:{room:string;outfit:string},stars:number){
 if((rooms.find(r=>r.id===settings.room)?.cost??Infinity)>stars)return 'このお部屋はまだ開いていません。';
 if((outfits.find(o=>o.id===settings.outfit)?.cost??Infinity)>stars)return 'この衣装はまだ開いていません。おほしさまを集めよう。';
 return null;
}
