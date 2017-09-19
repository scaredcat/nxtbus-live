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

  render() {
    return (
      <div>
        <h3>Stop_{this.props.match.params.stopId}</h3>
        <p>{moment(this.state.stop.ResponseTimestamp).format('lll')}</p>
      </div>
    );
  }
}
