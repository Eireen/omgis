import * as jsonCycle from './jsonCycle';
import $ from 'jquery';
import React from 'react';

export function clone(obj) {
    return JSON.retrocycle(JSON.parse(JSON.stringify(JSON.decycle(obj))));
}

export function cloneByJQuery(data) {
    if (Array.isArray(data)) {
        return data.reduce((result, item) => {
            result.push($.extend(true, {}, item));
            return result;
        }, []);
    }
    return $.extend(true, {}, data);
}

export function isObject(value) {
    return value !== null && typeof value === 'object';
}

export function isScalar(someVar) {
    return /boolean|number|string/.test(typeof someVar);
}

export class Deferred {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        })
    }
}

/* Возвращает первый элемент chidlren. Нужно для использования с TransitionGroup */
export const FirstChild = props => {
    const childrenArray = React.Children.toArray(props.children);
    return childrenArray[0] || null;
}

/* Функции, используемые рендерером таблицы отчета (он был портирован с PHP) */

export function isSet(value) {
    return value !== undefined && value !== null;
}

export function isEmpty(value) {
    return !isSet(value) || value === '';
}

export function roundTo(number, digits = 0) {
    const multiplier = Math.pow(10, digits);
    return Math.round(number * multiplier) / multiplier;
}

/* Используется для сравнения входных параметров в React-компонентах */
export function areObjectPropsEqual(propsA, propsB, propNames) {
    let areEqual = true;

    for (let propName of propNames) {
        if (propsA[propName] !== propsB[propName]) {
            areEqual = false;
            break;
        }
    }

    return areEqual;
}

/* Shallow copy a subset of object properties */
export function objectSubset(obj, fields) {
    const result = {};

    for (let field of fields) {
        result[field] = obj[field];
    }

    return result;
}
