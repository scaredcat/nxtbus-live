import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import 'materialize-css';
import 'materialize-css/dist/css/materialize.min.css';
import './App.css';

import BusStops from './components/BusStops';
import BusStop from './components/BusStop';

class App extends Component {
  render() {
    return (
      <div className="container">
        <Switch>
          <Route path='/' exact component={BusStops} />
          <Route path='/stop/:stopId' component={BusStop} />
        </Switch>
      </div>
    );
  }
}

export default App;
