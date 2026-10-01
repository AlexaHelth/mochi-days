/** Gentle intentions chosen by the person; these never change their habits or records automatically. */
export const goalOptions = [
  {id:'gentle',label:'ゆるく、元気に過ごす',text:'ゆるく、元気に過ごす',description:'できる日に、小さな「できた」をひとつ。'},
  {id:'walk-five',label:'まずは5分のおさんぽ',text:'できる日に、5分歩く',description:'近所をひとまわり。休む日があっても大丈夫。'},
  {id:'walk-week',label:'週3日、10分歩く',text:'週3日、10分のおさんぽ',description:'曜日は決めなくてもOK。自分のペースで。'},
  {id:'stretch',label:'1日1分、からだを伸ばす',text:'できる日に、1分ストレッチ',description:'朝でも、お風呂のあとでも。気持ちよい範囲で。'},
  {id:'sit-less',label:'座りっぱなしを少し減らす',text:'気づいたら立って、少しからだを動かす',description:'家事や移動のついでに、小さな一歩を。'},
  {id:'eat-slowly',label:'1日1食、ゆっくり食べる',text:'1日1食、いつもよりゆっくり食べる',description:'好きな一食から。味わう時間を大切に。'},
  {id:'postpartum',label:'産後ダイエットをゆっくり',text:'産後は回復を優先して、無理なく体を整える',description:'食事と休息も大切に。運動の再開は健診で相談しながら。'},
  {id:'cancer-prevention',label:'がん予防を意識した生活',text:'がん予防を意識して、生活習慣を少しずつ整える',description:'歩く・食事を整えるなど、できることから。',source:'https://ganjoho.jp/public/pre_scr/cause_prevention/evidence_based.html'},
  {id:'rest',label:'寝る前に5分、ひと休み',text:'寝る前に5分、自分を休ませる',description:'スマホを置いて、ゆっくりひと息。'},
  {id:'later',label:'あとで決める',text:'',description:'今は決めなくても大丈夫。いつでも選び直せます。'},
  {id:'custom',label:'自分で選ぶ・入力する',text:'',description:'自分の言葉で、無理なくできそうな目標を書いてね。'},
] as const;

export function goalSelection(value:string){
  const found=goalOptions.findIndex(option=>option.id!=='custom'&&option.text===value);
  return found<0?goalOptions.length-1:found;
}
