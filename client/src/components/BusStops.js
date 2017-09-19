import React, { Component } from 'react';
import axios from 'axios';

export default class BusStops extends Component {
  constructor(props) {
    super(props);

    this.state = {
      stops: [],
      search: ''
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
    return this.state.stops.filter(value => value.some(item => item.toLowerCase().match(this.state.search.toLowerCase())))
      .slice(0,35).map((value, index) => {
      return (
        <tr key={index} onClick={() => this.props.history.push(`/stop/${value[0]}`)}>
          <td>{value[0]}</td>
          <td>{value[1]}</td>
          <td>{value[2]}</td>
          <td>{value[3]}</td>
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
            <input id="bus_stop" type="text" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
            <label htmlFor="bus_stop">Bus Stop Search</label>
          </div>
          <table className="highlight">
            <thead>
              <tr><th>Stop</th><th>Description</th><th>Latitude</th><th>Longitude</th><th>Street</th></tr>
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
