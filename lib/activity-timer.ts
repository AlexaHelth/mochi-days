export type TimerData={kind:'walk'|'stretch';seconds:number;started:number|null};
export function timerElapsed(data:TimerData,now=Date.now()){return Math.min(86400,data.seconds+(data.started===null?0:Math.max(0,(now-data.started)/1000)));}
export function pausedTimer(data:TimerData,now=Date.now()):TimerData{return {...data,seconds:timerElapsed(data,now),started:null};}
export function readTimer(raw:string|null):TimerData{
 try{const value=JSON.parse(raw??'null');if(value&&['walk','stretch'].includes(value.kind)&&typeof value.seconds==='number'&&Number.isFinite(value.seconds)&&value.seconds>=0&&value.seconds<=86400&&(value.started===null||typeof value.started==='number'&&Number.isFinite(value.started)&&value.started>=0))return value;}catch{}
 return {kind:'walk',seconds:0,started:null};
}
