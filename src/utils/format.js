import { isSet } from '../utils/common';
import number_format from 'locutus/php/strings/number_format';

/**
* Usage:
* result = formatPlural(count, {
*     '=0': 'Нет записей',
*     '=1': '<b>#</b> запись',
*     '*1': '<b>#</b> запись',
*     '*234': '<b>#</b> записи',
*     'other': '<b>#</b> записей'
* })
*
* @param int number number
* @param object rules объект вида { '=0': 'Нет записей', '=1': '# запись', '*1': '# запись', '*234': '# записи', 'other': '# записей' }
* @return string formatted string
*/
export function formatPlural(number, rules) {
    var ruleCode;

    if (!number) {
        ruleCode = isSet(rules['=0']) ? '=0' : 'other';
    } else if (number == 1) {
        ruleCode = isSet(rules['=1']) ? '=1' : 'other';
    } else if (/1\d$/.test(number)) { // 12, 13, 14 работ (исключение из правила 1-2-3-4)
        ruleCode = 'other';
    } else if (/1$/.test(number)) {
        ruleCode = isSet(rules['*1']) ? '*1' : 'other';
    } else if (/(2|3|4)$/.test(number)) {
        ruleCode = isSet(rules['*234']) ? '*234' : 'other';
    } else {
        ruleCode = 'other';
    }

    return rules[ruleCode].replace('#', number);
}

/**
 * Форматирует число в виде:
 *     32 000 000
 *     32 000 000,56
 * @param  string number
 * @return string
 */
export function formatSum(number) {
    return number_format(number, 2, ',', ' ').replace(',00', '');
}

/**
 * Форматирует число как дробное с минимум 3-мя знаками после запятой (до первой значащей цифрой) и дробную часть оборачивает в span
 * Пример:
 *     38788399 => 38 788,<span class="small">399</span>
 * @param  string number число (сумма в тысячах рублей)
 * @return string
 */
export function formatSumWithSpan(number) {
    const str = roundToFirstSignificantDigit(number);
    return str.replace(/(,\d+)/g, '<span class="small">$1</span>');
}

/**
 * Форматирует число как дробное с минимум 3-мя знаками после запятой (до первой значащей цифрой)
 * Пример:
 *     38788399 => 38 788,399
 * @param  string $number число
 * @return string
 */
export function roundToFirstSignificantDigit(number, minPrecision = 3) {
    /* Метод: определяем позицию первой значащей цифры в дробной части и затем округляем до этой позиции */

    const precisionLimit = 20;

    const str = number_format(number, precisionLimit, ',', ' ');
    const [ , decStr ] = str.split(',');

    let roundPrecision = minPrecision; // результирующая точность, с захватом минимум 1-й значащей цифры

    if (+decStr) {
        let firstNonZeroDigitPos = null;
        for (let i = 0; i < precisionLimit; i++) {
            if (decStr[i] !== '0') {
                firstNonZeroDigitPos = i;
                break;
            }
        }
        if (firstNonZeroDigitPos !== null) { // противного не должно быть, но всё же, на случай атаки инопланетян
            if (firstNonZeroDigitPos >= minPrecision) {
                roundPrecision = firstNonZeroDigitPos + 1;
            }
        }
    }

    return number_format(number, roundPrecision, ',', ' ');
}

/**
 * Форматирует число с десятичной запятой
 * @param  int | float number
 * @return string
 */
export function dotToComma(number) {
    return `${number}`.replace('.', ',');
}
