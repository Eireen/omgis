/**
 * Сравнивает 2 программы из раздела "План" таблицы "Финансирование" на странице объекта
 * @param number totalItemCount общее количество элементов
 * @return boolean
 */
export function equal(program1, program2) {
    if (program1.byYears !== program2.byYears ||
        program1.detailed.length !== program2.detailed.length)
    {
        return false;
    }

    if (program1.detailed.length !== program2.detailed.length) {
        return false;
    }

    for (let i in program1.detailed) {
        const subSource = program1.detailed[i];
        if (subSource.byYears !== program2.detailed[i].byYears) {
            return false;
        }
    }

    return true;
}