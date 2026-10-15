'use client';
import { useRef, useState } from 'react';
import { FileUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MAX_BACKUP_BYTES, inspectDeviceBackup, deviceRecordsSnapshot, restoreDeviceRecords, deleteDeviceRecords } from '@/lib/device-store';

export function DeviceDataTools({disabled=false,onBeforeChange,onChangeFailed}:{disabled?:boolean;onBeforeChange:()=>Promise<void>;onChangeFailed:()=>void}){
 const [mode,setMode]=useState<'restore'|'delete'|null>(null),[raw,setRaw]=useState(''),[summary,setSummary]=useState<ReturnType<typeof inspectDeviceBackup>|null>(null),[confirmed,setConfirmed]=useState(false),[word,setWord]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const snapshot=useRef<string|null>(null),sequence=useRef(0);
 function open(next:'restore'|'delete'){
  try{snapshot.current=deviceRecordsSnapshot();sequence.current++;setRaw('');setSummary(null);setConfirmed(false);setWord('');setMessage('');setMode(next)}catch{setMessage('保存内容を確認できませんでした。ブラウザの保存設定を確認してください。')}
 }
 function close(){if(busy)return;sequence.current++;setRaw('');setSummary(null);setConfirmed(false);setMessage('');setMode(null)}
 async function select(file:File|undefined){
  const id=++sequence.current;setRaw('');setSummary(null);setConfirmed(false);setMessage('');
  if(!file)return;
  if(file.size>MAX_BACKUP_BYTES){setMessage('ファイルが大きすぎます。25MB以内のバックアップを選んでください。');return}
  setBusy(true);
  try{const text=await file.text();if(id!==sequence.current)return;const next=inspectDeviceBackup(text);snapshot.current=deviceRecordsSnapshot();setRaw(text);setSummary(next)}catch{if(id===sequence.current)setMessage('このアプリの有効なバックアップを選んでください。今の記録は変更していません。')}finally{if(id===sequence.current)setBusy(false)}
 }
 async function commit(){
  if(disabled||busy||!confirmed||(mode==='restore'&&!summary)||(mode==='delete'&&word!=='削除'))return;
  setBusy(true);setMessage('');
  try{
   await onBeforeChange();
   if(mode==='restore'){
    const result=restoreDeviceRecords(raw,snapshot.current);
    if(!result.draftsCleared)window.alert('記録は復元しましたが、一部の下書きを消せませんでした。ブラウザの保存設定を確認してください。');
   }else deleteDeviceRecords(snapshot.current);
   // Full navigation discards old React state and pending timer/editor callbacks.
   window.location.reload();
  }catch(error){onChangeFailed();setMessage(error instanceof Error?error.message:'記録を変更できませんでした。');setBusy(false)}
 }
 return <><div className="pilot-tools"><Button variant="outline" disabled={disabled} onClick={()=>open('restore')}><FileUp size={17}/>バックアップから復元</Button><Button variant="ghost" disabled={disabled} onClick={()=>open('delete')}><Trash2 size={17}/>この端末の記録を削除</Button></div>{!mode&&message&&<p role="alert">{message}</p>}
 <Dialog open={mode!==null} onOpenChange={value=>{if(!value)close()}}><DialogContent className="app-dialog"><DialogTitle>{mode==='restore'?'バックアップから復元':'この端末の記録を削除'}</DialogTitle><DialogDescription>{mode==='restore'?'このアプリから書き出したJSONファイルを選んでください。ファイルは外部へ送信しません。':'もちと、まいにちの記録・相棒・おほしさま・下書き・タイマーを、このブラウザから削除します。'}</DialogDescription>
 {mode==='restore'?<><Input type="file" accept=".json,application/json" aria-label="復元するバックアップ" disabled={busy||disabled} onChange={event=>void select(event.target.files?.[0])}/>{summary&&<p role="status">相棒：{summary.name} ／ 記録：{summary.days}日 ／ おほしさま：{summary.stars}こ</p>}<p>復元すると、今の記録はバックアップの内容に置き換わります。必要なら先に今の記録を書き出してください。</p></>:<><p>この操作は元に戻せません。必要なら先に記録を書き出してください。ダウンロード済みのファイルや、別のブラウザの記録は消えません。</p><label className="field-label" htmlFor="delete-records-confirm">確認のため「削除」と入力してください</label><Input id="delete-records-confirm" value={word} disabled={busy||disabled} onChange={event=>setWord(event.target.value)} autoComplete="off"/></>}
 <label className="switch-label"><Checkbox checked={confirmed} disabled={busy||disabled||(mode==='restore'&&!summary)} onCheckedChange={value=>setConfirmed(value===true)}/><span>{mode==='restore'?'今の記録が置き換わることを確認しました':'記録が消えることを確認しました'}</span></label>
 {message&&<p role="alert">{message}</p>}<Button variant={mode==='delete'?'destructive':'default'} disabled={disabled||busy||!confirmed||(mode==='restore'?!summary:word!=='削除')} onClick={()=>void commit()}>{busy?'確認しています…':mode==='restore'?'このバックアップで復元する':'この端末の記録をすべて削除する'}</Button><Button variant="outline" disabled={busy} onClick={close}>キャンセル</Button>
 </DialogContent></Dialog></>;
}
