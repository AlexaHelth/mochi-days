'use client';
import {useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {MessageSquare,Copy,Check,Download} from 'lucide-react';
import {toast} from 'sonner';
import {exportDeviceRecords} from '@/lib/device-store';
export function PilotTools({screen,storage='server'}:{screen:string;storage?:'server'|'device'}){
 const [open,setOpen]=useState(false),[text,setText]=useState(''),[copied,setCopied]=useState(false),[hint,setHint]=useState('');
 const field=useRef<HTMLTextAreaElement>(null);
 function start(){
  const mode=window.matchMedia('(display-mode: standalone)').matches||(navigator as Navigator&{standalone?:boolean}).standalone?'ホーム画面から':'ブラウザから';
  setText(`もちと、まいにち — 気づいたこと\n画面：${screen}\n開き方：${mode}\n機種・iOS：\n何をしたら：\nどうなった：\nこうなると思った：\n毎回／ときどき：\n`);setCopied(false);setHint('');setOpen(true);
 }
 async function copy(){try{await navigator.clipboard.writeText(text);setCopied(true);setHint('コピーしました。LINEなどに貼り付けて送れます。')}catch{field.current?.focus();field.current?.select();setHint('コピーできませんでした。文章を長押ししてコピーしてください。')}}
 function download(){try{const file=exportDeviceRecords(),url=URL.createObjectURL(file),link=document.createElement('a');link.href=url;link.download=file.name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}catch{toast.error('記録を書き出せませんでした。')}}
 return <><div className="pilot-tools"><Button variant="outline" onClick={start}><MessageSquare size={17}/>気づいたことをメモ</Button>{storage==='device'?<Button variant="outline" onClick={download}><Download size={17}/>自分の記録を書き出す</Button>:<Button variant="outline" asChild><a href="/api/export" download><Download size={17}/>自分の記録を書き出す</a></Button>}</div><p className="subtle pilot-note">書き出しには体重・メモも含まれます。共有先を確認してね。</p><Dialog open={open} onOpenChange={setOpen}><DialogContent className="app-dialog"><DialogTitle>気づいたことを教えてね</DialogTitle><DialogDescription>文章をコピーして、アプリを用意した人に送れます。自動では送信しません。</DialogDescription><Textarea ref={field} aria-label="気づいたこと" value={text} onChange={e=>{setText(e.target.value);setCopied(false)}} maxLength={4000} rows={10}/><p className="subtle">体重や相棒の名前、メールアドレスは自動で入りません。スクショを送るときも、見せたくない部分は隠してね。</p><Button onClick={copy}>{copied?<Check size={18}/>:<Copy size={18}/>}文章をコピー</Button><p className="subtle" role="status">{hint}</p></DialogContent></Dialog></>;
}
