const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const convertStatsDbObjectToResponseObject = (dbObject) => {
  return {
    totalCases: dbObject.total_cases,
    totalCured: dbObject.total_cured,
    totalActive: dbObject.total_active,
    totalDeaths: dbObject.total_deaths,
  };
};

const convertDistrictDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    stateName: dbObject.state_name,
  };
};

//Get States API

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
        SELECT 
            *
        FROM
            state;
    `;
  const statesArray = await database.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) =>
      convertStateDbObjectToResponseObject(eachState)
    )
  );
});

//Get State API

app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
        SELECT 
            *
        FROM 
            state
        WHERE 
            state_id = ${stateId};
    `;
  const state = await database.get(getStateQuery);
  response.send(convertStateDbObjectToResponseObject(state));
});

//Add District API

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
        INSERT INTO
            district (district_name, state_id, cases, cured, active, deaths)
        VALUES ('${districtName}', '${stateId}', '${cases}', '${cured}', '${active}', '${deaths}');
    `;
  await database.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//Get District API

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
        SELECT 
         *
        FROM
         district
        WHERE 
         district_id = '${districtId}';
    `;
  const district = await database.get(getDistrictQuery);
  response.send(convertDistrictDbObjectToResponseObject(district));
});

//Delete District API

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
        DELETE FROM
            district
        WHERE 
            district_id = '${districtId}';
    `;
  await database.run(deleteDistrictQuery);
  response.send("District Removed");
});

//Update District API

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
        UPDATE
            district
        SET
            district_name = '${districtName}',
            state_id = '${stateId}',
            cases = '${cases}',
            cured = '${cured}',
            active = '${active}',
            deaths = '${deaths}'
        WHERE
            district_id = '${districtId}';
    `;
  await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// Get Stats API

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
        SELECT
            SUM(cases) AS total_cases,
            SUM(cured) As total_cured,
            SUM(active) AS total_active,
            SUM(deaths) AS total_deaths
        FROM 
            district
        WHERE 
            state_id = '${stateId}';
    `;
  const stats = await database.get(getStatsQuery);
  response.send(convertStatsDbObjectToResponseObject(stats));
});

//Get District Details API

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetailsQuery = `
        SELECT 
            state.state_name
        FROM 
            district NATURAL JOIN state
        WHERE 
            district_id = '${districtId}';
    `;
  const districtDetails = await database.get(getDistrictDetailsQuery);
  response.send(
    convertDistrictDetailsDbObjectToResponseObject(districtDetails)
  );
});

module.exports = app;
