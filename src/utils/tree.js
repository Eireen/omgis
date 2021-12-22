/**
 * Различные манипуляции с абстрактным деревом
 */

/**
 * Получает узел по ID.
 * @param array  nodes  массив узлов
 * @param array  id  ID
 * @param array  subnodesField  имя поля, хранящего ссылки на узлы-потомки
 * @return array  Узел с запрошенным ID или null, если не найдено
 */
export function getNodeById(nodes, id, subnodesField) {
    for (let node of nodes) {
        if (node.id && node.id == id) {
            if (node[subnodesField]) {
                node.opened = true; // помечаем путь к выбранному элементу
            }
            return node;
        }
    }

    for (let node of nodes) {
        if (node[subnodesField]) {
            const soughtNode = getNodeById(node[subnodesField], id, subnodesField);
            if (soughtNode) {
                node.opened = true; // помечаем путь к выбранному элементу
                return soughtNode;
            }
        }
    }

    return null;
}
