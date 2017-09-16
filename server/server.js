require('./config/config');
const express = require('express');
const {Parser, Builder} = require('xml2js');
const fs = require('fs');
const moment = require('moment');
const csv = require('csvtojson');

const {stopMonitoringRequest, sendRequest, buildXml} = require('./nxtbusapi/request');
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
  console.log('Initial timetable loaded.');
  todaysTimetable = value;

  const now = moment();
  const expire = moment(todaysTimetable.ServiceDelivery.ProductionTimetableDelivery.ValidUntil);
  const diff = expire - now + 6000;
  reloadTimetable(diff);
});


const now = moment().format();
const tomorrow = moment(now).add(1, 'days').format();
const vmsubscription = buildXml('SubscriptionRequest', {
  RequestTimestamp: now,
  RequestorRef: SECRET,
  VehicleMonitoringSubscriptionRequest: {
    SubscriptionIdentifier: '4',
    InitialTerminationTime: tomorrow,
    VehicleMonitoringRequest: {
      RequestTimestamp: now,
      VehicleMonitoringRef: 'VM_ACT_0950'
    },
    UpdateInterval: 'P0Y0M0DT0H0M1.00S'
  }
});

console.log(vmsubscription);

sendRequest('/vm/subscription.xml', vmsubscription);


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
