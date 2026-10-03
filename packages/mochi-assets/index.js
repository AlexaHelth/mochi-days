export const speciesIds = ['dog','cat','penguin'];
export const pets = [{id:'dog',name:'こいぬ',description:'ふわふわの、やさしい相棒'},{id:'cat',name:'こねこ',description:'まあるい、甘えんぼの相棒'},{id:'penguin',name:'ペンギン',description:'ころんと、陽気な相棒'}];
export const outfitIds = ['none','bandana','ribbon','crown','cape','flower','nightcap','pumpkin','santa','bee','butterfly','strawberry','lemon','cherry','sunflower','hydrangea','mushroom','chef','baker','painter','detective','sailor','raincoat','winter','pajamas','astronaut','wizard','fairy','dragon','angel','ocean','festival','birthday','starlight'];

export const expressionNames = ['にっこり','うっとり','すやすや','ばんざい','ウインク','てれちゃう','びっくり','ひとやすみ'];

// Reviewed pixel bounds: the painted illustrations do not all follow an equal grid.
const spriteFrames = {
 "cat-rewards-cozy.png":{width:1254,height:1254,cells:[[0,0,313,325],[313,0,314,333],[627,0,313,326],[940,0,314,330],[0,325,313,314],[313,333,314,312],[627,326,313,314],[940,330,314,315],[0,639,313,313],[313,645,314,309],[627,640,313,314],[940,645,314,310],[0,952,313,302],[313,954,314,300],[627,954,313,300],[940,955,314,299]]},
 "cat-rewards-dream.png":{width:1254,height:1254,cells:[[0,0,313,313],[313,0,314,313],[627,0,313,313],[940,0,314,313],[0,313,313,314],[313,313,314,315],[627,313,313,314],[940,313,314,314],[0,627,313,313],[313,628,314,312],[627,627,313,313],[940,627,314,313],[0,940,314,314],[314,940,314,314],[628,940,312,314],[940,940,314,314]]},
 "cat-rewards-garden.png":{width:1254,height:1254,cells:[[0,0,313,313],[313,0,314,313],[627,0,313,313],[940,0,314,313],[0,313,313,314],[313,313,314,314],[627,313,313,314],[940,313,314,314],[0,627,313,309],[313,627,314,308],[627,627,313,313],[940,627,314,312],[0,936,313,318],[313,935,314,319],[627,940,313,314],[940,939,314,315]]},
 "cat-wardrobe.png":{width:1254,height:1254,cells:[[0,0,313,313],[313,0,314,313],[627,0,313,314],[940,0,314,313],[0,313,313,315],[313,313,314,315],[627,314,313,315],[940,313,314,314],[0,628,313,312],[313,628,314,312],[627,629,313,311],[940,627,314,313],[0,940,313,314],[313,940,314,314],[627,940,313,314],[940,940,314,314]]},
 "dog-rewards-cozy.png":{width:1254,height:1254,cells:[[0,0,313,319],[313,0,314,318],[627,0,313,321],[940,0,314,320],[0,319,313,308],[313,318,314,304],[627,321,313,306],[940,320,314,304],[0,627,314,293],[314,622,313,292],[627,627,313,302],[940,624,314,299],[0,920,313,334],[313,914,314,340],[627,929,313,325],[940,923,314,331]]},
 "dog-rewards-dream.png":{width:1254,height:1254,cells:[[0,0,314,320],[314,0,313,320],[627,0,313,322],[940,0,314,323],[0,320,316,310],[316,320,311,311],[627,322,313,312],[940,323,314,311],[0,630,316,313],[316,631,311,311],[627,634,313,306],[940,634,314,304],[0,943,313,311],[313,942,314,312],[627,940,313,314],[940,938,314,316]]},
 "dog-rewards-garden.png":{width:1254,height:1254,cells:[[0,0,313,324],[313,0,314,325],[627,0,313,323],[940,0,314,324],[0,324,317,303],[317,325,310,302],[627,323,313,305],[940,324,314,305],[0,627,318,305],[318,627,309,305],[627,628,313,304],[940,629,314,301],[0,932,316,322],[316,932,311,322],[627,932,313,322],[940,930,314,324]]},
 "dog-wardrobe.png":{width:1254,height:1254,cells:[[0,0,316,316],[316,0,311,313],[627,0,313,316],[940,0,314,316],[0,316,314,311],[314,313,313,314],[627,316,313,311],[940,316,314,310],[0,627,317,297],[317,627,310,293],[627,627,313,296],[940,626,314,293],[0,924,313,330],[313,920,314,334],[627,923,313,331],[940,919,314,335]]},
 "penguin-rewards-cozy.png":{width:1254,height:1254,cells:[[0,0,313,313],[313,0,314,313],[627,0,313,313],[940,0,314,313],[0,313,313,310],[313,313,314,304],[627,313,313,314],[940,313,314,314],[0,623,313,292],[313,617,314,298],[627,627,313,303],[940,627,314,301],[0,915,313,339],[313,915,314,339],[627,930,313,324],[940,928,314,326]]},
 "penguin-rewards-dream.png":{width:1254,height:1254,cells:[[0,0,313,313],[313,0,314,313],[627,0,313,313],[940,0,314,313],[0,313,313,312],[313,313,314,314],[627,313,313,312],[940,313,314,314],[0,625,313,304],[313,627,314,301],[627,625,313,291],[940,627,314,284],[0,929,313,325],[313,928,314,326],[627,916,313,338],[940,911,314,343]]},
 "penguin-rewards-garden.png":{width:1254,height:1254,cells:[[0,0,313,313],[313,0,314,313],[627,0,313,313],[940,0,314,313],[0,313,313,314],[313,313,314,314],[627,313,313,311],[940,313,314,312],[0,627,313,308],[313,627,314,308],[627,624,313,310],[940,625,314,310],[0,935,313,319],[313,935,314,319],[627,934,313,320],[940,935,314,319]]},
 "penguin-wardrobe.png":{width:1254,height:1254,cells:[[0,0,313,313],[313,0,314,313],[627,0,313,313],[940,0,314,313],[0,313,313,314],[313,313,314,314],[627,313,313,312],[940,313,314,314],[0,627,313,290],[313,627,314,290],[627,625,313,290],[940,627,314,290],[0,917,313,337],[313,917,314,337],[627,915,313,339],[940,917,314,337]]},
};
/** Keep neighboring artwork outside the painted frame; leave the original PNGs intact. */
export function petFrame(sprite){
 const sheet=spriteFrames[sprite.src.split('/').pop()],cell=sheet?.cells[sprite.cell];
 if(!cell)return null;
 return {x:cell[0],y:cell[1],width:cell[2],height:cell[3],sheetWidth:sheet.width,sheetHeight:sheet.height};
}

// Keep sprite coordinates anchored to the original PNG; opt in to alpha only where needed.
export function petImageSource(sprite,transparent=false){
 return sprite.src.replace(/\.png$/,transparent?'-interaction.webp':'.webp');
}

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
