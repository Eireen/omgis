import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import css from './css/main.css';
import App from './App';
import Router from './Router';
import reportWebVitals from './reportWebVitals';

import { Provider } from "react-redux";
import configureStore from "./configureStore";

const store = configureStore();

ReactDOM.render(
    <React.StrictMode>
        <Provider store={store}>
            <Router />
        </Provider>
    </React.StrictMode>,
    document.getElementById('root')
);

///////////// DEBUG //////////////
window.myStore = store;

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// TODO: CHECK
// reportWebVitals();
