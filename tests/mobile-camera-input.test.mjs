import test from 'node:test';
import assert from 'node:assert/strict';
import { Camera } from '../src/rendering/Camera.js';
import { Input } from '../src/input/Input.js';

class PointerCanvas {
  constructor() { this.width=390; this.height=844; }
  getBoundingClientRect() { return { left:0, top:0, width:390, height:844 }; }
  setPointerCapture() {}
}

const pointer=(type,id,x,y,timeStamp=0)=>({ type, pointerId:id, clientX:x, clientY:y, buttons:type==='pointermove'?1:0, timeStamp });

test('camera transforms both axes with one uniform zoom and round trips coordinates', () => {
  const camera=new Camera(390,844); camera.configure(120,80,390,844); camera.setZoom(10); camera.centerOn({x:60,y:40});
  const origin=camera.worldToScreen({x:20,y:20});
  const x=camera.worldToScreen({x:21,y:20}); const y=camera.worldToScreen({x:20,y:21});
  assert.equal(x.x-origin.x,y.y-origin.y);
  assert.deepEqual(camera.screenToWorld(x),{x:21,y:20});
});

test('camera clamps bounds and zoom limits', () => {
  const camera=new Camera(390,844); camera.configure(120,120,390,844);
  camera.setZoom(999); assert.equal(camera.zoom,Camera.MAX_ZOOM);
  camera.centerOn({x:-100,y:999});
  assert.ok(camera.x>=0); assert.ok(camera.y<=120);
  camera.setZoom(0); assert.equal(camera.zoom,Camera.MIN_ZOOM);
});

test('resize preserves camera focus and does not mutate world positions', () => {
  const camera=new Camera(844,390); camera.configure(120,80,844,390); camera.setZoom(12); camera.centerOn({x:44,y:40});
  const entity={x:12,y:13}; const focus={x:camera.x,y:camera.y};
  camera.setViewport(390,844);
  assert.deepEqual({x:camera.x,y:camera.y},focus); assert.deepEqual(entity,{x:12,y:13});
});

test('tap resolves once while drag pans without casting', () => {
  const input=new Input(new PointerCanvas()); let taps=0,pans=0;
  input.onWorldPointer=()=>taps++; input.onPan=()=>pans++;
  input.handlePointer(pointer('pointerdown',1,20,20)); input.handlePointer(pointer('pointermove',1,70,20)); input.handlePointer(pointer('pointerup',1,70,20));
  assert.equal(taps,0); assert.ok(pans>0);
  input.handlePointer(pointer('pointerdown',2,30,30,1000)); input.handlePointer(pointer('pointerup',2,30,30,1050)); assert.equal(taps,1);
});

test('pinch zooms around midpoint without resolving a cast', () => {
  const input=new Input(new PointerCanvas()); let taps=0,zooms=0,anchor;
  input.onWorldPointer=()=>taps++; input.onZoom=(factor,point)=>{zooms++;anchor=point;};
  input.handlePointer(pointer('pointerdown',1,100,100)); input.handlePointer(pointer('pointerdown',2,200,100));
  input.handlePointer(pointer('pointermove',2,240,100)); input.handlePointer(pointer('pointerup',2,240,100)); input.handlePointer(pointer('pointerup',1,100,100));
  assert.ok(zooms>0); assert.deepEqual(anchor,{x:170,y:100}); assert.equal(taps,0);
});
