export const speciesIds = ['dog','cat','penguin'];
export const pets = [{id:'dog',name:'こいぬ',description:'ふわふわの、やさしい相棒'},{id:'cat',name:'こねこ',description:'まあるい、甘えんぼの相棒'},{id:'penguin',name:'ペンギン',description:'ころんと、陽気な相棒'}];
export const outfitIds = ['none','bandana','ribbon','crown','cape','flower','nightcap','pumpkin','santa'];

export const expressionNames = ['にっこり','うっとり','すやすや','ばんざい','ウインク','てれちゃう','びっくり','ひとやすみ'];
/** App-independent sprite coordinates; never contains reward or user data. */
export function petSprite(species,pose,outfit='none',baseUrl='/pets'){
 if(!speciesIds.includes(species))throw new RangeError('Unknown Mochi species');
 if(!outfitIds.includes(outfit))throw new RangeError('Unknown Mochi outfit');
 const safePose=Number.isInteger(pose)&&pose>=0&&pose<8?pose:0;
 const base=baseUrl.replace(/\/$/,'');
 if(outfit!=='none'){
  const index=outfitIds.indexOf(outfit)-1;
  const cell=index*2+Number([1,3,4,5].includes(safePose));
  return {src:`${base}/${species}-wardrobe.png`,columns:4,rows:4,cell};
 }
 if(species==='dog'&&safePose<4)return {src:`${base}/puppy.png`,columns:2,rows:2,cell:safePose};
 return {src:`${base}/${species}-expressions.png`,columns:4,rows:2,cell:safePose};
}
