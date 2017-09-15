const fs = require('fs');
const path = require('path');
const axios = require('axios');
const {Parser} = require('xml2js');
const {productionTimetableRequest} = require('./request');

const TIMETABLE = path.join(__dirname, '..', 'resources', 'timetable.json');
const SECRET = process.env.NXTBUS_API_KEY;

console.log(TIMETABLE);

const loadProductionTimetable = async () => {
  const exists = fs.existsSync(TIMETABLE);

  const parser = new Parser({
    ignoreAttrs: true,
    explicitArray: false
  });

  if (exists) {
    const timetable = fs.readFileSync(TIMETABLE);
    return JSON.parse(timetable);
  } else {
    // productionTimetableRequest
    console.log('Fetching todays timetable...');
    try {
      const response = await axios({
          method: 'post',
          url: `http://siri.nxtbus.act.gov.au:11000/${SECRET}/pt/service.xml`,
          data: productionTimetableRequest(),
        headers: {
          'Content-Type': 'text/xml'
        }
      });
      console.log('fetched data, parsing...');
      const result = await parser.parseString(response.data).Siri;
      console.log('parsed data, storing...');
      await fs.writeFileSync(TIMETABLE, JSON.stringify(result));
      console.log('Successfully fetched todays timetable');
      return result;
    } catch (e) {
      return {};
      console.log('Error occured fetching timetable', e);
    }
  }
}

module.exports = {loadProductionTimetable};
