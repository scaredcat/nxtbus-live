import React, { Component } from 'react';
import './App.css';

import BusStops from './components/BusStops';

class App extends Component {
  render() {
    return (
      <div className="App">
        <BusStops />
      </div>
    );
  }
}

export default App;
