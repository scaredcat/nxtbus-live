require('./config/config');
const express = require('express');
const moment = require('moment');
const csv = require('csvtojson');
const path = require('path');

const {terminateSubscriptions, stopMonitoringSubscriptionRequest, stopMonitoringRequest, sendRequest, buildXml} = require('./nxtbusapi/request');
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
  }, diff)
};

// load the production timetable from servers
loadProductionTimetable().then(value => {
  console.log('Initial timetable loaded.');
  reloadTimetable(value);
});

terminateSubscriptions().then(value => console.log('terminated subscriptiosn')).catch(e => console.log('unable to terminate subscriptions'));

setTimeout(() => {
  stopMonitoringSubscriptionRequest('3401').then(value => {
    console.log('got a subscription request response', value);
  }).catch(e => console.log('error with subscription', e));
}, 1000);


// Serve static files from the React app
// https://daveceddia.com/create-react-app-express-production/
app.use(express.static(path.join(__dirname, '..', 'client/build')));

app.get('/api/timetable', (req, res) => {
  res.send(todaysTimetable);
});

app.get('/api/bus', (req, res) => {
  if (Object.keys(todaysTimetable).length === 0) {
    return res.send({});
  }
  const busses = todaysTimetable.ServiceDelivery.ProductionTimetableDelivery.DatedTimetableVersionFrame.map(timetable => {
    return `${timetable.LineRef}_${timetable.DirectionRef}: ${timetable.DestinationDisplay}`;
  });
  return res.send(busses);
});

app.get('/api/bus/:route', (req, res) => {
  if (Object.keys(todaysTimetable).length === 0) {
    return res.send({});
  }
  const bus = todaysTimetable.ServiceDelivery.ProductionTimetableDelivery.DatedTimetableVersionFrame.filter(timetable => req.params.route === timetable.PublishedLineName);
  return res.send(bus);
});

app.get('/api/stop', (req, res) => {
  res.send(busstops);
});

app.get('/api/stop/:stop', (req, res) => {
  stopMonitoringRequest(req.params.stop).then(value => {
    res.send(value.Siri.ServiceDelivery);
  }).catch(e => {
    res.status(400).send(e);
  });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client/build/index.html'));
});


app.listen(process.env.PORT, () => {
  console.log(`App listening on port ${process.env.PORT}`);
});

const app2 = express();
app.post('*', (req, res) => {
  console.log('got a reqest from some on port 11000', req.body);
  res.send();
});
app.listen(11000, () => {
  console.log('listening for nxtbus server');
});
