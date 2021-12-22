import axios from 'axios';

// Retrieving point altitude from https://elevation-api.io/
export default class AltitudeApi
{
    static async getAltitudeForPoint(point) {
        // points = { lat: 12.345, lng: 678.912 }

        const result = await AltitudeApi.getAltitudesForPoints([ point ]);

        return (result && result.altitudes
            ? {
                value: result.altitudes[0].alt,
                resolution: result.resolution,
            }
            : null);
    }
    static async getAltitudesForPoints(points) {
        // points = [ { lat: 12.345, lng: 678.912 }, ... ]

        try {
            const response = await axios({
                method: 'post',
                url: 'https://elevation-api.io/api/elevation',
                headers: {
                    'ELEVATION-API-KEY': 'f8b5yee-adaN9EW2g1o6P32TF-7Tb0',
                },
                data: {
                    points: points.map(item => [ item.lat, item.lng ]),
                },
            });
            // console.log(response);
            return {
                altitudes: response.data.elevations.map(item => ({
                    lat: item.lat,
                    lng: item.lon,
                    alt: item.elevation,
                })),
                resolution: response.data.resolution,
            };
        } catch (error) {
            console.log(error);
            return null;
        }
    }
}
