import React, { Component } from 'react';
import axios from 'axios';

export default class BusStops extends Component {
  constructor(props) {
    super(props);

    this.state = {
      stops: []
    };
  }

  componentWillMount() {
    console.log('fetching some values');
    axios.get('/stop')
      .then(value => {
        this.setState({stops: value.data});
      })
      .catch(e => console.error(e));
  }

  render() {
    if (this.state.stops.length === 0) {
      return (<div>Loading</div>);
    } else {
      return(
        <div>
          <table>
            <thead>
              <tr><th>Stop</th><th>Description</th><th>Latitude</th><th>Longitude</th><th>Street</th></tr>
            </thead>
            <tbody>
              {this.state.stops.map((value, index) => (<tr key={index}><td>{value[0]}</td><td>{value[1]}</td><td>{value[2]}</td><td>{value[3]}</td><td>{value[4]}</td></tr>))}
            </tbody>
          </table>
        </div>
      );
    }
  }
}
