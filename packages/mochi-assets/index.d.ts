export const speciesIds: readonly ['dog','cat','penguin'];
export type Species = typeof speciesIds[number];
export const outfitIds: readonly ['none','bandana','ribbon','crown','cape','flower','nightcap','pumpkin','santa','bee','butterfly','strawberry','lemon','cherry','sunflower','hydrangea','mushroom','chef','baker','painter','detective','sailor','raincoat','winter','pajamas','astronaut','wizard','fairy','dragon','angel','ocean','festival','birthday','starlight'];
export type Outfit = typeof outfitIds[number];
export const pets: readonly {id:Species;name:string;description:string}[];
export const expressionNames: readonly string[];
export function petSprite(species:Species,pose:number,outfit?:Outfit,baseUrl?:string):{src:string;columns:number;rows:number;cell:number};
