const express = require('express')
const path = require('path')

const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const initializeDatabaseAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDatabaseAndServer()

const convertStateTableintoCamelcase = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertdtTableintoCamelcase = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

// API 1 get all states

app.get('/states/', async (request, response) => {
  const getAllStatesQuery = `
    SELECT
        *
    FROM
        state;`
  const statesArray = await db.all(getAllStatesQuery)
  response.send(
    statesArray.map(eachObject => convertStateTableintoCamelcase(eachObject)),
  )
})

// API 2 get state with ID

app.get('/states/:stateId', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
    SELECT
        *
    FROM
        state
    WHERE
        state_id = ${stateId};`
  const state = await db.get(getStateQuery)
  response.send(convertStateTableintoCamelcase(state))
})

// API 3 add district

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const addDistrictQuery = `
  INSERT INTO
      district (district_name, state_id, cases, cured, active, deaths)
  VALUES 
  ('${districtName}','${stateId}',${cases},${cured},${active},${deaths});`
  await db.run(addDistrictQuery)
  response.send('District Successfully Added')
})

// API 4 add district by ID

app.get('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
  SELECT
      *
  FROM
      district
  WHERE
      district_id = ${districtId};`
  const district = await db.get(getDistrictQuery)
  response.send(convertdtTableintoCamelcase(district))
})

//API 5 delete district by ID

app.delete('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
  DELETE FROM
      district
  WHERE
      district_id = ${districtId};`
  const delDistrict = await db.get(deleteDistrictQuery)
  response.send('District Removed')
})

// API 6 uptade district by id

app.put('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updateDistrictQuery = `
  UPDATE
      district
  SET
      district_name = '${districtName}',
      state_id = '${stateId}',
      cases = ${cases},
      cured = ${cured},
      active = ${active},
      deaths = ${deaths}
  WHERE
      district_id = ${districtId};`
  await db.run(updateDistrictQuery)
  response.send('District Details Updated')
})

// API 7 get totalcases...

app.get('/states/:stateId/stats', async (request, response) => {
  const {stateId} = request.params
  const getStateStatsQuery = `
  SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
  FROM
      district
  WHERE
      state_id = ${stateId};`
  const stats = await db.get(getStateStatsQuery)
  console.log(stats)
  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    totalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})

// API 8 get state name using distict Id

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
    SELECT
        state_id
    FROM
        district
    WHERE
        district_id = ${districtId};`
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery)
  const getStateNameQuery = `
    SELECT
        state_name AS stateName
    FROM
        state
    WHERE
        state_id = ${getDistrictIdQueryResponse.state_id};`
  const getStateNameQueryResponse = await db.get(getStateNameQuery)
  response.send(getStateNameQueryResponse)
})

module.exports = app
