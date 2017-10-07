import React, { Component } from 'react';
import axios from 'axios';

export default class BusStops extends Component {
  constructor(props) {
    super(props);

    this.state = {
      stops: [],
      search: 'City Bus Stn Plt'
    };
  }

  componentWillMount() {
    axios.get('/api/stop')
      .then(value => {
        this.setState({stops: value.data});
      })
      .catch(e => console.error(e));
  }

  displayStops() {
    return this.state.stops.filter(value => (value[0]+value[1]).toLowerCase().match(this.state.search.toLowerCase()))
      .slice(0,35).map((value, index) => {
      return (
        <tr key={index}>
          <td onClick={() => this.props.history.push(`/stop/${value[0]}`)}>{value[0]}</td>
          <td onClick={() => this.props.history.push(`/stop/${value[0]}`)}>{value[1]}</td>
          <td><a href={`https://www.google.com/maps/search/?api=1&query=${value[2]},${value[3]}`} target='_blank'>{value[2]} {value[3]}</a></td>
          <td>{value[4]}</td>
        </tr>)
    });
  }

  render() {
    if (this.state.stops.length === 0) {
      return (
        <div className="progress">
            <div className="indeterminate"></div>
        </div>
    );
    } else {
      return(
        <div>
          <div className="input-field">
            <input
              id="bus_stop"
              type="text"
              value={this.state.search}
              onChange={e => this.setState({search: e.target.value})}
              autoFocus
              onFocus={e => e.target.select() }
            />
            <label htmlFor="bus_stop">Bus Stop Search</label>
          </div>
          <table className="highlight">
            <thead>
              <tr><th>Stop</th><th>Description</th><th>Location</th><th>Street</th></tr>
            </thead>
            <tbody>
              {this.displayStops()}
            </tbody>
          </table>
        </div>
      );
    }
  }
}
