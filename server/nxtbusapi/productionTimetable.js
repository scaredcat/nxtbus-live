const fs = require('fs');
const path = require('path');
const {Parser} = require('xml2js');
const {productionTimetableServiceRequest} = require('./request');

const TIMETABLE = path.join(__dirname, '..', 'resources', 'timetable.json');

console.log(TIMETABLE);
const parser = new Parser({
  ignoreAttrs: true,
  explicitArray: false
});

const refreshProductionTimetable = async () => {
  try {
    const data = await productionTimetableServiceRequest();
    fs.writeFileSync(TIMETABLE, JSON.stringify(data.Siri));
    return data.Siri;
  } catch (e) {
    console.log('An error occured when loading the production timetable', e);
    throw e;
  }
}

const loadProductionTimetable = async () => {
  const exists = fs.existsSync(TIMETABLE);
  if (exists) {
    const timetable = fs.readFileSync(TIMETABLE);
    return JSON.parse(timetable);
  } else {
    return await refreshProductionTimetable();
  }
}

module.exports = {loadProductionTimetable, refreshProductionTimetable};
