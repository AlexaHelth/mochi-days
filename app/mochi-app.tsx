'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { PawPrint, House, ChartNoAxesCombined, Gift, Settings as SettingsIcon, Star, Heart, Smile, Meh, Moon, Check, LockKeyhole, LogOut, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PilotTools } from './pilot-tools';
import { WeightPicker } from './weight-picker';
import { WalkingPicker } from './walking-picker';
import { HistoryView } from './history-view';
import { TodayView } from './today-view';
import { MoodPicker } from './mood-picker';
import { RewardGallery } from './reward-gallery';
import { Pet } from './pet';
import { PetPlayground, WaitingPet } from './pet-playground';
import { CompanionGateway, CompanionHub, type HubPage } from './companion-hub';
import { EntryDetails } from './entry-details';
import { newCompanion, dailyGreeting, recordReply, bondLevel, plantStage, type CompanionAction, type Interaction } from '@/lib/companion';
import { readDraft, writeDraft, clearDraft } from '@/lib/record-drafts';
import { notePrompts } from '@/lib/companion-content';
import { careFor, visitDays, welcomeKind, welcomeText, type WelcomeKind } from '@/lib/care';
import { habitNamesFor } from '@/lib/habits';
import { hasRecord } from '@/lib/history';
import { GoalPicker } from './goal-picker';
import { goalOptions } from '@/lib/goals';
import { previousWalking, walkingDraft } from '@/lib/walking';
import { previousWeight, weightDraft } from '@/lib/weight';
import { requestState } from '@/lib/api-client';
import { requestDeviceState } from '@/lib/device-store';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { defaults, rooms, today, type Entry, type Settings, type State, type CareDay, pets, outfits, expressionNames, type Species, type Outfit } from '@/lib/mochi';
// "/" on Sites, "/mochi-days/" on GitHub Pages.
const base=import.meta.env.BASE_URL;
function PetPicker({value,onChange,disabled=false}:{value:Species;onChange:(value:Species)=>void;disabled?:boolean}){
 return <RadioGroup className="pet-picker" value={value} onValueChange={v=>onChange(v as Species)} disabled={disabled} aria-label="相棒を選ぶ">{pets.map(p=><label key={p.id} className={'pet-choice '+(value===p.id?'selected':'')}><RadioGroupItem value={p.id} className="sr-only"/><Pet species={p.id}/><strong>{p.name}</strong><span>{p.description}</span>{value===p.id&&<Check className="choice-check" size={18}/>}</label>)}</RadioGroup>;
}
const blank=(day:string):Entry=>({day,weight:null,walkingMinutes:null,mood:null,done:[],note:''});
export default function MochiApp({signedIn,signInPath='',storage='server',draftScope='device'}:{signedIn:boolean;signInPath?:string;storage?:'server'|'device';draftScope?:string}){
 const onDevice=storage==='device',request=onDevice?requestDeviceState:requestState;
 // iPhone Safari keeps a separate storage for the Home Screen app, so choose where to start before recording.
 const safariTab=onDevice&&(navigator as Navigator&{standalone?:boolean}).standalone===false;
 const [state,setState]=useState<State>({entries:[],settings:defaults,stars:0});
 const [loading,setLoading]=useState(signedIn),[error,setError]=useState(''),[saving,setSaving]=useState(false),[tab,setTab]=useState('today'),[celebrate,setCelebrate]=useState(false);
 const [settingsOpen,setSettingsOpen]=useState(false),[editSettings,setEditSettings]=useState<Settings>(defaults),[entryOpen,setEntryOpen]=useState(false),[draft,setDraft]=useState<Entry>(blank(today())),[weight,setWeight]=useState('');
 const [weightIncluded,setWeightIncluded]=useState(false),[recordMode,setRecordMode]=useState<'daily'|'weight'|'walking'|'note'>('daily');
 const [walkingMinutes,setWalkingMinutes]=useState('0'),[walkingIncluded,setWalkingIncluded]=useState(false);
 const [goalOpen,setGoalOpen]=useState(false),[goalDraft,setGoalDraft]=useState(''),[chosenGoal,setChosenGoal]=useState<string>(goalOptions[0].text);
 const [loungeOpen,setLoungeOpen]=useState(false),[showRestRecords,setShowRestRecords]=useState(false),[welcome,setWelcome]=useState<WelcomeKind>('first');
 const weightOnly=recordMode==='weight',walkingOnly=recordMode==='walking',noteOnly=recordMode==='note',singleFieldOnly=recordMode!=='daily';
 const [failedBody,setFailedBody]=useState<unknown>(null),[offline,setOffline]=useState(false),[unlockReaction,setUnlockReaction]=useState(false);
 const [loaded,setLoaded]=useState(false);
 const [chosenSpecies,setChosenSpecies]=useState<Species>('dog'),[chosenName,setChosenName]=useState('もち'),[demoPose,setDemoPose]=useState<number|null>(null);
 const [currentDay,setCurrentDay]=useState(today()),[hour,setHour]=useState(12);
 const pending=useRef(false),stateRef=useRef(state);stateRef.current=state;
 const [previewOutfit,setPreviewOutfit]=useState<Outfit|null>(null);
 const [habitOpen,setHabitOpen]=useState<number|null>(null);
 const [hubOpen,setHubOpen]=useState(false),[hubPage,setHubPage]=useState<HubPage>('profile'),[detailsOpen,setDetailsOpen]=useState(false),[detailDraft,setDetailDraft]=useState<Entry>(blank(today())),[partialOpen,setPartialOpen]=useState(false),[letterNote,setLetterNote]=useState(false),[noteHint,setNoteHint]=useState('今日よかったこと、食べたもの、明日の自分へ。'),[draftStored,setDraftStored]=useState(true),[restoredDraft,setRestoredDraft]=useState(false),[recordMessage,setRecordMessage]=useState(''),[recordSequence,setRecordSequence]=useState(0),[timerAdded,setTimerAdded]=useState<number|null>(null);
 const savedDraft=useRef(false),idle=useRef<Promise<void>>(Promise.resolve()),releaseIdle=useRef<()=>void>(()=>{}),commandQueue=useRef<Promise<boolean>>(Promise.resolve(true)),failureRef=useRef(false),visitedCompanion=useRef(''),queuedInteractions=useRef(new Set<string>());
 useEffect(()=>{const tick=()=>{setCurrentDay(today());setHour(Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tokyo',hour:'2-digit',hourCycle:'h23'}).format(new Date())))};tick();const timer=setInterval(tick,60000);return()=>clearInterval(timer)},[]);
 const load=useCallback(async()=>{setLoading(true);setError('');try{const d=await request();setState(d);setWelcome(welcomeKind(d.entries,today()));setLoaded(true)}catch(e){setError(e instanceof Error?e.message:'読み込みに失敗しました。')}finally{setLoading(false)}},[request]);
 useEffect(()=>{if(signedIn)void load()},[signedIn,load]);
 useEffect(()=>{if(!celebrate)return;const timer=setTimeout(()=>setCelebrate(false),3000);return()=>clearTimeout(timer)},[celebrate]);
 const save=useCallback(async(body:unknown,quiet=false)=>{const incoming=body as Entry&{kind:string};if(incoming?.kind==='entry'){const previous=stateRef.current.entries.find(item=>item.day===incoming.day)??blank(incoming.day);body={...incoming,habitNames:habitNamesFor(previous,stateRef.current.settings.habits)}}if(pending.current)return false;pending.current=true;idle.current=new Promise(resolve=>{releaseIdle.current=resolve});setSaving(true);setError('');try{const before=stateRef.current;const d=await request(body);failureRef.current=false;setFailedBody(null);const gained=d.stars-stateRef.current.stars;
 const newlyOpened=outfits.filter(o=>o.cost>stateRef.current.stars&&o.cost<=d.stars);
 const openedRoom=rooms.some(r=>r.cost>stateRef.current.stars&&r.cost<=d.stars);
 setState(d);setDemoPose(null);if(openedRoom||newlyOpened.length)setUnlockReaction(true);if(gained>0)setCelebrate(true);if(!quiet&&(body as {kind?:string})?.kind!=='entry')toast.success('保存しました');if((body as {kind?:string})?.kind==='entry'){setCelebrate(true);const day=(body as {day:string}).day,after=d.entries.find(entry=>entry.day===day);if(after&&day===today()){if(before.companion?.preferences.haptics)navigator.vibrate?.(12);setRecordMessage(recordReply(before.entries.find(entry=>entry.day===day),after));setRecordSequence(n=>n+1)}}return true}catch(e){failureRef.current=true;setFailedBody(body);const message=e instanceof Error?e.message:'保存できませんでした。';setError(message);toast.error(message);return false}finally{pending.current=false;setSaving(false);releaseIdle.current()}},[request]);
 const sendCompanion=useCallback((command:CompanionAction)=>{const work=commandQueue.current.catch(()=>false).then(async()=>{await idle.current;if(failureRef.current)return false;return save({kind:'companion',command},true)});commandQueue.current=work;return work},[save]);
 const interact=useCallback((interaction:Interaction)=>{setDemoPose(null);setRecordMessage('');const latest=stateRef.current,day=today(),key=day+':'+latest.settings.species+':'+interaction;if(latest.companion?.pets[latest.settings.species]?.interactions[day]?.includes(interaction)||queuedInteractions.current.has(key))return;queuedInteractions.current.add(key);void sendCompanion({action:'interact',interaction}).then(ok=>{if(!ok)queuedInteractions.current.delete(key)})},[sendCompanion]);
 useEffect(()=>{if(!recordMessage)return;const timer=setTimeout(()=>setRecordMessage(''),4000);return()=>clearTimeout(timer)},[recordSequence,recordMessage]);
 useEffect(()=>{if(!entryOpen)return;const snapshot={entry:draft,weight,weightIncluded,walkingMinutes,walkingIncluded,letter:letterNote,at:Date.now()};const flush=()=>{if(!savedDraft.current)setDraftStored(writeDraft(draftScope,draft.day,recordMode,snapshot))};const timer=setTimeout(flush,200);return()=>{clearTimeout(timer);flush()}},[entryOpen,draft,weight,weightIncluded,walkingMinutes,walkingIncluded,letterNote,draftScope,recordMode]);
 useEffect(()=>{
 const context=(document as any).modelContext;if(!context?.registerTool||!signedIn)return;
 const life=new AbortController();try{Promise.resolve(context.registerTool({name:'open_daily_record',title:'記録画面を開く',description:'指定日の記録フォームを開きます。保存はしません。',inputSchema:{type:'object',properties:{date:{type:'string',description:'YYYY-MM-DD'}},required:['date'],additionalProperties:false},annotations:{readOnlyHint:false},execute:(input:unknown)=>{const d=(input as any)?.date;if(typeof d!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(Date.parse(d))||new Date(d+'T00:00:00Z').toISOString().slice(0,10)!==d||d>today()||d<'2000-01-01')throw new Error('有効な日付を指定してください');const entry=stateRef.current.entries.find(e=>e.day===d)??blank(d);prepareEntry(entry);setRecordMode('daily');setEntryOpen(true);return {opened:true,date:d,saved:false}}},{signal:life.signal})).catch(()=>{});}catch{}return()=>life.abort();
 },[signedIn]);
 useEffect(()=>{if(demoPose===null)return;const timer=setTimeout(()=>setDemoPose(null),5000);return()=>clearTimeout(timer)},[demoPose]);
 useEffect(()=>{const update=()=>setOffline(!navigator.onLine);update();window.addEventListener('online',update);window.addEventListener('offline',update);return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update)}},[]);
 useEffect(()=>{if(!unlockReaction)return;const timer=setTimeout(()=>setUnlockReaction(false),1200);return()=>clearTimeout(timer)},[unlockReaction]);
 useEffect(()=>{if(!saving&&failedBody===null)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue=''};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[saving,failedBody]);
 const entry=state.entries.find(e=>e.day===currentDay)??blank(currentDay),settings=state.settings;
 const habitNames=habitNamesFor(entry,settings.habits);
 const draftPreviousWeight=previousWeight(state.entries,draft.day),draftPreviousWalking=previousWalking(state.entries,draft.day);
 const allDays=state.entries.filter(hasRecord).length;
 const care=careFor(entry),visits=visitDays(state.entries);
 const companion=useMemo(()=>state.companion??newCompanion({...state,day:currentDay}),[state,currentDay]),companionPet=companion.pets[settings.species];
 const petExtras={design:companion.preferences.room,keepsake:companion.gifts.find(item=>item.id===companion.preferences.room.keepsakeId&&item.opened),hour,plant:plantStage(companionPet),bond:bondLevel(companionPet),personality:companionPet?.personality,voice:companion.preferences.voice,volume:companion.preferences.volume,haptics:companion.preferences.haptics};
 useEffect(()=>{if(loaded&&signedIn&&settings.onboardingComplete&&!entry.habitNames?.length&&!saving&&!error&&!pending.current)void save({kind:'daily-habits',day:currentDay},true)},[loaded,signedIn,settings.onboardingComplete,entry.habitNames,saving,error,currentDay,save]);
 useEffect(()=>{if(!loaded||!signedIn||!settings.onboardingComplete||error)return;const key=currentDay+':'+settings.species;if(visitedCompanion.current===key)return;visitedCompanion.current=key;void sendCompanion({action:'visit'}).then(ok=>{if(!ok)visitedCompanion.current=''})},[loaded,signedIn,settings.onboardingComplete,settings.species,error,currentDay,sendCompanion]);
 const panelsOpen=!care.finished&&(!care.resting||showRestRecords);
 useEffect(()=>{setShowRestRecords(false);setWelcome(welcomeKind(stateRef.current.entries,currentDay));setRecordSequence(0);setRecordMessage('')},[currentDay]);
 useEffect(()=>{if(loaded&&signedIn&&settings.onboardingComplete&&!entry.care?.visited&&!saving&&!error&&!pending.current)void save({kind:'care',day:currentDay,visited:true},true)},[loaded,signedIn,settings.onboardingComplete,entry.care?.visited,saving,error,currentDay,save]);
 const night=hour>=21||hour<6;
 const pose=demoPose??(unlockReaction?6:recordMessage.includes('足を休め')?2:celebrate?3:entry.mood===2?7:night?2:habitNames.every((_,i)=>entry.done.includes('h'+i))?5:entry.mood===0?4:0);
 const expressionLabel=(n:number)=>settings.outfit==='none'?expressionNames[n]:settings.outfit==='starlight'?({0:'にっこり',3:'ばんざい',2:'すやすや',6:'きらめき'} as Record<number,string>)[n]??'ばんざい':n===0?'にっこり':'よろこび';
 const message=care.finished?'今日はここまでで、花まる。会いに来てくれて、ありがとう。':demoPose!==null?`${expressionLabel(demoPose)}。いろんな顔で、そばにいるよ。`:unlockReaction?'わあ、新しいごほうびがひらいたよ！':recordMessage?recordMessage:celebrate?'ひとつ残せたね。自分を気にかける時間を、ありがとう。':dailyGreeting(companionPet,companion.preferences,entry.mood,welcomeText(welcome,hour));
 const room=rooms.find(r=>r.id===settings.room)??rooms[0];
 function prepareEntry(e:Entry,recordWeight=false,mode:'daily'|'weight'|'walking'|'note'='daily'){const candidate=weightDraft(stateRef.current.entries,e,recordWeight),walking=walkingDraft(stateRef.current.entries,e,mode==='walking'),stored=readDraft(draftScope,e.day,mode),saved=stored&&!(mode==='note'&&!stored.entry.note?.trim()&&e.note?.trim())?stored:null;savedDraft.current=false;setRestoredDraft(!!saved);setTimerAdded(null);setDraft({...saved?.entry??{...e,done:[...e.done]},habitNames:habitNamesFor(e,stateRef.current.settings.habits)});setWeight(saved?.weight??candidate.value);setWeightIncluded(saved?.weightIncluded??candidate.included);setWalkingMinutes(saved?.walkingMinutes??walking.value);setWalkingIncluded(saved?.walkingIncluded??walking.included);if(saved)setLetterNote(saved.letter)}
 function openEntry(e:Entry=entry,recordWeight=false){prepareEntry(e,recordWeight,recordWeight?'weight':'daily');setRecordMode(recordWeight?'weight':'daily');setEntryOpen(true)}
 function openWalking(e:Entry=entry){prepareEntry(e,false,'walking');setWalkingIncluded(true);setRecordMode('walking');setEntryOpen(true)}
 function openNote(e:Entry=entry){prepareEntry(e,false,'note');setRecordMode('note');setEntryOpen(true)}
 async function submitEntry(ev:React.FormEvent){
 ev.preventDefault();
 const num=weightIncluded?(weight.trim()===''?NaN:Number(weight)):null;
 const minutes=walkingIncluded?(walkingMinutes.trim()===''?NaN:Number(walkingMinutes)):null;
 if(!walkingOnly&&!noteOnly&&num!==null&&(!Number.isFinite(num)||num<1||num>500)){toast.error('体重は1〜500kgの範囲で入力してください。');return}
 if(!weightOnly&&!noteOnly&&minutes!==null&&(!Number.isInteger(minutes)||minutes<0||minutes>1440)){toast.error('ウォーキング時間は0〜1440分の整数で入力してください。');return}
 const savedEntry=stateRef.current.entries.find(e=>e.day===draft.day)??blank(draft.day);
 const next=noteOnly?{...savedEntry,note:draft.note??''}:weightOnly?{...savedEntry,weight:num}:walkingOnly?{...savedEntry,walkingMinutes:minutes}:{...draft,weight:num,walkingMinutes:minutes};
 if(await save({kind:'entry',...next})){savedDraft.current=true;clearDraft(draftScope,draft.day,recordMode);if(recordMode==='daily')for(const mode of ['note','weight','walking'] as const)clearDraft(draftScope,draft.day,mode);setEntryOpen(false)}
 }
 function changeDate(day:string){const e=state.entries.find(e=>e.day===day)??blank(day);prepareEntry(e,weightIncluded)}
 function saveCare(patch:CareDay){return save({kind:'care',day:currentDay,...patch},true)}
 function openGoal(){setGoalDraft(stateRef.current.settings.goal);setGoalOpen(true)}
 function openHub(page:HubPage){setHubPage(page);setHubOpen(true)}
 function openDetails(){setDetailDraft({...entry});setDetailsOpen(true)}
 async function setHabitProgress(index:number,progress:'todo'|'partial'|'done'){
  const latest=stateRef.current.entries.find(item=>item.day===currentDay)??blank(currentDay),id='h'+index;
  const done=latest.done.filter(value=>value!==id),partial=(latest.partial??[]).filter(value=>value!==id);
  if(progress==='done')done.push(id);if(progress==='partial')partial.push(id);
  return save({kind:'entry',...latest,done,partial},true);
 }
 function changeTab(value:string){setTab(value);window.scrollTo({top:0,behavior:'instant'})}
 function timedWalk(minutes:number){openWalking();setWalkingMinutes(String(Math.min(1440,(entry.walkingMinutes??0)+minutes)));setWalkingIncluded(true);setTimerAdded(minutes)}
 async function switchPet(species:Species){await commandQueue.current;return save({kind:'settings',...stateRef.current.settings,species,name:stateRef.current.companion?.pets[species]?.name??stateRef.current.settings.name},true)}
 async function bedtime(selfWords:string,tomorrow:string){if(!await sendCompanion({action:'bedtime',selfWords,tomorrow}))return false;if(!await saveCare({resting:true,finished:true}))return false;setLoungeOpen(true);return true}
 function openSettings(){setEditSettings({...settings,habits:[...settings.habits]});setSettingsOpen(true)}
 if(!signedIn)return <div className="login-wrap"><header className="brand"><span className="brand-mark"><PawPrint/></span>もちと、まいにち</header><main className="login-card"><div className="eyebrow">MY LITTLE COMPANION</div><Pet/><h1>きょうの小さな「できた」を、<br/>いっしょに。</h1><p>体重も、気分も、毎日の習慣も。<br/>あなたのペースを、もちが応援します。</p><Button className="login-button" asChild><a href={signInPath} target="_top"><LockKeyhole size={18}/>ChatGPTでログイン</a></Button><p className="privacy"><LockKeyhole size={14}/>招待された方だけの、プライベートな記録</p></main><a className="install-link" href={base+'install'}>ホーム画面への追加・使い方</a><footer className="login-footer">おやすみの日があっても、いつでもおかえり。</footer></div>;
 if(signedIn&&!loading&&loaded&&!settings.onboardingComplete)return <div className="onboarding"><Toaster position="top-center" theme="light"/><header className="brand"><span className="brand-mark"><PawPrint/></span>もちと、まいにち</header><main><p className="eyebrow">はじめまして、これからよろしくね</p><h1>まいにちを、一緒に過ごす相棒。</h1><p className="onboarding-copy">気になる子と、これからのゆるい目標を選んでね。<br/>名前も目標も、あとから変えられます。</p>{safariTab&&<p className="device-hint">ホーム画面から使うなら、先にホーム画面に追加してから始めてね。Safariとホーム画面のもちでは、記録が別々に保存されます。<a href={base+'install'}>追加のしかた</a></p>}{error&&<p className="error-banner" role="alert">{error}</p>}<form onSubmit={async e=>{e.preventDefault();if(await save({kind:'settings',...settings,species:chosenSpecies,name:chosenName.trim(),goal:chosenGoal.trim(),onboardingComplete:true},true))window.scrollTo({top:0,behavior:'instant'})}}><PetPicker value={chosenSpecies} onChange={setChosenSpecies} disabled={saving}/><div className="onboarding-name"><label className="field-label" htmlFor="first-pet-name">相棒の名前</label><Input id="first-pet-name" value={chosenName} required maxLength={12} onChange={e=>setChosenName(e.target.value)} disabled={saving}/><GoalPicker value={chosenGoal} onChange={setChosenGoal} disabled={saving}/><Button className="save-button" disabled={saving||!chosenName.trim()}>{saving?<LoaderCircle className="spin"/>:<PawPrint size={19}/>}この子とはじめる</Button></div></form><p className="kind-note">がんばる日も、おやすみの日も。いつも味方だよ。</p></main></div>;
 return <div className="app-shell focused-layout"><Toaster position="top-center" theme="light"/><header className="topbar"><a href={base} className="brand"><span className="brand-mark"><PawPrint/></span><span>もちと、まいにち<small>体調と、小さな習慣の記録</small></span></a><div className="header-right"><span className="private-tag"><LockKeyhole size={13}/>あなただけの記録</span><Button variant="ghost" size="icon" className="settings-button" aria-label="設定を開く" onClick={openSettings} disabled={loading||!loaded||saving||failedBody!==null}><SettingsIcon size={20}/></Button></div></header>
 <Tabs value={tab} onValueChange={changeTab} className="app-tabs"><TabsList className="main-nav" aria-label="メインメニュー"><TabsTrigger value="today"><House/>きょう</TabsTrigger><TabsTrigger value="history"><ChartNoAxesCombined/>ふりかえり</TabsTrigger><TabsTrigger value="companion"><PawPrint/>ふれあう</TabsTrigger><TabsTrigger value="rewards"><Gift/>ごほうび</TabsTrigger></TabsList>
 <main className="main-content"><div className="page-heading"><div><p className="date-line">{new Date(currentDay+'T12:00:00+09:00').toLocaleDateString('ja-JP',{month:'long',day:'numeric',weekday:'long',timeZone:'Asia/Tokyo'})}</p><h1>{tab==='today'?'きょうも、自分のペースで。':tab==='history'?'少しずつ、つづいてる。':tab==='companion'?'もちと、ふれあう。':'小さなできたが、たからもの。'}</h1></div><div className="star-total" aria-label={state.stars+"このおほしさま"}><Star size={19} fill="currentColor"/><strong>{state.stars}</strong><span>おほしさま</span></div></div>
 {offline&&!onDevice&&<p className="connection-banner" role="status">いまはオフラインです。記録の保存には接続が必要です。</p>}<span className="sr-only" role="status">{saving?'保存を確認しています…':recordSequence>0?'記録を保存しました':''}</span>{error&&<div className="error-banner" role="alert"><span>{error}</span>{!loading&&(failedBody!==null?<div className="retry-actions"><Button variant="outline" disabled={saving} onClick={()=>void save(failedBody)}>前の操作をもう一度保存</Button><small>未送信の入力はこの画面に残っています。閉じる前に保存してください。</small></div>:<Button variant="outline" onClick={load}>再読み込み</Button>)}</div>}
 {loading?<div className="loading-grid" aria-label="記録を読み込み中"><Skeleton className="h-96 rounded-3xl"/><Skeleton className="h-96 rounded-3xl"/></div>:<>
 <TabsContent value="today"><TodayView entry={entry} entries={state.entries} settings={settings} habitNames={habitNames} care={care} disabled={saving||!!error||!loaded} saving={saving} saved={recordSequence>0} recordsOpen={panelsOpen}
  pet={<PetPlayground species={settings.species} outfit={settings.outfit} name={settings.name} pose={care.finished?2:pose} message={message} resting={care.resting} quiet={care.quiet} minimal onInteract={interact} {...petExtras} design={undefined}/>}
  onGoal={openGoal} onMood={openDetails} onWeight={()=>openEntry(entry,true)} onWalking={()=>openWalking()} onNote={()=>openNote()} onHabit={setHabitOpen} onToggleHabit={(index,checked)=>void setHabitProgress(index,checked?'done':'todo')}
  onRest={()=>{setShowRestRecords(false);void saveCare({resting:!(care.resting||care.finished),finished:false})}}
  onResume={()=>{setShowRestRecords(true);if(care.finished)void saveCare({finished:false})}}/></TabsContent>
 <TabsContent value="companion"><div className="mochi-home">
  <section className="companion-card mochi-room" style={{backgroundColor:room.color}}><div className="companion-top"><span className="small-label"><Heart size={15}/>{settings.name}のお部屋</span><span className="room-label">{room.name}</span></div>
   <PetPlayground species={settings.species} outfit={settings.outfit} name={settings.name} pose={care.finished?2:pose} message={message} resting={care.resting} quiet={care.quiet} onInteract={interact} onLounge={()=>setLoungeOpen(true)} focusTools {...petExtras}/>

  </section>
  <div className="mochi-home-menu"><CompanionGateway onOpen={openHub} ready={companion.gifts.filter(item=>!item.opened&&item.available).length} quiet={care.quiet}/>
   <details className="interaction-memories"><summary>表情と、これまでのあしあと</summary>   <details className="expression-details"><summary>表情を見てみる</summary><div className="expression-buttons" aria-label="相棒の表情を見てみる">{(settings.outfit==='none'?[4,5,6,2]:settings.outfit==='starlight'?[0,3,2,6]:[0,1]).map(n=><button key={n} type="button" aria-pressed={demoPose===n} onClick={()=>setDemoPose(n)}>{expressionLabel(n)}</button>)}</div></details>
   <div className="companion-counts"><div className="together"><PawPrint size={18}/><span>会いに来た日</span><strong>{visits.length}<small>日</small></strong></div><div className="together record-together"><span>いっしょに記録した日</span><strong>{allDays}<small>日</small></strong></div></div></details>
  </div>
 </div></TabsContent>
 <TabsContent value="history"><HistoryView entries={state.entries} day={currentDay} weeklyDays={settings.weeklyDays} onEdit={openEntry} onWeight={()=>openEntry(entry,true)} onWalking={()=>openWalking()} onNote={openNote}/></TabsContent>
 <TabsContent value="rewards"><RewardGallery companion={companion} onPreview={setPreviewOutfit} onWishlist={wishlist=>void sendCompanion({action:'preference',patch:{wishlist}})} onReceive={id=>sendCompanion({action:'receipt',id})} settings={settings} stars={state.stars} disabled={saving||!!error||!loaded} onRoom={room=>save({kind:'settings',...stateRef.current.settings,room},true)} onEquip={async outfit=>{if(await save({kind:'settings',...stateRef.current.settings,outfit},true)){setCelebrate(true);toast.success('衣装に着替えたよ');return true}return false}} onMeet={async()=>{if(settings.outfit==='starlight'||await save({kind:'settings',...stateRef.current.settings,outfit:'starlight'},true)){setTab('companion');window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});setCelebrate(true);toast.success('特別なもちに会えたよ')}}}/></TabsContent>
 </>}
 </main></Tabs>
 <Dialog open={loungeOpen} onOpenChange={setLoungeOpen}><DialogContent className="app-dialog lounge-dialog" style={{backgroundColor:room.color}}><DialogTitle>もちと、ひと休み</DialogTitle><DialogDescription>何もしない時間も、一緒に。いつでも閉じられるよ。</DialogDescription><PetPlayground species={settings.species} outfit={settings.outfit} name={settings.name} pose={2} message="ここで、のんびり一緒に過ごそう。" resting quiet compact onInteract={interact} {...petExtras} onActivities={()=>{setLoungeOpen(false);openHub('rest')}}/></DialogContent></Dialog>

 <Dialog open={goalOpen} onOpenChange={setGoalOpen}><DialogContent className="app-dialog goal-dialog"><DialogTitle>これからの、ゆるい目標</DialogTitle><DialogDescription>途中で変えても、おやすみしても大丈夫。</DialogDescription><form onSubmit={async event=>{event.preventDefault();if(await save({kind:'settings',...stateRef.current.settings,goal:goalDraft.trim()}))setGoalOpen(false)}}>{goalOpen&&<GoalPicker value={goalDraft} onChange={setGoalDraft} disabled={saving}/>}<Button className="save-button" disabled={saving}>{saving?<LoaderCircle className="spin"/>:<Check size={18}/>}目標を保存する</Button></form></DialogContent></Dialog>
 <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}><DialogContent className="app-dialog"><DialogTitle>あなたと、相棒のこと</DialogTitle><DialogDescription>心地よく続けられる形にしよう。</DialogDescription><form onSubmit={async e=>{e.preventDefault();if(await save({kind:'settings',...editSettings}))setSettingsOpen(false)}}>{settingsOpen&&<GoalPicker value={editSettings.goal} onChange={goal=>setEditSettings({...editSettings,goal})} disabled={saving}/>}<div className="field-label">相棒の種類</div><PetPicker value={editSettings.species} onChange={species=>setEditSettings({...editSettings,species,name:companion.pets[species]?.name??editSettings.name})} disabled={saving}/><p className="support-copy">相棒を変えても、記録・おほしさま・衣装はそのまま。</p><label className="field-label" htmlFor="pet-name">相棒の名前</label><Input id="pet-name" value={editSettings.name} maxLength={12} required onChange={e=>setEditSettings({...editSettings,name:e.target.value})}/><p className="support-copy">小さな習慣は、毎日3つ届きます。できるものだけで大丈夫。</p><label className="switch-label" htmlFor="show-weight"><span>ホームに体重を表示</span><Switch id="show-weight" checked={editSettings.showWeight} onCheckedChange={v=>setEditSettings({...editSettings,showWeight:v})}/></label><p className="subtle">日本時間で日付が切り替わります。</p><Button className="save-button" disabled={saving}>{saving?<LoaderCircle className="spin"/>:<Check size={18}/>}保存する</Button></form><PilotTools screen={{today:'きょう',history:'ふりかえり',companion:'ふれあう',rewards:'ごほうび'}[tab]??tab} storage={storage}/><a className="install-link" href={base+'install'}>ホーム画面への追加・使い方</a><div className="account-footer"><LockKeyhole size={14}/><span>{onDevice?'記録はこの端末のブラウザの中にだけ保存されます。':'記録はログインした本人だけが見られます。'}</span></div>{!onDevice&&<a className="logout" href="/signout-with-chatgpt?return_to=%2F" target="_top"><LogOut size={15}/>ログアウト</a>}</DialogContent></Dialog>
 <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
 <DialogContent className={'app-dialog '+(singleFieldOnly?'weight-only-dialog ':'')+(weightOnly||walkingOnly?'numeric-record-dialog':'')}>
 <DialogTitle>{noteOnly?(draft.note?'メモを編集':'メモを書く'):walkingOnly?(draft.walkingMinutes!=null?'ウォーキング時間を編集':'ウォーキング時間を記録'):weightOnly?(draft.weight!==null?'体重を編集':'体重を記録'):draft.day===currentDay?'きょうの記録':draft.day.replaceAll('-',' / ')+'の記録'}</DialogTitle>
 <DialogDescription className={weightOnly||walkingOnly?'sr-only':undefined}>{noteOnly?'今日よかったこと、なんでも残してね。':walkingOnly?'ウォーキング時間の入力':weightOnly?'体重の入力':'どれかひとつだけでも、大丈夫。'}</DialogDescription>
 <form onSubmit={submitEntry}><div className="record-picker-content">{restoredDraft&&!weightOnly&&!walkingOnly&&<p className="draft-status">書きかけから、続けられるよ。</p>}{!draftStored&&<p className="form-error" role="status">下書きをこの端末に保存できませんでした。入力はこの画面に残っています。</p>}{timerAdded!==null&&walkingOnly&&<p className="support-copy">今回の{timerAdded}分を、今日の合計に足しています。保存前に分数を確かめてね。</p>}{!weightOnly&&!walkingOnly&&<WaitingPet species={settings.species} outfit={settings.outfit}/>}
 {singleFieldOnly?!walkingOnly&&<p className="weight-record-day">{new Date(draft.day+'T12:00:00+09:00').toLocaleDateString('ja-JP',{month:'long',day:'numeric',timeZone:'Asia/Tokyo'})}{noteOnly?'のメモ':'の体重'}</p>:<><label className="field-label" htmlFor="entry-day">日付</label><Input type="date" id="entry-day" required value={draft.day} min="2000-01-01" max={currentDay} onChange={e=>changeDate(e.target.value)}/></>}
 {!walkingOnly&&!noteOnly&&<WeightPicker value={weight} included={weightIncluded} previous={draftPreviousWeight} disabled={saving} optional={!weightOnly} onChange={setWeight} onIncludedChange={setWeightIncluded}/>}
 {!weightOnly&&!noteOnly&&<WalkingPicker value={walkingMinutes} included={walkingIncluded} previous={draftPreviousWalking} disabled={saving} optional={!walkingOnly} onChange={setWalkingMinutes} onIncludedChange={setWalkingIncluded}/>}
 {!singleFieldOnly&&<>
 <div className="field-label">気分</div><MoodPicker value={draft.mood} onChange={mood=>setDraft(previous=>({...previous,mood}))} disabled={saving}/>
 <div className="field-label">できた習慣</div>{habitNamesFor(draft,settings.habits).map((h,i)=><label className="draft-habit" key={i}><Checkbox checked={draft.done.includes('h'+i)} onCheckedChange={v=>setDraft({...draft,done:v?[...draft.done,'h'+i]:draft.done.filter(x=>x!=='h'+i)})}/>{h}</label>)}
 </>}
 {!singleFieldOnly&&<details className="draft-tags"><summary>気分の言葉・今日のタグ</summary><EntryDetails entry={draft} onChange={setDraft} disabled={saving}/></details>}{noteOnly&&<div className="note-help"><label className="inline-choice"><input type="checkbox" checked={letterNote} onChange={event=>setLetterNote(event.target.checked)}/>もちへのお手紙にする</label><details><summary>メモのきっかけがほしいとき</summary><div className="note-prompts">{notePrompts.map(prompt=><Button type="button" key={prompt} variant="outline" onClick={()=>setNoteHint(prompt)}>{prompt}</Button>)}</div></details></div>}{(!singleFieldOnly||noteOnly)&&<><label className="field-label" htmlFor="daily-note">自由メモ <span className="subtle">任意・2000文字まで</span></label>{noteOnly&&letterNote&&<p className="letter-to">{settings.name}へ</p>}<Textarea className={noteOnly&&letterNote?'letter-paper':''} id="daily-note" value={draft.note??''} disabled={saving} maxLength={2000} rows={4} placeholder={noteHint} onChange={e=>setDraft({...draft,note:e.target.value})}/><p className="subtle note-count">{(draft.note??'').length} / 2000</p></>}
 {error&&<p role="alert" className="form-error">{error}<br/>入力は残っています。下のボタンから再保存できます。</p>}
 </div><div className="record-save-footer"><Button className="save-button" disabled={saving||!draft.day}>{saving?<LoaderCircle className="spin"/>:<Check size={18}/>} {noteOnly?'メモを保存する':walkingOnly?'ウォーキング時間を保存する':weightOnly?'体重を保存する':'記録を保存する'}</Button></div>
 </form>
 </DialogContent></Dialog>
 <Dialog open={previewOutfit!==null} onOpenChange={open=>{if(!open)setPreviewOutfit(null)}}><DialogContent className="app-dialog outfit-fitting"><DialogTitle>{outfits.find(item=>item.id===previewOutfit)?.name}の試着</DialogTitle><DialogDescription>好きな衣装を、そっと試してみよう。</DialogDescription>{previewOutfit&&<><PetPlayground species={settings.species} outfit={previewOutfit} name={settings.name} pose={0} message="この姿も、気になるかな？" compact quiet {...petExtras}/><Button type="button" disabled={saving||!!error||(outfits.find(item=>item.id===previewOutfit)?.cost??Infinity)>state.stars} onClick={async()=>{if(await save({kind:'settings',...stateRef.current.settings,outfit:previewOutfit},true))setPreviewOutfit(null)}}>{(outfits.find(item=>item.id===previewOutfit)?.cost??Infinity)<=state.stars?'この衣装を着る':'ひらいたら、一緒に着ようね'}</Button><Button type="button" variant="ghost" onClick={()=>setPreviewOutfit(null)}>試着をおしまいにする</Button></>}</DialogContent></Dialog>
 <CompanionHub open={hubOpen} onOpenChange={setHubOpen} initialPage={hubPage} state={state} companion={companion} day={currentDay} hour={hour} scope={draftScope} disabled={saving||!!error} onCommand={sendCompanion} onInteract={interact} onWalking={timedWalk} onStretch={()=>setPartialOpen(true)} onNote={()=>openNote()} onSwitch={switchPet} onBedtime={bedtime}/>
 <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}><DialogContent className="app-dialog mood-only-dialog"><DialogTitle>いま、どんな気分？</DialogTitle><DialogDescription>今の自分に近いものを、ひとつ選んでね。</DialogDescription>
  <MoodPicker value={detailDraft.mood} onChange={mood=>setDetailDraft(previous=>({...previous,mood}))} disabled={saving||!!error}/>
  <details className="draft-tags"><summary>気分を言葉で残す・今日のタグ</summary><EntryDetails entry={detailDraft} onChange={setDetailDraft} disabled={saving||!!error}/></details>
  {error&&<p className="form-error" role="alert">{error} 入力は残っています。</p>}
  <Button className="save-button" disabled={saving||detailDraft.mood===null} onClick={async()=>{if(detailDraft.mood===null)return;const latest=stateRef.current.entries.find(item=>item.day===detailDraft.day)??blank(detailDraft.day);if(await save({kind:'entry',...latest,mood:detailDraft.mood,feelings:detailDraft.feelings??[],tags:detailDraft.tags??[]},true))setDetailsOpen(false)}}>{saving?<LoaderCircle className="spin"/>:<Check size={18}/>}気分を保存する</Button>
 </DialogContent></Dialog>
 <Dialog open={habitOpen!==null} onOpenChange={open=>{if(!open)setHabitOpen(null)}}><DialogContent className="app-dialog habit-progress-dialog"><DialogTitle>{habitOpen!==null?habitNames[habitOpen]:''}</DialogTitle><DialogDescription>今日できたところまで。途中でも、十分だよ。</DialogDescription><div className="habit-progress-options">{(['todo','partial','done'] as const).map(progress=>{const id='h'+habitOpen,current=entry.done.includes(id)?'done':entry.partial?.includes(id)?'partial':'todo';return <Button type="button" key={progress} variant={current===progress?'secondary':'outline'} aria-pressed={current===progress} disabled={saving||!!error} onClick={async()=>{if(habitOpen!==null&&await setHabitProgress(habitOpen,progress))setHabitOpen(null)}}>{progress==='todo'?'まだ・今日はおやすみ':progress==='partial'?'少しできた':<><Check size={17}/>できた</>}</Button>})}</div></DialogContent></Dialog>
 <Dialog open={partialOpen} onOpenChange={setPartialOpen}><DialogContent className="app-dialog"><DialogTitle>少しできた習慣を選ぶ</DialogTitle><DialogDescription>途中までの時間も、残せるよ。選んだものだけ保存します。</DialogDescription>{habitNames.map((habit,index)=><Button key={index} type="button" variant="outline" disabled={saving||!!error} onClick={async()=>{const latest=stateRef.current.entries.find(item=>item.day===currentDay)??blank(currentDay),id='h'+index;if(await save({kind:'entry',...latest,done:latest.done.filter(value=>value!==id),partial:[...new Set([...(latest.partial??[]),id])]},true))setPartialOpen(false)}}>{habit}を少しできた</Button>)}</DialogContent></Dialog>
 </div>
}
