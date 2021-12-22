/* Добавляет теги <wbr> для возможности переноса строки после символов, перечисленных в `splitChars`
(добавлено, в частности, для длинных_имён_документов_с_подчеркиваниями, которые вылезали за границы попапа) */
export function improveWordWrap(elemsToImprove) {
    const splitChars = '_'; // may be multiple characters in a single string

    for (let elem of elemsToImprove) {
        if (!elem) continue; // для удобства вызывающих функций, дабы им не приходилось перед вызовом проверять элементы на существование
        const allTextNodes = getAllTextNodesUnder(elem);
        for (let textNode of allTextNodes) {
            const text = textNode.nodeValue;
            for (let splitChar of splitChars) {
                if (!~text.indexOf(splitChar)) continue;

                /* Новый текст оборачиваем в span и вставляем вместо innerHTML = .., чтобы не затереть соседние элементы */
                const newText = text.replace(new RegExp(splitChar, 'g'), `${splitChar}<wbr>`);
                const newTextContainer = document.createElement('span');
                newTextContainer.innerHTML = newText;

                textNode.parentElement.insertBefore(newTextContainer, textNode);
                textNode.remove();
            }
        }
    }
}

function getAllTextNodesUnder(elem) {
    let walk = document.createTreeWalker(elem, NodeFilter.SHOW_TEXT, null, false),
        a = [], n;

    while (n = walk.nextNode()) {
        a.push(n);
    }

    return a;
}
