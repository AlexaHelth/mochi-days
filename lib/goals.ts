/** Gentle intentions chosen by the person; these never change their habits or records automatically. */
export const goalOptions = [
  {id:'gentle',label:'ゆるく、元気に過ごす',text:'ゆるく、元気に過ごす',description:'できる日に、小さな「できた」をひとつ。'},
  {id:'walk-five',label:'まずは5分のおさんぽ',text:'できる日に、5分歩く',description:'近所をひとまわり。休む日があっても大丈夫。'},
  {id:'walk-week',label:'週3日、10分歩く',text:'週3日、10分のおさんぽ',description:'曜日は決めなくてもOK。自分のペースで。'},
  {id:'fresh-air',label:'外の空気を少し感じる',text:'できる日に、外の空気を少し感じる',description:'窓辺やベランダでも。外に出ない日があっても大丈夫。'},
  {id:'move-indoors',label:'家の中で、少し動く',text:'できる日に、家の中で少しからだを動かす',description:'立ち上がる、歩く、体をゆらす。好きな動きで。'},
  {id:'stretch',label:'1日1分、からだを伸ばす',text:'できる日に、1分ストレッチ',description:'朝でも、お風呂のあとでも。気持ちよい範囲で。'},
  {id:'sit-less',label:'座りっぱなしを少し減らす',text:'気づいたら立って、少しからだを動かす',description:'家事や移動のついでに、小さな一歩を。'},
  {id:'eat-slowly',label:'1日1食、ゆっくり食べる',text:'1日1食、いつもよりゆっくり食べる',description:'好きな一食から。味わう時間を大切に。'},
  {id:'drink-slowly',label:'飲みものをゆっくり一杯',text:'できる日に、飲みものをゆっくり一杯飲む',description:'水でもお茶でも、ひと息つける一杯を。'},
  {id:'postpartum',label:'産後ダイエットをゆっくり',text:'産後は回復を優先して、無理なく体を整える',description:'食事と休息も大切に。運動の再開は健診で相談しながら。'},
  {id:'cancer-prevention',label:'がん予防を意識した生活',text:'がん予防を意識して、生活習慣を少しずつ整える',description:'歩く・食事を整えるなど、できることから。',source:'https://ganjoho.jp/public/pre_scr/cause_prevention/evidence_based.html'},
  {id:'rest',label:'寝る前に5分、ひと休み',text:'寝る前に5分、自分を休ませる',description:'スマホを置いて、ゆっくりひと息。'},
  {id:'pause',label:'疲れたら、ひと息つく',text:'疲れを感じたら、少しひと息つく',description:'何も進めない時間も、大切な時間。'},
  {id:'mood-note',label:'気分をひと言、残す',text:'気が向いた日に、今の気分をひと言残す',description:'うれしいも、もやもやも。そのままの言葉で。'},
  {id:'favorite-time',label:'好きなことを少し楽しむ',text:'できる日に、好きなことを少し楽しむ',description:'音楽や読書、ただ眺める時間でも。'},
  {id:'tidy-one',label:'身の回りをひとつ整える',text:'できる日に、身の回りをひとつ整える',description:'机の上を少しだけ。今日はそのままでも大丈夫。'},
  {id:'mochi-time',label:'もちと、ひと息つく',text:'できる日に、もちとひと息つく',description:'会って眺めるだけでも、一緒の時間。'},
  {id:'later',label:'あとで決める',text:'',description:'今は決めなくても大丈夫。いつでも選び直せます。'},
  {id:'custom',label:'自分で選ぶ・入力する',text:'',description:'自分の言葉で、無理なくできそうな目標を書いてね。'},
] as const;

export function goalSelection(value:string){
  const found=goalOptions.findIndex(option=>option.id!=='custom'&&option.text===value);
  return found<0?goalOptions.length-1:found;
}
