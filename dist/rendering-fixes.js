import * as THREE from 'three';

const materialCache=new WeakMap();

// All arithmetic is done in JS doubles before the final normalized Float32 buffer.
// Prevent large CAD coordinates from being cancelled inside GPU float matrices.
export function normalizeStaticModel(source, targetSize=90) {
  source.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(source);
  const size=bounds.getSize(new THREE.Vector3()), max=Math.max(size.x,size.y,size.z);
  if(!Number.isFinite(max)||max<=1e-9)throw Error('モデル寸法が不正です');
  const center=bounds.getCenter(new THREE.Vector3()); center.y=bounds.min.y;
  const scale=targetSize/max, group=new THREE.Group(), seen=new Set();
  const report={meshes:0,triangles:0,duplicatesRemoved:0,degenerateRemoved:0,sourceMax:max,previewScale:scale};
  source.traverse(mesh=>{
    if(!mesh.isMesh)return;for(let ancestor=mesh;ancestor;ancestor=ancestor.parent){if(!ancestor.visible)return;}
    const src=mesh.geometry, idx=src.index, pos=src.attributes.position;
    const attributes=Object.fromEntries(Object.entries(src.attributes).filter(([name])=>!['skinIndex','skinWeight','tangent'].includes(name)).map(([name,a])=>[name,{itemSize:a.itemSize,array:[]}]));
    if(!attributes.normal)attributes.normal={itemSize:3,array:[]};
    const normalMatrix=new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld), mirrored=mesh.matrixWorld.determinant()<0;
    const geometry=new THREE.BufferGeometry();let offset=0,lastMat=-1;
    const vector=new THREE.Vector3(), vnormal=new THREE.Vector3();
    const count=idx?idx.count:pos.count;
    for(let i=0;i<count;i+=3){
      const indices=[0,1,2].map(k=>idx?idx.getX(i+k):i+k);if(mirrored)[indices[1],indices[2]]=[indices[2],indices[1]];
      const points=indices.map(j=>new THREE.Vector3().fromBufferAttribute(pos,j).applyMatrix4(mesh.matrixWorld).sub(center).multiplyScalar(scale));
      const face=new THREE.Vector3().subVectors(points[1],points[0]).cross(new THREE.Vector3().subVectors(points[2],points[0]));
      if(!points.every(v=>[v.x,v.y,v.z].every(Number.isFinite))||face.lengthSq()<1e-18){report.degenerateRemoved++;continue}
      const key=triangleKey(points);
      if(seen.has(key)){report.duplicatesRemoved++;continue}seen.add(key);face.normalize();
      const originalGroup=src.groups.find(g=>i>=g.start&&i<g.start+g.count),mi=originalGroup?.materialIndex||0;
      if(mi!==lastMat){geometry.addGroup(offset,0,mi);lastMat=mi}geometry.groups.at(-1).count+=3;
      indices.forEach((j,k)=>{for(const [name,out] of Object.entries(attributes)){
        if(name==='position'){out.array.push(...points[k].toArray());continue}
        if(name==='normal'){if(src.attributes.normal)vnormal.fromBufferAttribute(src.attributes.normal,j).applyMatrix3(normalMatrix).normalize();else vnormal.copy(face);out.array.push(...vnormal.toArray());continue}
        const a=src.attributes[name];for(let z=0;z<out.itemSize;z++)out.array.push(a.getComponent(j,z));
      }});offset+=3;report.triangles++;
    }
    if(!offset)return;
    for(const [name,a] of Object.entries(attributes))geometry.setAttribute(name,new THREE.Float32BufferAttribute(a.array,a.itemSize));
    geometry.computeBoundingBox();geometry.computeBoundingSphere();
    const original=(Array.isArray(mesh.material)?mesh.material:[mesh.material]).map(m=>m.clone());
    const neutral=original.map(()=>new THREE.MeshStandardMaterial({color:0xd5d7d5,roughness:.85,metalness:0,side:THREE.DoubleSide}));
    const result=new THREE.Mesh(geometry,neutral.length===1?neutral[0]:neutral);result.name=mesh.name||'Imported mesh';
    materialCache.set(result,{original,neutral});
    result.castShadow=true;result.receiveShadow=true;group.add(result);report.meshes++;
  });
  if(!report.triangles)throw Error('表示可能な三角形がありません');
  return {group,report};
}
export function triangleKey(points){return points.map(p=>[p.x,p.y,p.z].map(x=>Math.round(x*1e6)).join(',')).sort().join('|')}
export function applyMaterialMode(group, original=false){group.traverse(m=>{const cache=materialCache.get(m);if(!cache)return;const list=original?cache.original:cache.neutral;m.material=list.length===1?list[0]:list})}
export function patternMaterial(texture){return new THREE.MeshStandardMaterial({map:texture,color:0xffffff,roughness:.85,metalness:0,transparent:false,alphaTest:.5,depthTest:true,depthWrite:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,side:THREE.DoubleSide});}
export function fitCameraRange(camera,size=90){camera.near=Math.max(.2,size/300);camera.far=Math.max(500,size*6);camera.updateProjectionMatrix()}
