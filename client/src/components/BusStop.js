import React, { Component } from 'react';
import axios from 'axios';
import moment from 'moment';

export default class BusStop extends Component {
  constructor(props) {
    super(props);

    this.state = {
      stop: {},
    };
  }

  componentWillMount() {
    axios.get(`/api/stop/${this.props.match.params.stopId}`)
      .then(value => {
        console.log(value.data);
        this.setState({stop: value.data});
      })
      .catch(e => console.error(e));
  }

  displayStatus() {
    const {stop} = this.state;

    if (Object.keys(stop).length === 0) {
      return <div>Loading status...</div>;
    }

    if (stop.Status === 'false') {
      return <div>Error loading data for this stop</div>;
    }

    if (!stop.StopMonitoringDelivery) {
      return <div>No busses recoreded within the next 30 minutes</div>;
    }

    if (!Array.isArray(stop.StopMonitoringDelivery.MonitoredStopVisit)) {
      stop.StopMonitoringDelivery.MonitoredStopVisit = [stop.StopMonitoringDelivery.MonitoredStopVisit];
    }

    stop.StopMonitoringDelivery.MonitoredStopVisit.sort((a, b) => {
      const atime = a.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime;
      const btime = b.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime;
      return atime > btime;
    })

    const status = stop.StopMonitoringDelivery.MonitoredStopVisit.map(({MonitoredVehicleJourney, ValidUntilTime, RecordedAtTime}) => ({
      LineRef: MonitoredVehicleJourney.LineRef + '_' + MonitoredVehicleJourney.DirectionRef,
      ExpectedDepartureTime: Math.round(moment.duration(moment(MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime).diff(moment(RecordedAtTime))).asMinutes()) + ' min',
      DestinationName: MonitoredVehicleJourney.DestinationName,
      OriginName: MonitoredVehicleJourney.OriginName || MonitoredVehicleJourney.OriginShortName,
      VehicleAtStop: MonitoredVehicleJourney.MonitoredCall.VehicleAtStop,
      VehicleFeatureRef: MonitoredVehicleJourney.VehicleFeatureRef,
      ValidUntilTime: moment(ValidUntilTime).format('LTS')
    }));

    return (
      <table>
        <thead>
          <tr>{Object.keys(status[0]).map(key => <th key={key}>{key}</th>)}</tr>
        </thead>
        <tbody>
          {status.map((item, index) =>
            <tr key={index}>{Object.keys(item).map((value, i) => <td key={index + '_' + i}>{item[value]}</td>)}</tr>
          )}
        </tbody>
      </table>
    );
  }

  render() {
    return (
      <div>
        <h3>Stop_{this.props.match.params.stopId}</h3>
        <p>{moment(this.state.stop.ResponseTimestamp).format('lll')}</p>
        {this.displayStatus()}
      </div>
    );
  }
}
