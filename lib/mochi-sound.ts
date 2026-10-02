import type { Species } from './mochi';
// Locally synthesized, optional sounds: no recordings, network requests or microphone.
export class MochiSound{
 private context:AudioContext|null=null;
 private nodes:AudioNode[]=[];
 private timers:ReturnType<typeof setInterval>[]=[];
 private master:GainNode|null=null;
 async start(ambient:'off'|'rain'|'sea'|'forest',music:boolean,volume:number,melody:'tea'|'moon'|'garden'='tea'){
  this.stop();
  if(ambient==='off'&&!music)return;
  const Audio=window.AudioContext??(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
  if(!Audio)throw new Error('この端末では音の再生に対応していません。');
  const context=this.context??new Audio();this.context=context;await context.resume();
  const master=context.createGain();master.gain.value=volume;master.connect(context.destination);this.master=master;this.nodes.push(master);
  if(ambient==='rain'||ambient==='sea'){
   const buffer=context.createBuffer(1,context.sampleRate*3,context.sampleRate),channel=buffer.getChannelData(0);
   let smooth=0;for(let i=0;i<channel.length;i++){smooth=(smooth+(Math.random()*2-1)*.12)/1.03;channel[i]=ambient==='sea'?smooth*.6:(Math.random()*2-1)*.11;}
   const source=context.createBufferSource();source.buffer=buffer;source.loop=true;
   const filter=context.createBiquadFilter();filter.type=ambient==='sea'?'lowpass':'highpass';filter.frequency.value=ambient==='sea'?550:1400;
   const gain=context.createGain();gain.gain.value=ambient==='sea'?.65:.28;
   source.connect(filter);filter.connect(gain);gain.connect(master);source.start();this.nodes.push(source,filter,gain);
   if(ambient==='sea'){const wave=context.createOscillator(),swell=context.createGain();wave.frequency.value=.09;swell.gain.value=.18;wave.connect(swell);swell.connect(gain.gain);wave.start();this.nodes.push(wave,swell);}
  }
  if(ambient==='forest'){this.chirp(1700,.3);this.timers.push(setInterval(()=>this.chirp(1300+Math.random()*900,.35),4300));}
  if(music){let chord=0;const play=()=>{const root=({tea:[261.63,220,174.61,196],moon:[174.61,146.83,130.81,164.81],garden:[293.66,261.63,220,196]})[melody][chord++%4];for(const ratio of [1,1.25,1.5])this.tone(root*ratio,3.9,.025,'sine');};play();this.timers.push(setInterval(play,4300));}
 }
 private tone(frequency:number,duration:number,gain:number,type:OscillatorType='sine',end?:number){
  const context=this.context,master=this.master;if(!context||!master)return;
  const oscillator=context.createOscillator(),envelope=context.createGain();oscillator.type=type;oscillator.frequency.value=frequency;
  if(end)oscillator.frequency.exponentialRampToValueAtTime(end,context.currentTime+duration);
  envelope.gain.setValueAtTime(.0001,context.currentTime);envelope.gain.exponentialRampToValueAtTime(gain,context.currentTime+.04);envelope.gain.exponentialRampToValueAtTime(.0001,context.currentTime+duration);
  oscillator.connect(envelope);envelope.connect(master);oscillator.start();oscillator.stop(context.currentTime+duration+.05);
  oscillator.onended=()=>{oscillator.disconnect();envelope.disconnect();};
 }
 private chirp(frequency:number,duration:number){this.tone(frequency,duration,.035,'sine',frequency*1.3)}
 async voice(species:Species,volume:number){
  if(!this.context){this.context=new AudioContext();}
  await this.context.resume();if(this.master)this.master.gain.value=volume;if(!this.master){this.master=this.context.createGain();this.master.gain.value=volume;this.master.connect(this.context.destination);this.nodes.push(this.master);}
  if(species==='dog'){this.tone(420,.18,.09,'triangle',270);this.tone(500,.35,.035,'sine',360);}
  else if(species==='cat')this.tone(570,.48,.055,'sine',320);
  else{this.tone(820,.12,.035,'sine',1100);this.tone(620,.28,.025,'sine',870);}
 }
 stop(){for(const timer of this.timers)clearInterval(timer);this.timers=[];for(const node of this.nodes){try{if('stop' in node)(node as OscillatorNode).stop();node.disconnect()}catch{}}this.nodes=[];this.master=null;}
 destroy(){this.stop();void this.context?.close();this.context=null;}
}
