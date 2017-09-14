require('./config/config');
const express = require('express');
const {Parser, Builder} = require('xml2js');
const axios = require('axios');
const fs = require('fs');
const csv = require('csvtojson');
const moment = require('moment');

const {stopMonitoringRequest, productionTimetableRequest} = require('./nxtbusapi/request');
const SECRET = process.env.NXTBUS_API_KEY;

const app = express();


const busstops = [];
csv({
  delimiter: '\t'
}).fromFile(__dirname + '/resources/AllStops.csv')
  .on('csv', jsonObj => {
    busstops.push(jsonObj);
  })
  .on('done', error => {
    // console.log(busstops[0]);
  })

// console.log(xml);

const parser = new Parser({
  ignoreAttrs: true,
  explicitArray: false
});

// stopMonitoringRequest
// axios({
//     method: 'post',
//     url: `http://siri.nxtbus.act.gov.au:11000/${SECRET}/sm/service.xml`,
//     data: stopMonitoringRequest('1723'),
//   headers: {
//     'Content-Type': 'text/xml'
//   }
// }).then(response => {
//   parser.parseString(response.data, (err, result) => {
//     if(err) {
//       console.error(err);
//     }
//     console.log(JSON.stringify(result.Siri, undefined, 2));
//   });
// }).catch(e => console.error(e));


// productionTimetableRequest
// axios({
//     method: 'post',
//     url: `http://siri.nxtbus.act.gov.au:11000/${SECRET}/pt/service.xml`,
//     data: productionTimetableRequest(),
//   headers: {
//     'Content-Type': 'text/xml'
//   }
// }).then(response => {
//   parser.parseString(response.data, (err, result) => {
//     if(err) {
//       console.error(err);
//     }
//     console.log(result.Siri);
//   });
// }).catch(e => console.error(e));


app.get('/timetable', (req, res) => {
  axios({
      method: 'post',
      url: `http://siri.nxtbus.act.gov.au:11000/${SECRET}/pt/service.xml`,
      data: productionTimetableRequest(),
    headers: {
      'Content-Type': 'text/xml'
    }
  }).then(response => {
    parser.parseString(response.data, (err, result) => {
      if(err) {
        return res.status(404).send(err);
      }
      res.send(result.Siri);
    });
  }).catch(e => res.status(404).send(e));
});

app.listen(process.env.PORT, () => {
  console.log('App listening on port 3000');
});
