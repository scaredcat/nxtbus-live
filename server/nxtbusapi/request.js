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

module.exports = {stopMonitoringRequest, productionTimetableServiceRequest, sendRequest, buildXml};
