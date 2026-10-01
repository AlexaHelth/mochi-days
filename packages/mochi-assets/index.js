export const speciesIds = ['dog','cat','penguin'];
export const pets = [{id:'dog',name:'こいぬ',description:'ふわふわの、やさしい相棒'},{id:'cat',name:'こねこ',description:'まあるい、甘えんぼの相棒'},{id:'penguin',name:'ペンギン',description:'ころんと、陽気な相棒'}];
export const outfitIds = ['none','bandana','ribbon','crown','cape','flower','nightcap','pumpkin','santa','bee','butterfly','strawberry','lemon','cherry','sunflower','hydrangea','mushroom','chef','baker','painter','detective','sailor','raincoat','winter','pajamas','astronaut','wizard','fairy','dragon','angel','ocean','festival','birthday','starlight'];

export const expressionNames = ['にっこり','うっとり','すやすや','ばんざい','ウインク','てれちゃう','びっくり','ひとやすみ'];
/** App-independent sprite coordinates; never contains reward or user data. */
export function petSprite(species,pose,outfit='none',baseUrl='/pets'){
 if(!speciesIds.includes(species))throw new RangeError('Unknown Mochi species');
 if(!outfitIds.includes(outfit))throw new RangeError('Unknown Mochi outfit');
 const safePose=Number.isInteger(pose)&&pose>=0&&pose<8?pose:0;
 const base=baseUrl.replace(/\/$/,'');
 if(outfit==='starlight')return {src:`${base}/${species}-special.png`,columns:2,rows:2,cell:[1,3,4,5].includes(safePose)?1:[2,7].includes(safePose)?2:safePose===6?3:0};
 if(outfit!=='none'){
  const index=outfitIds.indexOf(outfit)-1;
  const cell=(index%8)*2+Number([1,3,4,5].includes(safePose));
  const file=index<8?`${species}-wardrobe.png`:`${species}-rewards-${['garden','cozy','dream'][Math.floor((index-8)/8)]}.png`;
  return {src:`${base}/${file}`,columns:4,rows:4,cell};
 }
 if(species==='dog'&&safePose<4)return {src:`${base}/puppy.png`,columns:2,rows:2,cell:safePose};
 return {src:`${base}/${species}-expressions.png`,columns:4,rows:2,cell:safePose};
}
