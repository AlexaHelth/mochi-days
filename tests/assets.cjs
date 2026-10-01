const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
(async()=>{
 const root=path.resolve('packages/mochi-assets');
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
 const shared=await import('../packages/mochi-assets/index.js');
 const names=new Set(manifest.assets.map(a=>a.file));
 assert.deepEqual([...names].sort(),fs.readdirSync(path.join(root,'assets')).filter(n=>n.endsWith('.png')).sort());
 assert.equal(manifest.version,JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version);
 for(const asset of manifest.assets){
  const source=fs.readFileSync(path.join(root,'assets',asset.file));
  assert.equal(source.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(source.readUInt32BE(16),asset.width);assert.equal(source.readUInt32BE(20),asset.height);
  assert.equal(crypto.createHash('sha256').update(source).digest('hex'),asset.sha256);
  assert.deepEqual(source,fs.readFileSync(path.join('public/pets',asset.file)));
 }
 assert.deepEqual(fs.readFileSync('public/puppy.png'),fs.readFileSync(path.join(root,'assets/puppy.png')));
 for(const species of shared.speciesIds)for(const outfit of shared.outfitIds)for(let pose=0;pose<8;pose++){
  const sprite=shared.petSprite(species,pose,outfit);const file=path.basename(sprite.src);
  assert.ok(names.has(file),`Missing ${file}`);
  const asset=manifest.assets.find(a=>a.file===file);
  assert.equal(asset.width/sprite.columns,asset.height/sprite.rows,'Sprite cells must be square');
  assert.ok(sprite.cell>=0&&sprite.cell<sprite.columns*sprite.rows);
 }
 assert.equal(shared.petSprite('cat',3,'flower','/shared/mochi/').src,'/shared/mochi/cat-wardrobe.png');
 for(const species of shared.speciesIds){
  const used=new Set();
  for(const outfit of shared.outfitIds.filter(id=>id!=='none'&&id!=='starlight'))for(const pose of [0,3]){
   const sprite=shared.petSprite(species,pose,outfit),key=sprite.src+':'+sprite.cell;
   assert.ok(!used.has(key),`Repeated illustration for ${species}/${outfit}/${pose}`);used.add(key);
  }
  assert.equal(used.size,64,'Each species has 32 distinct outfits with two illustrations');
  const special=[0,3,2,6].map(pose=>shared.petSprite(species,pose,'starlight'));
  assert.equal(new Set(special.map(sprite=>sprite.src+':'+sprite.cell)).size,4);
  assert.equal(special[0].src,`/pets/${species}-special.png`);
 }
 assert.throws(()=>shared.petSprite('dragon',0),RangeError);
 console.log('PASS: standalone ESM package, version, PNG dimensions, hashes, all asset copies, original puppy preserved, every sprite cell and custom asset base URL.');
})().catch(e=>{console.error(e);process.exitCode=1});
