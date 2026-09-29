import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
const data=JSON.parse(readFileSync(new URL('../src/data/california-county-boundaries.json',import.meta.url)))
const source=readFileSync(new URL('../src/lib/countyLocation.ts',import.meta.url),'utf8').replace("import boundaries from '../data/california-county-boundaries.json'",`const boundaries = ${JSON.stringify(data)}`)
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const {suggestCounty}=await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
test('official county boundaries include all 58 and identify interior public city coordinates',()=>{
 assert.equal(data.counties.length,58)
 assert.equal(new Set(data.counties.map(x=>x.name)).size,58)
 assert.equal(suggestCounty(39.7285,-121.8375,50),'Butte')
 assert.equal(suggestCounty(34.0522,-118.2437,50),'Los Angeles')
 assert.equal(suggestCounty(32.7157,-117.1611,50),'San Diego')
})
test('county hints reject out-of-state, invalid, inaccurate and simplified boundary positions',()=>{
 for(const p of [[40.7128,-74.006,50],[39.7285,-121.8375,50000],[NaN,0,20],[100,0,20],[39.7285,-121.8375,-1]])assert.equal(suggestCounty(...p),null)
 const g=data.counties.find(c=>c.name==='Butte').geometry
 const vertex=g.type==='Polygon'?g.coordinates[0][0]:g.coordinates[0][0][0]
 assert.equal(suggestCounty(vertex[1],vertex[0],50),null)
})
