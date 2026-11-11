import fs from 'node:fs';import assert from 'node:assert/strict';import * as T from 'three';
import {FBXLoader} from '../dist/vendor/addons/loaders/FBXLoader.js';import {GLTFLoader} from '../dist/vendor/addons/loaders/GLTFLoader.js';import {normalizeStaticModel} from '../dist/rendering-fixes.js';
T.TextureLoader.prototype.load=function(){return new T.Texture()};globalThis.window={URL:globalThis.URL};globalThis.ProgressEvent=class {constructor(type,init){this.type=type;Object.assign(this,init)}};
const [fbx,glb]=process.argv.slice(2);if(!fbx||!glb)throw Error('Usage: node tests/validate-building.mjs source.fbx repaired.glb');
function bytes(p){const b=fs.readFileSync(p);return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}
const original=new FBXLoader().parse(bytes(fbx),'');assert.equal(original.userData.upAxis,2);assert.equal(original.userData.unitScaleFactor,.1);
const a=normalizeStaticModel(original);const ab=new T.Box3().setFromObject(a.group);assert.equal(a.report.axisConverted,true);assert.equal(a.report.duplicatesRemoved,16477);assert.ok(Math.abs(ab.min.y)<1e-4);assert.ok(Math.abs(ab.max.y-31490/65085*90)<1e-4);
const repaired=(await new GLTFLoader().parseAsync(bytes(glb),'')).scene;let count=0,facades=[];repaired.traverse(m=>{if(!m.isMesh)return;count+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;if(m.name.startsWith('Facade_'))facades.push(m)});
assert.equal(facades.length,4);for(const m of facades){const n=m.geometry.attributes.normal;for(let i=0;i<n.count;i++)assert.ok(Math.abs(n.getY(i))<1e-5)}
const b=normalizeStaticModel(repaired);const bb=new T.Box3().setFromObject(b.group);assert.equal(b.report.axisConverted,false);assert.equal(b.report.duplicatesRemoved,0);assert.ok(Math.abs(bb.max.y-ab.max.y)<1e-4);assert.ok(count<487260);
console.log(JSON.stringify({FBX:a.report,GLB:b.report,GLBTriangles:count,facades:facades.map(m=>m.name),normalizedBounds:[bb.min.toArray(),bb.max.toArray()]},null,2));
