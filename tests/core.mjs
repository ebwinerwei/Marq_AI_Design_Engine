import assert from 'node:assert/strict';
import fs from 'node:fs';
import {defaults,generate,parseIntent,validParams} from '../dist/pattern.js';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
const p=defaults(),a=generate(p);assert.deepEqual(a,generate(p));assert.equal(a.filter(x=>x===2).length,216);assert.notDeepEqual(a,generate({...p,seed:2402}));
const old=Array(864).fill(0);old[10]=-1;assert.equal(generate(p,old)[10],-1);assert.equal(generate({...p,density:0,middle:0}).filter(x=>x!==0).length,0);assert.equal(parseIntent('横、濃色率30%',p).params.style,'horizontal');assert.equal(parseIntent('横、濃色率30%',p).params.density,30);assert.equal(validParams({...p,cols:99999}),false);assert.equal(validParams({...p,base:'<script>'}),false);
const buffer=fs.readFileSync(new URL('./warehouse.fbx',import.meta.url));const model=new FBXLoader().parse(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');let count=0;model.traverse(o=>{if(o.isMesh){count++;assert.equal(o.geometry.attributes.position.count,36)}});assert.equal(count,1);console.log('PASS: deterministic patterns, exact cell quota, seed variation, protected cells, intent mapping, validation, ASCII FBX mesh parse (12 triangles).');
