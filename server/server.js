require('./config/config');
const express = require('express');
const {Parser, Builder} = require('xml2js');
const fs = require('fs');
const moment = require('moment');
const csv = require('csvtojson');

const {stopMonitoringRequest} = require('./nxtbusapi/request');
const {loadProductionTimetable, refreshProductionTimetable} = require('./nxtbusapi/productionTimetable');
const SECRET = process.env.NXTBUS_API_KEY;

let todaysTimetable = {};

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

const reloadTimetable = (delay) => {
  setTimeout(() => {
    console.log(moment(), 'reloading timetable...');
    refreshProductionTimetable().then(value => {
      todaysTimetable = value;
      const now = moment();
      const expire = moment(todaysTimetable.ServiceDelivery.ProductionTimetableDelivery.ValidUntil);
      const diff = expire - now + 6000;
      reloadTimetable(diff);
    });
  }, delay)
};

loadProductionTimetable().then(value => {
  todaysTimetable = value;

  const now = moment();
  const expire = moment(todaysTimetable.ServiceDelivery.ProductionTimetableDelivery.ValidUntil);
  const diff = expire - now + 6000;
  reloadTimetable(diff);
});



app.get('/timetable', (req, res) => {
  res.send(todaysTimetable);
});

app.get('/busses', (req, res) => {
  if (Object.keys(todaysTimetable).length === 0) {
    return res.send({});
  }
  const busses = todaysTimetable.ServiceDelivery.ProductionTimetableDelivery.DatedTimetableVersionFrame.map(timetable => {
    return `${timetable.LineRef}_${timetable.DirectionRef}: ${timetable.DestinationDisplay}`;
  });
  return res.send(busses);
});

app.get('/busses/:route', (req, res) => {
  if (Object.keys(todaysTimetable).length === 0) {
    return res.send({});
  }
  const bus = todaysTimetable.ServiceDelivery.ProductionTimetableDelivery.DatedTimetableVersionFrame.filter(timetable => req.params.route === timetable.PublishedLineName);
  return res.send(bus);
});

app.listen(process.env.PORT, () => {
  console.log('App listening on port 3000');
});
