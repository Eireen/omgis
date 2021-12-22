export function ensurePercentRange(value) {
    let validPercent = value;

    const MIN_PERCENT_VALUE = 0;
    const MAX_PERCENT_VALUE = 100;

    if (value < MIN_PERCENT_VALUE) validPercent = MIN_PERCENT_VALUE;
    if (value > MAX_PERCENT_VALUE) validPercent = MAX_PERCENT_VALUE;

    return validPercent;
}

// Округление до заданной точности. Thanks to https://stackoverflow.com/a/11832950/1780443
export function roundToPrecision(number, decimalPlaces) {
    return Math.round((number + Number.EPSILON) * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
}
