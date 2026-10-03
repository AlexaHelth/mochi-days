import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('.',import.meta.url));
const target=resolve(process.argv[2]??'public');
const check=process.argv.includes('--check');
const manifest=JSON.parse(await readFile(join(root,'manifest.json'),'utf8'));
for(const asset of [...manifest.assets,...(manifest.webAssets??[]),...(manifest.interactionAssets??[])]){
 if(!/^[a-z0-9-]+\.(png|webp)$/.test(asset.file))throw new Error('Invalid asset path');
 const src=join(root,asset.file.endsWith('.webp')?'web':'assets',asset.file),dest=join(target,'pets',asset.file);
 const bytes=await readFile(src);
 if(createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw new Error(`Source hash mismatch: ${asset.file}`);
 if(check){if(!(await readFile(dest)).equals(bytes))throw new Error(`Asset differs: ${dest}`)}
 else{await mkdir(join(target,'pets'),{recursive:true});await copyFile(src,dest)}
}
console.log(`${check?'Verified':'Copied'} ${manifest.assets.length} original, ${manifest.webAssets?.length??0} web and ${manifest.interactionAssets?.length??0} transparent interaction Mochi assets (${manifest.version})`);
