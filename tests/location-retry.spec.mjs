import {test,expect} from '@playwright/test'

test('granted permission with unavailable position offers a precise retry, not a permission warning',async({page})=>{
 await page.addInitScript(()=>{
  window.geoOptions=[]
  navigator.geolocation.getCurrentPosition=(ok,fail,options)=>{
   window.geoOptions.push(options)
   if(!options.enableHighAccuracy)fail({code:2})
   else ok({coords:{latitude:39.7285,longitude:-121.8375,accuracy:50}})
  }
 })
 await page.goto('/')
 await page.getByRole('button',{name:'Use current location'}).click()
 await expect(page.getByRole('status')).toContainText('Your device could not determine a location')
 await page.getByRole('button',{name:'Try precise location'}).click()
 await expect(page.getByLabel('California county')).toHaveValue('Butte')
 const options=await page.evaluate(()=>window.geoOptions)
 expect(options[0].maximumAge).toBe(60000)
 expect(options[0].timeout).toBe(20000)
 expect(options[1].enableHighAccuracy).toBe(true)
})

test('timeout is distinguished from denial and coordinates are not needed for manual search',async({page})=>{
 await page.addInitScript(()=>{navigator.geolocation.getCurrentPosition=(ok,fail)=>fail({code:3})})
 await page.goto('/')
 await page.getByRole('button',{name:'Use current location'}).click()
 await expect(page.getByRole('status')).toContainText('Location timed out')
 await page.getByLabel('California county').selectOption('Colusa')
 await page.getByRole('button',{name:'Find support options'}).click()
 await expect(page.getByRole('link',{name:'Call county plan'})).toBeVisible()
})

test('mobile hero mascot retains full size',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 await page.goto('/')
 const height=await page.locator('main section').first().locator('svg').evaluate(e=>e.getBoundingClientRect().height)
 expect(height).toBeGreaterThanOrEqual(96)
})
