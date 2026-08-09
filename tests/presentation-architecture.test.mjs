import test from 'node:test';
import assert from 'node:assert/strict';
import { DeviceProfile } from '../src/presentation/DeviceProfile.js';
import { EntryRouter } from '../src/presentation/EntryRouter.js';
import { PresentationProfile } from '../src/presentation/PresentationProfile.js';
import { MobileCamera } from '../src/rendering/MobileCamera.js';
import { MobileInput } from '../src/input/MobileInput.js';
import { World } from '../src/world/World.js';
import { SaveManager } from '../src/persistence/SaveManager.js';

const environment = ({ search='', width=390, height=844, coarse=true, hover=false, touches=5 }={}) => ({
  location: { search, hash:'', replace() {} },
  window: { innerWidth:width, innerHeight:height, matchMedia: query => ({ matches:query.includes('coarse')?coarse:!hover }) },
  navigator: { maxTouchPoints:touches },
});

test('explicit presentation overrides take priority', () => {
  let value=environment({search:'?mobile=1',width:1920,height:1080,coarse:false,touches:0});
  assert.equal(new DeviceProfile(value.location,value.window,value.navigator).resolve(),'mobile');
  value=environment({search:'?desktop=1'});
  assert.equal(new DeviceProfile(value.location,value.window,value.navigator).resolve(),'desktop');
});

test('combined viewport and pointing capabilities select likely phones, not touch desktops', () => {
  let value=environment();
  assert.equal(new DeviceProfile(value.location,value.window,value.navigator).resolve(),'mobile');
  value=environment({width:1920,height:1080,coarse:true,touches:10});
  assert.equal(new DeviceProfile(value.location,value.window,value.navigator).resolve(),'desktop');
  value=environment({width:1440,height:900,coarse:false,hover:true,touches:0});
  assert.equal(new DeviceProfile(value.location,value.window,value.navigator).resolve(),'desktop');
});

test('launcher chooses one static destination and presentation pages contain no router', async () => {
  const value=environment();
  const profile=new DeviceProfile(value.location,value.window,value.navigator);
  assert.equal(new EntryRouter(value.location,profile).destination(),'index2.html');
  const { readFile }=await import('node:fs/promises');
  assert.doesNotMatch(await readFile(new URL('../index2.html',import.meta.url),'utf8'),/launcher|EntryRouter/);
  assert.doesNotMatch(await readFile(new URL('../desktop.html',import.meta.url),'utf8'),/launcher|EntryRouter/);
});

test('mobile presentation changes only UI, input, renderer and camera dependencies', () => {
  const canvas={ width:390,height:844,getContext:()=>({}) };
  const mobile=new PresentationProfile(PresentationProfile.MOBILE);
  assert.ok(mobile.createInput(canvas) instanceof MobileInput);
  assert.ok(mobile.createRenderer(canvas).camera instanceof MobileCamera);
  assert.equal(new PresentationProfile(PresentationProfile.DESKTOP).createRenderer(canvas).camera.constructor.name,'Camera');
  assert.equal(World, World);
  assert.match(mobile.createUI.toString(),/MobileUI/);
});

test('both presentations use one persistence slot and preserve one serialized world record', () => {
  const values=new Map();
  const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  const desktopSave=new SaveManager(storage); const mobileSave=new SaveManager(storage);
  const data={ state:'PLAYING',introPage:0,worldType:'human',worldSeed:7,chosenOne:{id:'chosen-1'},world:{worldTime:{elapsed:12},settlements:[{id:'s1'}],rivalAttack:{phase:'warning'}} };
  desktopSave.save(data);
  assert.deepEqual(mobileSave.load().data,data);
});

test('mobile camera starts locally and retains uniform scaling through orientation changes', () => {
  const camera=new MobileCamera(390,844); camera.configure(120,80,390,844);
  camera.setZoom(camera.initialZoom()); camera.centerOn({x:40,y:30});
  const before={x:camera.x,y:camera.y};
  assert.ok(camera.zoom>=10);
  assert.equal(camera.worldToScreen({x:2,y:1}).x-camera.worldToScreen({x:1,y:1}).x,camera.worldToScreen({x:1,y:2}).y-camera.worldToScreen({x:1,y:1}).y);
  camera.setViewport(844,390);
  assert.deepEqual({x:camera.x,y:camera.y},before);
});
