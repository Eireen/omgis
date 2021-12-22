/**
* Преобразование первой буквы в верхний регистр
*/
export function toUpperCaseFirst(str) {
    return (!str
        ? str
        : str.substr(0, 1).toUpperCase() + str.substr(1)
    );
}

export function trim(str) {
    return str.replace(/^\s+|\s+$/g,'');
}
