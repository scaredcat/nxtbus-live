require('./config/config');
const express = require('express');
const moment = require('moment');
const csv = require('csvtojson');

const {stopMonitoringRequest, sendRequest, buildXml} = require('./nxtbusapi/request');
const {loadProductionTimetable, refreshProductionTimetable} = require('./nxtbusapi/productionTimetable');
const SECRET = process.env.NXTBUS_API_KEY;

let todaysTimetable = {};

const app = express();

// load list of bus stops from csv file
const busstops = [];
csv({delimiter: '\t'})
  .fromFile(__dirname + '/resources/AllStops.csv')
  .on('csv', jsonObj => {
    busstops.push(jsonObj);
  }).on('done', error => {
    if (error) {
      console.log('Error loading busstops csv', error);
    }
  });

const reloadTimetable = (value) => {
  todaysTimetable = value;
  const now = moment();
  const expire = moment(todaysTimetable.ServiceDelivery.ProductionTimetableDelivery.ValidUntil);
  const diff = expire - now + 6000;

  setTimeout(() => {
    console.log(moment(), 'reloading timetable...');
    refreshProductionTimetable().then(value => {
      reloadTimetable(value);
    });
  }, delay)
};

// load the production timetable from servers
loadProductionTimetable().then(value => {
  console.log('Initial timetable loaded.');
  reloadTimetable(value);
});


// const now = moment().format();
// const tomorrow = moment(now).add(1, 'days').format();
// const vmsubscription = buildXml('SubscriptionRequest', {
//   RequestTimestamp: now,
//   RequestorRef: SECRET,
//   VehicleMonitoringSubscriptionRequest: {
//     SubscriptionIdentifier: '4',
//     InitialTerminationTime: tomorrow,
//     VehicleMonitoringRequest: {
//       RequestTimestamp: now,
//       VehicleMonitoringRef: 'VM_ACT_0950'
//     },
//     UpdateInterval: 'P0Y0M0DT0H0M1.00S'
//   }
// });
//
// const terminaterequest = buildXml('TerminateSubscriptionRequest', {
//   RequestTimestamp: now,
//   RequestorRef: SECRET,
//   All: null
// });

// // console.log(terminaterequest);
// sendRequest('vm/subscription.xml', terminaterequest)
//   .then(value => {
//     console.log('cancel subscription success', value);
//   }).catch(e => console.log('subscription cancel success', e));
//
// // console.log(vmsubscription);
//
// sendRequest('vm/subscription.xml', vmsubscription)
//   .then(value => {
//     console.log('subscription success', value);
//   }).catch(e => console.log('subscription failure', e));


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

app.get('/stops', (req, res) => {
  res.send(busstops);
});

app.get('/stops/:stop', (req, res) => {
  stopMonitoringRequest(req.params.stop).then(value => {
    res.send(value);
  }).catch(e => {
    res.status(400).send(e);
  });
});

app.listen(process.env.PORT, () => {
  console.log('App listening on port 3000');
});
