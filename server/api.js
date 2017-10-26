const Router = require('koa-router')
const database = require('./database')
const joi = require('joi')
const validate = require('koa-joi-validate')

const idValidator = validate({
  params: { id: joi.number().min(0).max(1000).required() }
})

const typeValidator = validate({
  params: { type: joi.string().valid(['castle', 'city', 'town', 'ruin', 'landmark', 'region']).required() }
})

const router = new Router()

router.get('/hello', async (ctx) => {
  ctx.body = 'Hello World'
})

router.get('/time', async (ctx) => {
  const result = await database.queryTime()
  ctx.body = result
})

router.get('/locations/:type', typeValidator, async (ctx) => {
  const type = ctx.params.type
  const results = await database.getLocations(type)
  if (results.length === 0) { ctx.throw(404) }

  const locations = results.map((row) => {
    let geojson = JSON.parse(row.st_asgeojson)
    geojson.properties = { name: row.name, type: row.type, id: row.gid }
    return geojson
  })
  ctx.body = locations
})

router.get('/kingdoms/:id/size', idValidator, async (ctx) => {
  const id = ctx.params.id
  const result = await database.getRegionSize(id)
  if (!result) { ctx.throw(404) }

  const sqKm = result.size * (10 ** -6)
  ctx.body = sqKm
})

router.get('/kingdoms/:id/castles', idValidator, async (ctx) => {
  const regionId = ctx.params.idea
  const result = await database.countCastles(regionId)
  ctx.body = result ? result.count : ctx.throw(404)
})

router.get('/kingdoms/:id/summary', idValidator, async (ctx) => {
  const id = ctx.params.id
  const result = await database.getSummary('kingdoms', id)
  ctx.body = result || ctx.throw(404)
})

router.get('/locations/:id/summary', idValidator, async (ctx) => {
  const id = ctx.params.id
  const result = await database.getSummary('locations', id)
  ctx.body = result || ctx.throw(404)
})

router.get('/kingdoms', async (ctx) => {
  console.log("Defo comming through")
  const results = await database.getKingdomBoundaries()
  if (results === 0) { ctx.throw(404) }

  const boundaries = results.map((row) => {
    let geojson = JSON.parse(row.st_asgeojson)
    geojson.properties = { name: row.name, id: row.gid }
    return geojson
  })
  ctx.body = boundaries
})

module.exports = router
