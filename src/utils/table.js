import * as arrayUtils from './array';
import { html_entity_decode } from './html';
import { isEmpty } from './common';

// Вычисляет кол-во строк в шапке
export function getHeaderTotalRowCount(columns, count)
{
    count++;
    var subcolumnCounts = [], i, l, column;
    for (i = 0, l = columns.length; i < l; i++) {
        column = columns[i];
        if (column.isVisible === false) continue;
        if (column.subcolumns) {
            subcolumnCounts.push(getHeaderTotalRowCount(column.subcolumns, count));
        }
    }
    return subcolumnCounts.length ? arrayUtils.max(subcolumnCounts) : count;
}

// Получает ячейки шапки уровня вложенности level
// level - требуемый уровень вложенности
// currentLevel - уровень вложенности текущей строки
export function getHeaderRow(columns, level, currentLevel = 0)
{
    if (currentLevel === level) {
        return columns;
    }

    var levelColumns = [], i, l, column;
    for (i = 0, l = columns.length; i < l; i++) {
        column = columns[i];
        if (column.isVisible === false) continue;
        if (!isLeaf(column)) {
            levelColumns = levelColumns.concat(getHeaderRow(column.subcolumns, level, currentLevel + 1));
        }
    }
    return levelColumns;
}

// Нумерует ячейки низшего уровня (листья дерева) по порядку (используется при выводе шапки)
export function numberLeaves(columns, index = 0)
{
    var i, l, column;
    for (i = 0, l = columns.length; i < l; i++) {
        column = columns[i];
        if (column.isVisible === false) continue;
        if (isLeaf(column)) {
            column.orderNumber = index++;
        } else {
            index = numberLeaves(column.subcolumns, index);
        }
    }
    return index;
}

export function isLeaf(column) {
    return !column.subcolumns || !column.subcolumns.length;
}

// Вычисляет макс. кол-во подколонок для заданной колонки (для colspan)
export function countColspanValue(column, count = 0)
{
    if (!column.subcolumns || !column.subcolumns.length) {
        return 1;
    }

    var i, l, subcolumn;
    for (i = 0, l = column.subcolumns.length; i < l; i++) {
        subcolumn = column.subcolumns[i];
        count += countColspanValue(subcolumn);
    }
    return count;
}

/* Возвращает стиль ячейки по порядковому номеру (порядковый номер - абсолютный, с учетом span-ов) */
export function getStyle(cellIndex, tableData)
{
    return getColumnProperty('style', null, cellIndex, tableData);
}

/* Возвращает тег ячейки по порядковому номеру (порядковый номер - абсолютный, с учетом span-ов) */
export function getCellTag(cellIndex, tableData)
{
    return getColumnProperty('cellTag', 'td', cellIndex, tableData);
}

export function getUndetailable(cellIndex, tableData)
{
    return getColumnProperty('undetailable', false, cellIndex, tableData);
}

export function getClasses(cellIndex, tableData)
{
    return getColumnProperty('classes', [], cellIndex, tableData);
}

/* Возвращает свойство столбца по порядковому номеру (порядковый номер - абсолютный, с учетом span-ов) */
export function getColumnProperty(property, defaultValue, absoluteCellIndex, tableData)
{
    var counter = 0,
        result = [],
        column, subcolumn, subsubcolumn,
        i, j, k, l, m, n;

    for (i = 0, l = tableData.header.length; i < l; i++) {
        column = tableData.header[i];

        if (column.subcolumns) {
            for (j = 0, m = column.subcolumns.length; j < m; j++) {
                subcolumn = column.subcolumns[j];

                if (subcolumn.subcolumns) {
                    for (k = 0, n = subcolumn.subcolumns.length; k < n; k++) {
                        subsubcolumn = subcolumn.subcolumns[k];

                        if (counter == absoluteCellIndex) {
                            return !isEmpty(subsubcolumn[property]) ? subsubcolumn[property] : defaultValue;
                        } else {
                            counter++;
                        }
                    }
                } else {
                    if (counter == absoluteCellIndex) {
                        return !isEmpty(subcolumn[property]) ? subcolumn[property] : defaultValue;
                    } else {
                        counter++;
                    }
                }

            }
        } else {
            if (counter == absoluteCellIndex) {
                return !isEmpty(column[property]) ? column[property] : defaultValue;
            } else {
                counter++;
            }
        }
    }

    return defaultValue;
}

/* Ищет заданный текст в определенный столбцах строки (используется в "Исполнении инвестсоглашений"). Возвращает булево. */
export function search(query, tableDataRow, columnIndexes)
{
    var texts = columnIndexes.map(function(columnIndex) {
        var text =
            tableDataRow &&
            tableDataRow.columns &&
            tableDataRow.columns[columnIndex] &&
            (
                tableDataRow.columns[columnIndex].value !== undefined ?
                tableDataRow.columns[columnIndex].value :
                tableDataRow.columns[columnIndex]
            ) ||
            '';

        return text;
    });

    if (!texts.length) return false;

    // Предобработка текста: например, убираем кавычки
    var cleanTexts = texts.map(function(text) {
        text = text.replace(/"|'|&(?:quot|laquo|raquo);/g, '');
        text = html_entity_decode(text);
        text = text.toLowerCase();
        return text;
    });

    query = query.toLowerCase();

    var matchingTexts = cleanTexts.filter(function(text) {
        return ~text.indexOf(query);
    });

    return !!matchingTexts.length;
}
