import assert from 'node:assert/strict';
import * as T from 'three';
import {normalizeStaticModel,applyMaterialMode,patternMaterial,fitCameraRange} from '../dist/rendering-fixes.js';
const root=new T.Group();
const geo=new T.PlaneGeometry(10000,6000);const original=new T.MeshPhongMaterial({color:0x000000});original.map=new T.Texture();
const a=new T.Mesh(geo,original);a.position.set(100000000,0,300000000);root.add(a);
const duplicate=a.clone();duplicate.material=original.clone();root.add(duplicate);
const {group,report}=normalizeStaticModel(root);
assert.equal(report.duplicatesRemoved,2);assert.equal(report.triangles,2);assert.equal(group.children.length,1);
const m=group.children[0];assert.equal(m.material.map,null);assert.equal(m.material.color.getHex(),0xd5d7d5);assert.equal(m.geometry.attributes.position.getX(0),-45);
applyMaterialMode(group,true);assert.ok(m.material.map);applyMaterialMode(group,false);assert.equal(m.material.map,null);
const mat=patternMaterial(new T.Texture());assert.equal(mat.transparent,false);assert.equal(mat.depthWrite,true);assert.equal(mat.polygonOffset,true);assert.equal(mat.alphaTest,.5);
const c=new T.PerspectiveCamera();fitCameraRange(c);assert.equal(c.near,.3);assert.equal(c.far,540);
// Shared indexed vertices split into stable per-face attributes; geometry groups retained.
const multi=new T.Mesh(new T.BoxGeometry(10,4,8),Array.from({length:6},()=>new T.MeshPhongMaterial()));multi.scale.x=-1;
const res=normalizeStaticModel(multi);assert.equal(res.report.triangles,12);assert.equal(res.group.children[0].geometry.groups.length,6);
assert.ok([...res.group.children[0].geometry.attributes.normal.array].every(Number.isFinite));
// Source coordinates and material are unchanged.
assert.equal(a.position.x,100000000);assert.equal(a.material,original);assert.equal(root.children.length,2);
console.log('PASS: duplicate CAD triangles, georeferenced coordinate rebasing, neutral/original material switch, opaque cutout depth policy, camera range, mirrored transforms/material groups, source preservation.');

// FBX Z-up must become Y-up, preserving the original source transform.
const zUp=new T.Group();zUp.userData.upAxis=2;zUp.userData.upAxisSign=1;
const box=new T.Mesh(new T.BoxGeometry(55,65,31),new T.MeshStandardMaterial());box.position.z=15.5;zUp.add(box);
const upright=normalizeStaticModel(zUp);const uprightBounds=new T.Box3().setFromObject(upright.group);
assert.ok(Math.abs(uprightBounds.min.y)<1e-5);assert.ok(Math.abs(uprightBounds.max.y-31*90/65)<1e-5);
assert.equal(upright.report.axisConverted,true);assert.equal(box.position.z,15.5);assert.equal(zUp.rotation.x,0);
console.log('PASS: FBX Z-up conversion, ground alignment and original preservation.');
