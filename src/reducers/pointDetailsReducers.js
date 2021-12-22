// Редьюсеры детализации по клику на карте (детализация кликнутой точки).

import { types as mapPageActionTypes } from '../actions/mapPage';
import update from 'immutability-helper';
import { combineReducers } from 'redux';
import { clone } from '../utils/common';
import { toUpperCaseFirst } from '../utils/string';

function coords(state = null, action) {
    switch (action.type) {
        case mapPageActionTypes.pointDetails.SHOW_POINT_DETAILS: {
            return action.payload.coords;
            /* {
                pixel: {
                    relative: { x, y },
                },
                latLng: { lat: 0, lng: 0 },
            } */
        }
        case mapPageActionTypes.pointDetails.HIDE_POINT_DETAILS: {
            return null;
        }
        default:
            return state;
    }
}

function altitude(state = null, action) {
    switch (action.type) {
        case mapPageActionTypes.pointDetails.SHOW_POINT_DETAILS: {
            return null; // clear value for a new point
        }
        case mapPageActionTypes.pointDetails.SET_POINT_ALTITUDE: {
            return action.payload;
            /* {
                value: 1234,
                resolution: "5000m",
            } */
        }
        default:
            return state;
    }
}

function isPopupVisible(state = false, action) {
    switch (action.type) {
        case mapPageActionTypes.pointDetails.SHOW_POINT_DETAILS: {
            return true;
        }
        case mapPageActionTypes.pointDetails.HIDE_POINT_DETAILS: {
            return false;
        }
        default:
            return state;
    }
}

function popupContentStyle(state = {}, action) {
    switch (action.type) {
        case mapPageActionTypes.pointDetails.SET_POPUP_CONTENT_STYLE: {
            return action.payload;
        }
        case mapPageActionTypes.pointDetails.CLEAR_POPUP_CONTENT_STYLE: {
            return {};
        }
        default:
            return state;
    }
}


const reducers = {
    pointDetails: combineReducers({
        coords,
        altitude,
        popup: combineReducers({
            isVisible: isPopupVisible,
            contentStyle: popupContentStyle,
        }),
    }),
};

export default reducers;
