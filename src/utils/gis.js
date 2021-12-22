import { roundToPrecision } from './number';

// Конвертация десятичных градусов в формат 40° 26′ 46″
// Thanks to https://stackoverflow.com/a/5786627/1780443
export function decimalDegreesToDMS(degDecimal, separator = '&nbsp;') {
    let degrees = Math.floor(degDecimal);

    const minutesFloat = (degDecimal - degrees) * 60;
    let minutes = Math.floor(minutesFloat);

    const secondsFloat = (minutesFloat - minutes) * 60;
    let seconds = Math.floor(secondsFloat);
    // let seconds = roundToPrecision(secondsFloat, 3);

    // After rounding, the seconds might become 60. These two
    // if-tests are not necessary if no rounding is done.
    if (seconds === 60) {
        minutes++;
        seconds = 0;
    }
    if (minutes === 60) {
        degrees++;
        minutes = 0;
    }

    return degrees + "°" + separator + minutes + "′" + separator + seconds + "″";
}
