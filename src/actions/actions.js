export const types = {
    popups: {
        SHOW_POPUP: 'popups/SHOW_POPUP',
        UPDATE_POPUP: 'popups/UPDATE_POPUP',
        CLOSE_POPUP: 'popups/CLOSE_POPUP',
    },
};

export const SHOW_POPUP = 'SHOW_POPUP';
export const UPDATE_POPUP = 'UPDATE_POPUP';
export const CLOSE_POPUP = 'CLOSE_POPUP';

export const showPopup = data => ({
    type: SHOW_POPUP,
    payload: data,
});

export const updatePopup = data => ({
    type: UPDATE_POPUP,
    payload: data,
});

export const closePopup = () => ({
    type: CLOSE_POPUP,
});


export const TOGGLE_FEEDBACK_POPUP = 'TOGGLE_FEEDBACK_POPUP';

export const toggleFeedbackPopup = () => ({
    type: TOGGLE_FEEDBACK_POPUP,
});
