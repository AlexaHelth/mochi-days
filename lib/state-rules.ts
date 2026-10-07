import { z } from 'zod';
import { rooms, outfits, speciesIds, outfitIds, today, allRewardsUnlocked, type Settings } from './mochi';
import { companionUpdateSchema } from './companion';
import { feelings, dayTags } from './companion-content';
/** Update rules shared by the Sites API (D1) and the GitHub Pages build (this device's storage). */
export const careSchema=z.object({visited:z.boolean().optional(),resting:z.boolean().optional(),light:z.boolean().optional(),quiet:z.boolean().optional(),finished:z.boolean().optional()}).strict();
export const entrySchema=z.object({kind:z.literal('entry'),day:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),weight:z.number().finite().min(1).max(500).nullable(),walkingMinutes:z.number().int().min(0).max(1440).nullable().optional(),mood:z.number().int().min(0).max(2).nullable(),note:z.string().max(2000).optional(),done:z.array(z.enum(['h0','h1','h2'])).max(3).transform(a=>[...new Set(a)]),care:careSchema.optional(),partial:z.array(z.enum(['h0','h1','h2'])).max(3).transform(a=>[...new Set(a)]).optional(),feelings:z.array(z.enum(feelings)).max(3).transform(a=>[...new Set(a)]).optional(),tags:z.array(z.enum(dayTags)).max(3).transform(a=>[...new Set(a)]).optional(),habitNames:z.array(z.string().trim().min(1).max(30)).length(3).refine(names=>new Set(names).size===3).optional()}).strict();
export const careUpdateSchema=z.object({kind:z.literal('care'),day:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),visited:z.literal(true).optional(),resting:z.boolean().optional(),light:z.boolean().optional(),quiet:z.boolean().optional(),finished:z.boolean().optional()}).strict().refine(value=>Object.keys(value).length>2,'今日の過ごし方を選んでください。');
export const settingsSchema=z.object({kind:z.literal('settings'),name:z.string().trim().min(1).max(12),habits:z.array(z.string().trim().min(1).max(30)).min(1).max(3),showWeight:z.boolean(),room:z.enum(['cream','peach','sky','flower']),species:z.enum(speciesIds).optional(),outfit:z.enum(outfitIds).optional(),onboardingComplete:z.boolean().optional(),goal:z.string().trim().max(80).optional(),weeklyDays:z.number().int().min(1).max(7).nullable().optional(),walkingGoalMinutes:z.number().int().min(1).max(1440).nullable().optional()}).strict();
export const dailyHabitsSchema=z.object({kind:z.literal('daily-habits'),day:z.string().regex(/^\d{4}-\d{2}-\d{2}$/)}).strict();
export const updateSchema=z.union([entrySchema,settingsSchema,careUpdateSchema,companionUpdateSchema,dailyHabitsSchema]);
export function isRecordableDay(day:string){return day<=today()&&day>='2000-01-01'&&!Number.isNaN(Date.parse(day))&&new Date(day+'T00:00:00Z').toISOString().slice(0,10)===day;}
// One star per day for weight, mood and each habit. Stars are never taken back.
export function starActions(d:{weight:number|null;mood:number|null;done:string[]}){return [...(d.weight!==null?['weight']:[]),...(d.mood!==null?['mood']:[]),...d.done];}
// Older clients omit species/outfit, so fields they do not send keep their saved values.
export function mergeSettings(previous:Settings,{kind,...incoming}:z.infer<typeof settingsSchema>):Settings{return {...previous,...incoming,onboardingComplete:true};}
export function lockedReward(settings:{room:string;outfit:string},stars:number){
 if(settings.outfit==='starlight'&&!allRewardsUnlocked(stars))return '特別なもちは、すべてのごほうびをひらくと会えます。';
 if((rooms.find(r=>r.id===settings.room)?.cost??Infinity)>stars)return 'このお部屋はまだ開いていません。';
 if((outfits.find(o=>o.id===settings.outfit)?.cost??Infinity)>stars)return 'この衣装はまだ開いていません。おほしさまを集めよう。';
 return null;
}
