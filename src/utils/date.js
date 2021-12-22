import strtotime from 'locutus/php/datetime/strtotime';
import { formatPlural } from './format';

const fullMonthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

export function isValidDate(dateString) {
    return !isNaN(Date.parse(dateString));
}

/**
* Дефолтный период для main dashboard
* TODO: сделать задание периода в API и убрать
*/
export function getDefaultPeriod() {
    let defaultRequestsStartDate;
    let defaultRequestsEndDate;

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const isMondayToday = today.getDay() === 1;

    if (isMondayToday) {
        // прошлая неделя
        const lastMondayTimestamp = strtotime('last monday', timestamp(today)); // http://stackoverflow.com/a/36110061/1780443
        const lastSundayTimestamp = strtotime('last sunday', timestamp(today));
        defaultRequestsStartDate = formatYmd(new Date(lastMondayTimestamp * 1000));
        defaultRequestsEndDate = formatYmd(new Date(lastSundayTimestamp * 1000));
    } else {
        // дефолтные настройки
        const currentMonthStart = new Date(year, month, 1);
        defaultRequestsStartDate = formatYmd(currentMonthStart);
        defaultRequestsEndDate = formatYmd(today);
    }

    return {
        start: defaultRequestsStartDate,
        end: defaultRequestsEndDate
    };
}

export function formatYmd(date) {
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    if (month < 10) month = '0' + month;
    if (day < 10) day = '0' + day;
    return [year, month, day].join('-');
}

export function format_dmY(date) {
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    if (month < 10) month = '0' + month;
    if (day < 10) day = '0' + day;
    return [day, month, year].join('.');
}

export function format_dmY_time(date, delimiter = ' ') {
    return format_dmY(date) + delimiter +
        date.toLocaleString('ru', { hour: 'numeric', minute: 'numeric', second: 'numeric' });
}

/* YYYY-MM-DD => DD.MM.YYYY */
export function formatFromYmd(dateStr) {
    var dateChunks = dateStr.split('-'),
        dateObject = new Date(dateChunks[0], dateChunks[1] - 1, dateChunks[2]),
        formatter = new Intl.DateTimeFormat('ru');
    return formatter.format(dateObject);
}

/* DD.MM.YYYY => YYYY-MM-DD */
export function formatDmYToYmd(dateStr) {
    return dateStr.split('.').reverse().join('-');
}

/**
 * Форматирует дату в виде: 15 янв 2014
 * @param  string date  дата в формате YYYY-MM-DD
 * @return string       отформатированная дата
 */
export function format_DD_MMM_YYYY(date, components = ['day', 'month', 'year']) {
    const [ year, month, day ] = date.split('-');

    const resultComponents = [];

    if (~components.indexOf('day')) {
        resultComponents.push(+day);
    }
    if (~components.indexOf('month')) {
        const monthName = fullMonthNames[+month - 1];
        const formattedMonth = monthName.substr(0, 3).toLowerCase();
        resultComponents.push(formattedMonth);
    }
    if (~components.indexOf('year')) {
        resultComponents.push(year);
    }

    return resultComponents.join(' ');
}

export function timestamp(date = new Date()) {
    return Math.round(+date / 1000);
}

/* костыль из-за проблем с парсингом даты формата "2015-12-31 00:00:00" в сафари на iOS
https://stackoverflow.com/a/13363791 */
export function createDateFromString(dateString) {
    const [ date, time = '' ] = `${dateString}`.split(' ');
    const [ year, month = 1, day = 1 ] = date.split('-');
    const [ hours, minutes = 0, secondsWithMs = '' ] = time.split(':');
    const [ seconds, ms = 0 ] = secondsWithMs.split('.');
    return new Date(+year, +month - 1, +day, +hours, +minutes, +seconds, +ms);
}

export function getWeekAgoDate(date) {
    // clone date
    date = date
        ? new Date(+date)
        : new Date();

    date.setDate(date.getDate() - 7);
    return date;
}

export function getMonthAgoDate(date) {
    // clone date
    date = date
        ? new Date(+date)
        : new Date();

    date.setMonth(date.getMonth() - 1);
    return date;
}

/**
 * Форматирует дату в виде: "3 часа 20 минут назад"
 * @param  string date  дата в формате ISO 8601 Extended (YYYY-MM-DDTHH:mm:ss.sssZ)
 * @return string       отформатированная дата
 */
export function formatToTimeAgo(dateString, spaceDivider = '&nbsp;') {
    if (!isValidDate(dateString)) return '';

    const date = new Date(dateString);
    const nowDate = new Date();

    const secondsInMinute = 60;

    const secondsDiff = Math.max((nowDate - date) / 1000, secondsInMinute);

    const secondsInHour = secondsInMinute * 60;
    const secondsInDay = secondsInHour * 24;
    const secondsInMonth = secondsInDay * 30;
    const secondsInYear = secondsInDay * 365;

    const granularityLevels = [
        {
            divisor: secondsInYear,
            pluralSettings: {
                '=0': '',
                '=1': '# год',
                '*1': '# год',
                '*234': '# года',
                'other': '# лет'
            }
        },
        {
            divisor: secondsInMonth,
            pluralSettings: {
                '=0': '',
                '=1': '# месяц',
                '*1': '# месяц',
                '*234': '# месяца',
                'other': '# месяцев'
            }
        },
        {
            divisor: secondsInDay,
            pluralSettings: {
                '=0': '',
                '=1': '# день',
                '*1': '# день',
                '*234': '# дня',
                'other': '# дней'
            }
        },
        {
            divisor: secondsInHour,
            pluralSettings: {
                '=0': '',
                '=1': '# час',
                '*1': '# час',
                '*234': '# часа',
                'other': '# часов'
            }
        },
        {
            divisor: secondsInMinute,
            pluralSettings: {
                '=0': '',
                '=1': '# минуту',
                '*1': '# минуту',
                '*234': '# минуты',
                'other': '# минут'
            }
        },
    ];

    let result = '';

    let secondsRemainder = secondsDiff;
    for (let granularity of granularityLevels) {
        const { divisor, pluralSettings } = granularity;

        const quotient = secondsRemainder / divisor;
        const intQuotient = Math.floor(quotient);

        if (intQuotient <= 0) continue;
        
        // отображаем по 2 единицы времени, начиная со старшей
        const finishLoop = !!result; // если уже одну единицу показали - ставим флаг "отобразить эту и выйти"

        if (result) result += spaceDivider;
        result += formatPlural(intQuotient, pluralSettings);

        secondsRemainder -= intQuotient * divisor;

        if (finishLoop) break;
    };

    if (result) result += '&nbsp;назад';

    return result;
}
