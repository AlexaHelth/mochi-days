import type { State } from './mochi';
/** Bound reads and writes so poor reception never leaves the UI saving forever. */
export async function requestState(body?:unknown,timeoutMs=20000):Promise<State>{
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const response=await fetch('/api/state',body===undefined?{cache:'no-store',signal:controller.signal}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal});
  const data=await response.json() as State & {error?:string};
  if(!response.ok)throw new Error(data.error??'保存を確認できませんでした。もう一度お試しください。');
  return data as State;
 }catch(error){
  if(controller.signal.aborted)throw new Error('通信に時間がかかっています。保存結果を確認できませんでした。電波を確認して、もう一度保存してください。');
  if(error instanceof TypeError)throw new Error('通信できませんでした。電波を確認して、もう一度お試しください。');
  throw error;
 }finally{clearTimeout(timer)}
}
