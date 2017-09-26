require('../config/config');
const {Parser, Builder} = require('xml2js');
const moment = require('moment');
const http = require('http');
const builder = new Builder();

const SECRET = process.env.NXTBUS_API_KEY;

const buildXml = (key, data) => {
  return builder.buildObject({
    Siri: {
      [key]: data,
      $: {
        'xmlns': 'http://www.siri.org.uk/siri'
      }
    }
  });
}

const parser = new Parser({
  ignoreAttrs: true,
  explicitArray: false
});

const sendRequest = (endPoint, postData) => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'siri.nxtbus.act.gov.au',
      path: `/${SECRET}/${endPoint}`,
      port: 11000,
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      res.setEncoding('utf8');
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (endPoint.includes('polldata')) {
          console.log('polldata success', data);
        }

        parser.parseString(data, (err, result) => {
            if(err) {
            return reject(err);
            }
            resolve(result);
          });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });
    req.write(postData);
    req.end();
  });
}

const stopMonitoringRequest = stop => {
  const date = moment().utcOffset(10).format();
  const smrequest = {
    RequestTimestamp: date,
    RequestorRef: SECRET,
    StopMonitoringRequest: {
      RequestTimestamp: date,
      MonitoringRef: stop,
      MaximumTextLength: '300'
    }
  };

  const postData = buildXml('ServiceRequest', smrequest);
  return sendRequest('sm/service.xml', postData);
}

const productionTimetableServiceRequest = () => {
  const now = moment().utcOffset(10).format();
  const date = moment(now).utcOffset(10).seconds(0).minutes(0).hours(5).format();
  const tomorrow = moment(date).add(1, 'days').add(1, 'hours').format();

  const ptrequest = {
    RequestTimestamp: now,
    RequestorRef: SECRET,
    ProductionTimetableRequest: {
      RequestTimestamp: now,
      ValidityPeriod: {
        StartTime: date,
        EndTime: tomorrow
      }
    }
  };

  const postData = buildXml('ServiceRequest', ptrequest);
  return sendRequest('pt/service.xml', postData);
}

const stopMonitoringSubscriptionRequest = stop => {
  const now = moment().utcOffset(10).format();
  const fiveminutes = moment(now).add(10, 'minutes').format();

  const smsubrequest = {
    RequestTimestamp: now,
    RequestorRef: SECRET,
    StopMonitoringSubscriptionRequest: {
      SubscriberRef: SECRET,
      SubscriptionIdentifier: Math.round(Math.random() * 10).toString(),
      InitialTerminationTime: fiveminutes,
      StopMonitoringRequest: {
        RequestTimestamp: now,
        MonitoringRef: stop
      },
      ChangeBeforeUpdates: 'P0Y0M0DT0H0M30.000S'
    }
  };

  console.log('subscription ref', smsubrequest.StopMonitoringSubscriptionRequest.SubscriptionIdentifier);

  const postData = buildXml('SubscriptionRequest', smsubrequest);
  console.log(postData);
  return sendRequest('sm/subscription.xml', postData);
}

const stopMonitoringPollRequest = () => {
  const now = moment().utcOffset(10).format();

  const smpollrequest = {
    RequestTimestamp: now,
    ConsumerRef: SECRET,
    AllData: false
  };

  const postData = buildXml('DataSupplyRequest', smpollrequest);
  return sendRequest('sm/polldata.xml', postData);
}

const terminateSubscriptions = () => {
  const now = moment().utcOffset(10).format();
  const termsubrequest = {
    RequestTimestamp: now,
    RequestorRef: SECRET,
    All: null
  };

  const postData = buildXml('TerminateSubscriptionRequest', termsubrequest);
  return sendRequest('sm/subscription.xml', postData);
}

module.exports = {terminateSubscriptions, stopMonitoringRequest, stopMonitoringSubscriptionRequest, stopMonitoringPollRequest, productionTimetableServiceRequest, sendRequest, buildXml};
