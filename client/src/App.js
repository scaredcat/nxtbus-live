import React, { Component } from 'react';
import 'materialize-css';
import 'materialize-css/dist/css/materialize.min.css';
import './App.css';

import BusStops from './components/BusStops';

class App extends Component {
  render() {
    return (
      <div className="container">
        <BusStops />
      </div>
    );
  }
}

export default App;
