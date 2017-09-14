const {Parser, Builder} = require('xml2js');
const moment = require('moment');
const builder = new Builder();

const SECRET = process.env.NXTBUS_API_KEY;

const stopMonitoringRequest = stop => {
  const date = moment().utcOffset(10).format();
  const smrequest = {
    RequestTimestamp: date,
    RequestorRef: SECRET,
    StopMonitoringRequest: {
      RequestTimestamp: date,
      MonitoringRef: stop
    }
  };

  return builder.buildObject({
    Siri: {
      ServiceRequest: smrequest,
      $: {
        'xmlns': 'http://www.siri.org.uk/siri'
      }
    }
  });
}

const productionTimetableRequest = () => {
  const date = moment().utcOffset(10).format();
  const tomorrow = moment(date).add(1, 'days').format();

  const ptrequest = {
    RequestTimestamp: date,
    RequestorRef: SECRET,
    ProductionTimetableRequest: {
      RequestTimestamp: date,
      ValidityPeriod: {
        StartTime: date,
        EndTime: tomorrow
      }
    }
  };

  return builder.buildObject({
    Siri: {
      ServiceRequest: ptrequest,
      $: {
        'xmlns': 'http://www.siri.org.uk/siri'
      }
    }
  });
}

module.exports = {stopMonitoringRequest, productionTimetableRequest};
