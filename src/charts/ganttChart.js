/* Полифилл FormData для iOS пока отключен, т.к. ломал форму входа (TypeError).
Добавлялся в commit 1b9c83c0202acd2e4dd9a60c962c51ae1b32f8d2 (см. подробности там) */
//import * as FormDataPolyfill from 'formdata-polyfill';
import { formatDmYToYmd } from '../utils/date';
import { handleAttachmentsTrigger } from '../utils/attachmentsPopup';
import { isIOSSafari } from '../utils/browser';
import $ from 'jquery';
import api from '../api';
import jQueryActual from '../vendor/jquery.actual/jquery.actual.min';
import MagnificPopup from '../vendor/jquery.magnific-popup';
import SelectizeJs from '../vendor/selectize.js/selectize.min.js';
import qs from 'qs';
import ReportTable from '../report/table';
// NPM-модуль 'snapsvg' не используется, т.к. там лежит версия 0.5.1 с багом в animate({ transform: rotate }) (в 0.5.2 снова исправлено, но эта версия ломает многое)
import Snap from 'imports-loader?this=>window,fix=>module.exports=0!../vendor/snap.svg/snap.svg-0.4.1.min';
// import User from '../user/User';

(function() {

    var colors = {
            AQUA:   '#edfaff',
            GREEN:  '#6db627',
            GREY_1: '#e6eaed', // пепельно-серый
            GREY_2: '#6a8294', // синевато-серый, аспидный
            GREY_3: '#ededed',
            NAVY_1: '#0d314d',
            NAVY_2: '#3d4858',
            RED:    '#ee5757',
            WHITE:  '#fff'
        },

        isMobile = window.innerWidth < 1100,

        DEFAULT_TEXT_STYLE = {
            'font-family': 'Roboto, Arial, "Helvetica Neue", Helvetica, sans-serif',
            'font-size': '14px'
        },

        defaultSettings = {
            stageColumn: {
                title: {
                    text: {
                        'font-family': DEFAULT_TEXT_STYLE['font-family'],
                        'font-size': '16px',
                        'font-weight': 'bold',
                        'fill': colors.WHITE
                    }
                },
                width: 160,
                maxWidth: 300,
                topPadding: 28,
                leftPadding: 12,
                rightPadding: 16,
                text: {
                    'font-family': DEFAULT_TEXT_STYLE['font-family'],
                    'font-size': '16px',
                    'font-weight': 'bold',
                    'fill': colors.WHITE
                }
            },
            yearsRow: {
                height: 46,
                topPadding: 4,
                text: {
                    'font-family': DEFAULT_TEXT_STYLE['font-family'],
                    'font-size': '14px',
                    'font-weight': 'bold',
                    'fill': colors.NAVY_2,
                    'text-anchor': 'middle'
                }
            },
            zebra: {
                'odd': {
                    'fill': '#f9fafb',
                    'shape-rendering': 'crispEdges'
                },
                'even': {
                    'fill': '#fff',
                    'shape-rendering': 'crispEdges'
                }
            },
            grid: {
                year: {
                    'stroke': '#e2e6ea',
                    'strokeWidth': 1,
                    'shape-rendering': 'crispEdges'
                },
                month: {
                    'stroke': '#e2e6ea',
                    'strokeWidth': 1,
                    'shape-rendering': 'crispEdges'
                }
            },
            series: {
                main: {
                    topPadding: 0,
                    height: 11
                },
                additional: {
                    topMargin: 3,
                    height: 6
                }
            },
            currentDate: {
                blockHeight: 70,
                line: {
                    'stroke': colors.NAVY_2,
                    'strokeWidth': 3,
                    'opacity': 0.2,
                    'shape-rendering': 'crispEdges'
                },
                label: {
                    topPadding: 15,
                    leftPadding: 12,
                    subLabels: [
                        {
                            'font-family': DEFAULT_TEXT_STYLE['font-family'],
                            'font-size': '14px',
                            'font-weight': 'bold',
                            'fill': colors.NAVY_2
                        },
                        {
                            'font-family': DEFAULT_TEXT_STYLE['font-family'],
                            'font-size': '14px',
                            'fill': colors.NAVY_2
                        }
                    ]
                }
            },
            stageMarks: {
                line: {
                    'stroke': colors.NAVY_2,
                    'strokeWidth': 2,
                    'opacity': 0.2,
                    'shape-rendering': 'crispEdges'
                },
                label: {
                    topPadding: 12,
                    leftPadding: 6,
                    subLabels: [
                        {
                            'font-family': DEFAULT_TEXT_STYLE['font-family'],
                            'font-size': '10px',
                            'font-weight': 'bold',
                            'fill': colors.NAVY_2
                        },
                        {
                            'font-family': DEFAULT_TEXT_STYLE['font-family'],
                            'font-size': '10px',
                            'fill': colors.NAVY_2
                        }
                    ]
                }
            },
            stageHighlighting: {
                labelBackground: '#48b5e7',
                textColor: '#fff'
            },
            cluster: {
                'divider': {
                    'height': 46,
                    'style': {
                        'fill': '#425e74',
                        'shape-rendering': 'crispEdges'
                    }
                },
                'label': {
                    'text': {
                        'font-family': DEFAULT_TEXT_STYLE['font-family'],
                        'font-size': '18px',
                        'font-weight': 'bold',
                        'fill': colors.WHITE,
                        'text-anchor': 'middle',
                        'dominant-baseline': 'central'
                    }
                }
            },
            buttonColumn: {
                width: 46,
                style: {
                    fill: colors.GREY_1,
                    cursor: 'pointer'
                },
                interButtonGap: 1
            },
            alwaysIncludeTodayDate: false  // Если сервер передаст true, то временной диапазон графика всегда будет включать сегодняшнюю дату
        },

        settings,

        STAGE_ROW_HEIGHT = 46,

        svgElement,

        isColoredChart, // в "раскрашенном" графике полосы для каждой строки свой цвет (если указан)
        isSmallLabelText, // если true, текст в метках отображать уменьшенным и нежирным
        chartHeight,
        chartPeriod,

        stageColumnCellBgs = [], // списки фоновых элементов и меток с текстом; используются для подгонки ширины 1-го столбца под текст
        stageColumnLabels = [],
        clusterHeights = [],

        tempParent,

        isInPopup, // отрисовывается ли график во всплывающем окне
        isInAccordeonBody, // отрисовывается ли график в раскрывающейся секции (например, на странице объекта)
        mobileChartPadding = 5, // отступы график от экрана по бокам для мобил (впритык к краям экрана не очень красиво)
        mobilePopupMargin = 8, // отступы всплывающего окна от экрана по бокам для мобил
        mobilePopupPadding = 25, // поля во всплывающем окне для мобил
        maxButtonCount = 0, // макс. кол-во кнопок в строке справа от тела графика

        stageColumnTitle = 'Объекты',

        clickableElemsByRow = [], // элементы, визуально сгруппированные по строкам (для навешивания обработчика клика по строке)
        clickableElemsByStageId = {}, // то же, что clickableElemsByRow, только группировка по id этапов, если они заданы

        // Эта переменная в данный момент не используется (раньше использовалась)
        // TODO: удалить (преобразовать), когда будет сделана общая система навешивания обработчиков на все остальные элементы графика
        stageNameCellClickHandlers = [],

        clusterCount = 0,

        sort = {}, // сортировка кластеров, в формате {"<clusterIndex>": { param: "<param>", direction: "<direction>" }}

        rowTooltipOptions = {
            side: 'top',
            updateAnimation: null,
            theme: ['tooltipster-shadow', 'tooltipster-white'],
            contentAsHTML: true,
            maxWidth: 500,
            animationDuration: 150,
            interactive: true,
            trigger: 'click',
            zIndex: 500,
            functionPosition: function(instance, helper, position) {
                position.coord.top += 10;
                return position;
            }
        },

        $form,

        currentPopupConfig, // костыль для возможности перезагрузки попапа после submit-а формы из него
        popupWrapHTML = ['<div class="white-popup smaller-padding">', '</div>'];


    drawCharts();

    function drawCharts() {
        var chartContainers = document.querySelectorAll('[data-gantt-chart]'),
            container, i, l;

        for (i = 0, l = chartContainers.length; i < l; i++) {
            container = chartContainers[i];
            drawChart(container);
        }
    }

    function drawChart(container, chartData) { // в chartData можно передать уже имеющийся JS-массив данных
        if (!chartData) {
            chartData = getData(container);
        }
        if (!chartData && !chartData.data) return;

        // TODO: ужасный костыль, убрать
        // Настройки пришлось вынести в defaultSettings и клонировать оттуда, т.к. settings модифицируются
        settings = cloneViaJSON(defaultSettings);
        mergeCustomSettings(chartData);

        retrieveSort(container);
        var preSorts = chartData.sorts;

        var data = chartData.data || chartData;
        var originalData = data;
        var isClustered = chartData.clustered;

        if (isClustered) {
            data = originalData = normalizeClusteredData(data);
            clusterCount = data.length;
            assignClusterIndex(data);
            data = flattenClusters(data, preSorts);
        }

        data = flattenSubstages(data);

        const rowHeights = []; // вычисляемые по текстовым меткам высоты строк
        
        /* SVG-ноды, составляющие этап, сгруппируем в JS-массив для возможности сворачивания/разворачивания дерева этапов.
        Такой костыль пришлось применить из-за того, что элементы одного этапа рендерятся в разных функциях и в разных группах.
        Правильнее объединить элементы этапа в SVG-группу <g>, но тогда придется перелопатить код рендера, плюс вертикальные полосы шкалы
        придется рисовать для каждого этапа отдельно.
        TODO: всё-таки попробовать переписать рендер по группам, т.к. анимация не очень красиво работает -
        горизонтальные полосы вложенного этапа при своём плавном появлении отображаются поверх фона следующего этапа, т.к.
        эти полосы рендерятся все вместе в одной группе после рендера всего фона */
        const elementsByStage = [];
        const visibleStageIds = []; // ID этапов, видимых в данный момент

        isColoredChart = container.dataset.colored !== undefined;
        isSmallLabelText = container.dataset.smallLabelText !== undefined;
        isInPopup = ~container.parentNode.parentNode.className.indexOf('mfp-content');
        isInAccordeonBody = ~container.parentNode.parentNode.className.indexOf('acc_b');
        maxButtonCount = calcMaxButtonCount(chartData, data);

        calcMobileChartPadding();

        initClickableElemsByRow(data);

        chartHeight = calcChartHeight(data, visibleStageIds, rowHeights);

        svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgElement.setAttribute('width', isMobile ? getAvailableWidth() : '100%');
        svgElement.setAttribute('height', chartHeight);
        svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svgElement.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        if (isMobile && !isInPopup && !isInAccordeonBody) {
            svgElement.style.marginLeft = mobileChartPadding + 'px';
        }

        tempAttachToDOM(svgElement);

        calcStageColumnWidth(getAvailableWidth(container));

        var s = Snap(svgElement);

        var allMarks = chartData.marks || [];

        var todayDate = new Date();
        var todayDateMs = +todayDate;

        chartPeriod = getChartPeriod(data, chartData.marks, settings.alwaysIncludeTodayDate ? todayDate : null);
        if (!chartPeriod.min || !chartPeriod.max) return;

        if (todayDateMs >= chartPeriod.min && todayDateMs <= chartPeriod.max) {
            var todayMark = {
                    date: todayDate,
                    label: [
                        'Сегодня',
                        formatDate(todayDate)
                    ]
                },
                // метка "Сегодня" в `marks` входить не должна; объединяем ее с `marks` для удобства вычисления взаимного расположения меток
                allMarks = [todayMark].concat(allMarks);
        }

        normalizeMarks(allMarks);

        var minYear = chartPeriod.min.getFullYear(),
            maxYear = chartPeriod.max.getFullYear();


        // NB: cellWidth - дробное число, при использовании округлять результат
        const { gridColumnWidth: cellWidth, timescaleHeight, gridLineCount, yearLineDivisor, yearLineAttrs } = drawTimescale(s, container, minYear, maxYear);
        // WARNING: если будет снова включена функция adjustStageColumnWidth(), то в drawTimescale() необходимо учесть, что ширина столбца с названиями этапов может быть изменена в drawStageColumn()


        var chartHasSubStages = calcChartHasSubStages(data); // имеются ли в графике вложенные подэтапы (разворачивающиеся в дерево)
        drawStageColumn(s, data, chartHasSubStages, elementsByStage, visibleStageIds, rowHeights, timescaleHeight);

        svgElement.setAttribute('height', chartHeight); // chartHeight может измениться после отрисовки в drawStageColumn()

        drawBody(s, data, originalData, minYear, maxYear, container, isClustered, elementsByStage, rowHeights, cellWidth, timescaleHeight, gridLineCount, yearLineDivisor, yearLineAttrs);

        drawMarks(s, allMarks, minYear, maxYear, container);

        $form = null;
        if (maxButtonCount) drawButtonColumn(s, data, chartData.sideButtons, container, elementsByStage, rowHeights, timescaleHeight);

        showVisibleStages(data, s, elementsByStage, visibleStageIds, rowHeights, timescaleHeight, false);

        addRowClickHandlers(data, s, elementsByStage, visibleStageIds, rowHeights, timescaleHeight);

        initClickableElemsByStageId(data); // группируем элементы строк по их id для возможности фильтрации (посдветки определенных)

        clearNodeChildren(container);
        container.appendChild(svgElement);

        if (chartData.form) {
            $(container).addClass('has_form').append(chartData.form);
        }

        container.parentElement.classList.remove('loading');

        initTooltips(data);

        tempParent.remove();
    }

    function mergeCustomSettings(chartData) {
        const customSettings = chartData.settings;
        if (!customSettings) return;

        // TODO: сделать рекурсивный мёрж
        for (let field of ['stageColumn']) {
            if (customSettings[field]) {
                Object.assign(settings[field], customSettings[field]);
            }
        }
    }

    /* Обрабатывает случай, когда ширина колонки с подписями задана в % (с сервера может прийти) */
    function calcStageColumnWidth(chartWidth) {
        const match = ('' + settings.stageColumn.width).match(/^(\d+)\%$/);
        if (!match) return;

        settings.stageColumn.width = Math.round(match[1] / 100 * chartWidth);
    }

    /* Создает скрытый элемент и временно присоединяет график к нему, чтобы можно получать размеры рендерящихся элементов */
    function tempAttachToDOM(svgElement) {
        tempParent = document.createElement('div');

        tempParent.style.position = 'absolute';
        tempParent.style.top = '-99999px';
        tempParent.style.left = '-99999px';

        tempParent.appendChild(svgElement);

        document.body.appendChild(tempParent);
    }

    function clearNodeChildren(node) {
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    }

    function getData(container) {
        var data = container.dataset.chartData;

        try {
            data = JSON.parse(data);
        } catch(e) {
            console.log(e);
            data = null;
        }

        return data;
    }

    function retrieveSort(container) {
        if (!container.dataset.sort) return;

        try {
            sort = JSON.parse(container.dataset.sort);
        } catch(e) {
            console.log(e);
        }
    }

    /* Вычищает пустые кластера */
    function normalizeClusteredData(data) {
        var cluster, i, l;

        for (i = 0, l = data.length; i < l; i++) {
            cluster = data[i];
            if (!cluster || !cluster.rows || !cluster.rows.length) {
                data.splice(i, 1);
                i--;
                l--;
            }
        }

        return data;
    }

    /* Строки могут быть сгруппированы по этапам - в этом случае извлекаем их из групп в один список для удобства обхода */
    function flattenClusters(data, preSorts) {
        var result = [], cluster, i, l;

        for (i = 0, l = data.length; i < l; i++) {
            cluster = data[i];
            if (!cluster.rows || !cluster.rows.length) continue;
            result = result.concat(sortClusterRows(i, cluster.rows, preSorts));
        }

        return result;
    }

    /* Превращаем дерево этапов (многомерный массив) в плоский список этапов, сохраняя при этом ссылки на родительские элементы */
    function flattenSubstages(data, parentStageId = null, level = 0, parentResultListLength = 0) {
        var result = [], stage, orderNumber, i, l;

        for (i = 0, l = data.length; i < l; i++) {
            stage = data[i];
            stage._parentStageId = parentStageId;
            stage._level = level;
            stage._globalOrderNumber = parentResultListLength + result.length; // _globalOrderNumber возьмём за уникальный ID этапа
            result.push(stage);
            if (!stage.substages || !stage.substages.length) continue;
            result = result.concat(
                flattenSubstages(stage.substages, stage._globalOrderNumber, level + 1, parentResultListLength + result.length)
            );
        }

        return result;
    }

    function sortClusterRows(clusterIndex, clusterRows, preSorts) {
        var clusterSort = sort[clusterIndex];

        if (!clusterSort) return clusterRows;

        var preSort = preSorts[clusterSort.param],
            result = [],
            rowId, row, i, l;

        for (i = 0, l = preSort.length; i < l; i++) {
            rowId = preSort[i];
            row = clusterRows.find(function(item) {
                return item.id === rowId;
            });
            if (!row) continue;
            result.push(row);
        }

        if (clusterRows.length !== result.length) {
            alert('Ошибка: нестыковка содержимого кластера и предсортировки для clusterIndex = ' + clusterIndex);
            return clusterRows;
        }

        if (clusterSort.direction === 'desc') {
            result.reverse();
        }

        return result;
    }

    /* Записываем индексы кластеров в объекты строк - т.к. функции отрисовки работают с массивами stage-ей и не знают о кластерах */
    function assignClusterIndex(data) {
        var result = [], cluster, stage, i, j, l, m;

        for (i = 0, l = data.length; i < l; i++) {
            cluster = data[i];
            if (!cluster.rows) continue;
            for (j = 0, m = cluster.rows.length; j < m; j++) {
                stage = cluster.rows[j];
                stage.clusterIndex = i;
            }
        }
    }

    function calcChartHeight(data, visibleStageIds, rowHeights, timescaleHeight = 0) {
        var bodyHeight, stageCount, i, l;

        if (!rowHeights.length) {
            // Min высота графика (с однострочными метками)
            stageCount = data.length;
            bodyHeight = STAGE_ROW_HEIGHT * stageCount;
        } else {
            // Многострочные метки отрисовали; считаем с ними
            bodyHeight = getVisibleStagesCommonHeight(rowHeights, visibleStageIds);
        }

        bodyHeight += clusterCount * settings.cluster.divider.height;

        return settings.currentDate.blockHeight + timescaleHeight + bodyHeight;
    }

    function calcMaxButtonCount(chartData, data) {
        var maxCount = 0, stage, i, l;

        for (i = 0, l = data.length; i < l; i++) {
            stage = data[i];
            if (stage.sideButtons && stage.sideButtons.length && stage.sideButtons.length > maxCount) {
                maxCount = stage.sideButtons.length;
            }
        }

        if (!maxCount && chartData.sideButtons && chartData.sideButtons.length) {
            maxCount += chartData.sideButtons.length;
        }

        return maxCount;
    }

    function calcChartHasSubStages(data) {
        for (let stage of data) {
            if (stage.substages && stage.substages.length) return true;
        }
        return false;
    }

    /* Определяет min и max даты графика (возвращает объекты Date) */
    function getChartPeriod(flattenData, marks, todayDate = null) {
        var minDateMs = null, // даты в миллисекундах
            maxDateMs = null,
            stage, series, period,
            startDate, endDate,
            startDateMs, endDateMs,
            i, l, j, m, k, n;

        for (i = 0, l = flattenData.length; i < l; i++) {
            stage = flattenData[i];
            if (!stage.series) continue;
            for (j = 0, m = stage.series.length; j < m; j++) {
                series = stage.series[j];
                if (!series.periods) continue;
                for (k = 0, n = series.periods.length; k < n; k++) {
                    period = series.periods[k];

                    startDate = period.startDate;
                    endDate = period.endDate;
                    if (!startDate || !endDate) continue;

                    startDateMs = Date.parse(startDate);
                    endDateMs = Date.parse(endDate);

                    if (!minDateMs || startDateMs < minDateMs) {
                        minDateMs = startDateMs;
                    }
                    if (!maxDateMs || endDateMs > maxDateMs) {
                        maxDateMs = endDateMs;
                    }
                }
            }

            /* Проверить также метки */
            // TODO копипаста снизу, отрефакторить
            const stageMarks = stage.marks || [];
            for (j = 0, m = stageMarks.length; j < m; j++) {
                const stageMark = stageMarks[j];

                if (!stageMark.date) continue;

                const dateMs = Date.parse(stageMark.date);

                if (!minDateMs || dateMs < minDateMs) {
                    minDateMs = dateMs;
                }
                if (!maxDateMs || dateMs > maxDateMs) {
                    maxDateMs = dateMs;
                }
            }
        }

        /* Проверить также метки */
        var mark, dateMs;
        for (i = 0, l = marks && marks.length || 0; i < l; i++) {
            mark = marks[i];

            if (!mark.date) continue;

            dateMs = Date.parse(mark.date);

            if (!minDateMs || dateMs < minDateMs) {
                minDateMs = dateMs;
            }
            if (!maxDateMs || dateMs > maxDateMs) {
                maxDateMs = dateMs;
            }
        }

        /* Учесть сегодняшнюю дату, если передали (должна быть включена спец. опция alwaysIncludeTodayDate) */
        if (todayDate) {
            var todayDateMs = +todayDate;
            if (todayDateMs > maxDateMs) {
                maxDateMs = todayDateMs;
            }
            if (todayDateMs < minDateMs) {
                minDateMs = todayDateMs;
            }
        }

        return {
            min: minDateMs && new Date(minDateMs),
            max: maxDateMs && new Date(maxDateMs)
        };
    }

    /* Столбец с названиями этапов */
    function drawStageColumn(surface, data, chartHasSubStages, elementsByStage, visibleStageIds, rowHeights, timescaleHeight) {
        var stageColumnGroup = surface.g().attr({ id: 'stages' }),
            cellGroup, stage, i, j, l, m;

        if (!isColoredChart) {
            settings.stageColumn.text.fill = colors.NAVY_2;
        }
        if (isSmallLabelText) {
            settings.stageColumn.text['font-size'] = '14px';
            settings.stageColumn.text['font-weight'] = 'normal';
        }

        stageColumnCellBgs = [];
        stageColumnLabels = [];
        // ХЗ зачем эта строка была нужна; закомменчена после добавления возможности кастомизации ширины колонки
        // TODO: убрать, если не понадобится
        //settings.stageColumn.width = defaultSettings.stageColumn.width;

        stageColumnGroup.add(drawStageColumnTitle(surface, stageColumnTitle, timescaleHeight));

        for (i = 0, l = data.length; i < l; i++) {
            stage = data[i];
            cellGroup = drawStageColumnCell(surface, stage, i, visibleStageIds, rowHeights, timescaleHeight, chartHasSubStages);
            stageColumnGroup.add(cellGroup);

            elementsByStage[i] = { label: cellGroup };
        }

        chartHeight = calcChartHeight(data, visibleStageIds, rowHeights, timescaleHeight); // пересчитываем реальную высоту графика с учетом многострочных меток

        //adjustStageColumnWidth(data); // временно отключено, т.к. практически бесполезно; TODO: убрать, если долго не понадобится
        // WARNING: если будет снова включена функция adjustStageColumnWidth(), то в drawTimescale() необходимо учесть, что ширина столбца с названиями этапов может быть изменена в drawStageColumn()
    }

    function drawStageColumnCell(surface, stage, orderNumber, visibleStageIds, rowHeights, timescaleHeight, chartHasSubStages = false) {
        const LEVEL_OFFSET_X = 16; // отступ вложенного уровня
        const stageLevel = stage._level || 0;
        const hasSubstages = stage.substages && stage.substages.length;

        var clusterDividersHeight = stage.clusterIndex !== undefined
                ? (stage.clusterIndex + 1) * settings.cluster.divider.height
                : 0,
            cellCoords = {
                x: 0,
                y: settings.currentDate.blockHeight + timescaleHeight
                    /* + getVisibleStagesCommonHeight(rowHeights, visibleStageIds, orderNumber)*/ + clusterDividersHeight
            },
            stageLevelOffsetX = chartHasSubStages
                ? LEVEL_OFFSET_X * (stageLevel + 1)
                : 0,
            textCoords = {
                x: cellCoords.x + settings.stageColumn.leftPadding + stageLevelOffsetX,
                y: cellCoords.y + settings.stageColumn.topPadding
            },
            cellColor = stage.label && stage.label.background ? '#' + stage.label.background : colors.GREY_3,
            textColor = stage.label && stage.label.color ? '#' + stage.label.color : settings.stageColumn.text.fill,
            cellGroup = surface.g(), cell, labelGroup = surface.g(), textBlockElement,
            singleLineTextHeight, multiLineTextHeight, heightIncrement, newHeight;

        if (!isColoredChart) {
            settings.stageColumn.text.fill = colors.NAVY_2;
        }

        cell = surface
            .rect(cellCoords.x, cellCoords.y, settings.stageColumn.width, STAGE_ROW_HEIGHT)
            .attr({
                fill: cellColor
            })
            .data('isBackground', true);

        stageColumnCellBgs.push(cell);

        // Замерим высоту этапа с одной строкой текста
        textBlockElement = surface.text(textCoords.x, textCoords.y, 'Testbgq');
        labelGroup.append(textBlockElement);
        singleLineTextHeight = labelGroup.getBBox().height;
        textBlockElement.remove();

        /* Наименование строки может состоять из простой строки или нескольких блоков текста с разным стилем */

        // Бэкпорт для простой строки вместо массива
        var textBlocks = !Array.isArray(stage.stage)  // Простой текст
            ? [
                {
                    text: stage.stage
                }
            ]
            : stage.stage;

        const DEFAULT_FONT_SIZE = parseInt(settings.stageColumn.text['font-size']);

        var currentTextCoords = Object.assign({}, textCoords);
        let isFirstTextBlock = true;
        for (let textBlock of textBlocks) {
            if (!textBlock.text) continue;

            const textBlockStyle = Object.assign({},
                settings.stageColumn.text,
                {
                    fill: textColor
                },
                textBlock.style || {}
            );

            const fontSize = textBlockStyle['font-size'] && parseInt(textBlockStyle['font-size'])
                || DEFAULT_FONT_SIZE;

            const topMargin = isFirstTextBlock
                ? 0
                : (textBlock.topMargin !== undefined
                    ? textBlock.topMargin
                    : Math.floor(0.625 * fontSize) // из расчёта на fontSize = 16
                );
            currentTextCoords.y += topMargin;

            textBlockElement = surface
                .text(currentTextCoords.x, currentTextCoords.y, textBlock.text)
                .attr(textBlockStyle);
            labelGroup.append(textBlockElement);

            const textWidth = settings.stageColumn.width - settings.stageColumn.leftPadding - stageLevelOffsetX - settings.stageColumn.rightPadding;
            svg_textMultiline(textBlockElement.node, currentTextCoords.x, textWidth, fontSize);
            multiLineTextHeight = textBlockElement.getBBox().height;
            currentTextCoords.y += multiLineTextHeight;

            isFirstTextBlock = false;
        }

        multiLineTextHeight = labelGroup.getBBox().height;
        heightIncrement = multiLineTextHeight - singleLineTextHeight;
        newHeight = STAGE_ROW_HEIGHT + heightIncrement;
        cell.attr({
            height: newHeight
        });
        labelGroup.data('isLabelText', true);
        rowHeights.push(newHeight);

        stageColumnLabels.push(labelGroup);

        clickableElemsByRow[orderNumber].push(cell);
        clickableElemsByRow[orderNumber].push(labelGroup);

        let expandArrow;
        if (hasSubstages) {
            expandArrow = drawExpandArrow(surface, textCoords, textColor);
            clickableElemsByRow[orderNumber].push(expandArrow);
        }

        if (stage.link) {
            cellGroup.add(wrapToLink(cell, stage.link));
            cellGroup.add(wrapToLink(labelGroup, stage.link));
            if (expandArrow) cellGroup.add(wrapToLink(expandArrow, stage.link));
        } else {
            cellGroup.add(cell);
            cellGroup.add(labelGroup);
            if (expandArrow) cellGroup.add(expandArrow);
        }

        if (!stage.subchart && !stage.popup && !stage.link && stageNameCellClickHandlers.length) {
            bindClickHandlers(cell, stageNameCellClickHandlers, stage);
            bindClickHandlers(labelGroup, stageNameCellClickHandlers, stage);
            addHighlightToStageNameCell(cell, labelGroup);
        }

        if (stageLevel === 0) {
            visibleStageIds.push(stage._globalOrderNumber);
        }

        // Пока скрываем все этапы - потом покажем нужные по списку visibleStageIds
        cellGroup.attr({ visibility: 'hidden', opacity: 0 });

        return cellGroup;
    }

    function drawExpandArrow(surface, textCoords, color) {
        var x1 = textCoords.x - 18;
        var y1 = textCoords.y - 9;
        var x2 = textCoords.x - 13;
        var y2 = textCoords.y - 4;
        var x3 = textCoords.x - 8;
        var y3 = y1;
        var arrow = surface
            .polyline([ x1, y1, x2, y2, x3, y3 ])
            .attr({
                stroke: color,
                fill: 'none',
                'stroke-width': 3,
                'stroke-linecap': 'round',
                class: 'gantt_expand_arrow'
            });
        return arrow;
    }

    function addHighlightToStageNameCell(cell, label) {
        function enter() {
            cell
                .data('hoverBackupFill', cell.attr('fill')) // запоминаем исходный цвет ячейки
                .attr({ fill: colors.AQUA });

            label
                .data('hoverBackupFill', label.attr('fill')) // запоминаем исходный цвет текста
                .attr({ fill: settings.stageColumn.text.fill });
        }

        function leave() {
            cell.attr({
                fill: cell.data('hoverBackupFill') // восстанавливаем исходный цвет ячейки
            });

            label.attr({
                fill: label.data('hoverBackupFill') // восстанавливаем исходный цвет текста
            });
        }

        cell.hover(enter, leave).attr({ cursor: 'pointer' });
        label.hover(enter, leave).attr({ cursor: 'pointer' });
    }

    function drawStageColumnTitle(surface, title, cellHeight) {
        var cellCoords = {
                x: 0,
                y: settings.currentDate.blockHeight
            },
            cellSize = {
                width: settings.stageColumn.width,
                height: cellHeight
            },
            cell, label;

        cell = surface
            .rect(cellCoords.x, cellCoords.y, cellSize.width, cellSize.height)
            .attr({
                fill: colors.NAVY_1
            });

        stageColumnCellBgs.push(cell);

        label = surface
            .text(cellCoords.x, cellCoords.y, title)  // координаты-заглушки; точные подсчитаем после добавления в дерево
            .attr(settings.stageColumn.title.text);

        stageColumnLabels.push(label);

        // Вычисляем координаты текста для вертикального центрирования в ячейке
        var textCoords = {
            x: cellCoords.x + settings.stageColumn.leftPadding,
            y: Math.round(cellCoords.y + cell.getBBox().height / 2 + label.getBBox().height / 2 - 4) // 4 - подвинуть текст вверх на глаз, иначе слишком смещено вниз от центра
        };
        label.attr({ x: textCoords.x, y: textCoords.y });

        return surface.g(cell, label);
    }

    function adjustStageColumnWidth(stages) {
        var maxLabelWidth = 0,
            bBox, stageCellWidth, i, l;

        /* Определяем самую длинную строку */
        for (i = 0, l = stageColumnLabels.length; i < l; i++) {
            bBox = stageColumnLabels[i].getBBox();
            if (bBox.width > maxLabelWidth) {
                maxLabelWidth = bBox.width;
            }
        }

        const stagesLevelCount = getLevelCount(stages);

        const LEVEL_OFFSET_X = 16; // отступ вложенного уровня
        stageCellWidth = maxLabelWidth + stagesLevelCount * LEVEL_OFFSET_X + settings.stageColumn.leftPadding + settings.stageColumn.rightPadding;
        if (settings.stageColumn.width === defaultSettings.stageColumn.width) {
            // Для кастомной ширины не будем ставить ограничение maxWidth
            // TODO: возможно, и вообще убрать этот maxWidth, практически не нужен
            stageCellWidth = stageCellWidth > settings.stageColumn.maxWidth ? settings.stageColumn.maxWidth : stageCellWidth;
        }

        /* Устанавливаем новую ширину фоновым элементам */
        for (i = 0, l = stageColumnCellBgs.length; i < l; i++) {
            stageColumnCellBgs[i].attr({ width: stageCellWidth });
        }

        settings.stageColumn.width = stageCellWidth;
    }

    function getLevelCount(flattenStages) {
        let maxLevel = 0;

        for (let i = 0, l = flattenStages.length; i < l; i++) {
            const stage = flattenStages[i];

            if (stage._level > maxLevel) {
                maxLevel = stage._level;
            }
        }

        return maxLevel + 1;
    }

    function drawTimescale(surface, container, minYear, maxYear) {
        var chartBodyWidth = getChartBodyWidth(container);

        const { yearsRowGroup } = drawYearsRow(surface, chartBodyWidth, minYear, maxYear);

        let yearCount = maxYear - minYear + 1;
        let gridColumnWidth = chartBodyWidth / yearCount;
        let timescaleHeight = yearsRowGroup.getBBox().height;
        let gridLineCount = maxYear - minYear;
        let yearLineDivisor = null;
        let needHighlightYearLines = false;

        const yearsRowGroupBBox = yearsRowGroup.getBBox();
        const nextRowStartY = yearsRowGroupBBox.y + yearsRowGroupBBox.height + 0.5; // отступ в 0.5 добавляем, чтобы между строками была еле заметная граница. Если увеличить на 1 пиксель - щель слишком бросается в глаза. Если вообще без границы, тоже не очень смотрится

        let estimatedMonthColumnWidth = getMonthColumnWidth(chartBodyWidth, minYear, maxYear);
        if (needMonthScale(estimatedMonthColumnWidth)) {
            const { monthsRowGroup } = drawMonthsRow(surface, minYear, maxYear, estimatedMonthColumnWidth, nextRowStartY);
            timescaleHeight += monthsRowGroup.getBBox().height;
            gridLineCount = (maxYear - minYear + 1) * 12 - 1;
            yearLineDivisor = 12;
            needHighlightYearLines = true;
            gridColumnWidth = estimatedMonthColumnWidth;
        } else {
            let estimatedQuarterColumnWidth = getQuarterColumnWidth(chartBodyWidth, minYear, maxYear);
            if (needQuarterScale(estimatedQuarterColumnWidth)) {
                const { quartersRowGroup } = drawQuartersRow(surface, minYear, maxYear, estimatedQuarterColumnWidth, nextRowStartY);
                timescaleHeight += quartersRowGroup.getBBox().height;
                gridLineCount = (maxYear - minYear + 1) * 4 - 1;
                yearLineDivisor = 4;
                needHighlightYearLines = true;
                gridColumnWidth = estimatedQuarterColumnWidth;
            }
        }

        const yearLineAttrs = needHighlightYearLines
            ? { stroke: '#b5bfc9' }
            : null;

        return { gridColumnWidth, timescaleHeight, gridLineCount, yearLineDivisor, yearLineAttrs };
    }

    function drawYearsRow(surface, chartBodyWidth, minYear, maxYear) {
        var yearCount = maxYear - minYear + 1,
            columnWidth = chartBodyWidth / yearCount,
            yearsRowGroup = surface.g().attr({ id: 'years' }),
            year = minYear,
            i = 0;

        while (year <= maxYear) {
            yearsRowGroup.add(drawYearsRowCell(surface, columnWidth, year, i));
            year++;
            i++;
        }

        return { yearsRowGroup };
    }

    function drawYearsRowCell(surface, columnWidth, labelText, orderNumber) {
        var cellCoords = {
                x: Math.round(settings.stageColumn.width + columnWidth * orderNumber),
                y: settings.currentDate.blockHeight
            },
            textCoords = { // текст будет выравниваться по центру относительно заданных координат
                x: cellCoords.x + Math.round(columnWidth / 2),
                y: cellCoords.y + Math.round(STAGE_ROW_HEIGHT / 2) + settings.yearsRow.topPadding // небольшой сдвиг от центра ячейки вниз
            },
            cellColor = colors.GREY_1,
            cell, label;

        cell = surface
            .rect(cellCoords.x, cellCoords.y, Math.round(columnWidth) + 1, STAGE_ROW_HEIGHT)
            .attr({
                fill: cellColor
            });

        label = surface
            .text(textCoords.x, textCoords.y, labelText)
            .attr(settings.yearsRow.text);

        return surface.g(cell, label);
    }

    function drawMonthsRow(surface, minYear, maxYear, columnWidth, startY) {
        var monthsRowGroup = surface.g().attr({ class: 'gantt_timescale_months' });
        var monthLabels = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
        var yearCount = maxYear - minYear + 1;
        var yearMonthCount = 12;
        var totalMonthCount = yearCount * yearMonthCount

        for (let i = 0; i < totalMonthCount; i++) {
            const monthIndex = i % yearMonthCount;
            const monthLabel = monthLabels[monthIndex];
            monthsRowGroup.add(drawSecondaryTimescaleRowCell(surface, columnWidth, startY, monthLabel, monthIndex));
        }

        return { monthsRowGroup };
    }

    function drawQuartersRow(surface, minYear, maxYear, columnWidth, startY) {
        var quartersRowGroup = surface.g().attr({ class: 'gantt_timescale_quarters' });
        var quarterLabels = ['I', 'II', 'III', 'IV'];
        var yearCount = maxYear - minYear + 1;
        var yearQuarterCount = 4;
        var totalQuarterCount = yearCount * yearQuarterCount

        for (let i = 0; i < totalQuarterCount; i++) {
            const quarterIndex = i % yearQuarterCount;
            const quarterLabel = `${quarterLabels[quarterIndex]} кв.`;
            quartersRowGroup.add(drawSecondaryTimescaleRowCell(surface, columnWidth, startY, quarterLabel, i));
        }

        return { quartersRowGroup };
    }

    /* Отрисовка ячейки на шкале месяцев или кварталов */
    function drawSecondaryTimescaleRowCell(surface, columnWidth, startY, labelText, orderNumber) {
        var cellCoords = {
                x: Math.round(settings.stageColumn.width + columnWidth * orderNumber),
                y: startY
            },
            textCoords = { // текст будет выравниваться по центру относительно заданных координат
                x: cellCoords.x + Math.round(columnWidth / 2),
                y: cellCoords.y + Math.round(STAGE_ROW_HEIGHT / 2) + settings.yearsRow.topPadding // небольшой сдвиг от центра ячейки вниз
            },
            cellColor = colors.GREY_1,
            cell, label;

        cell = surface
            .rect(cellCoords.x, cellCoords.y, Math.round(columnWidth) + 1, STAGE_ROW_HEIGHT)
            .attr({
                fill: cellColor
            });

        label = surface
            .text(textCoords.x, textCoords.y, labelText)
            .attr(settings.yearsRow.text);

        return surface.g(cell, label);
    }

    function drawBody(surface, flattenData, originalData, minYear, maxYear, container, isClustered, elementsByStage, rowHeights, cellWidth, timescaleHeight, gridLineCount, yearLineDivisor, yearLineAttrs) {
        var bodyGroup = surface.g().attr({ id: 'body' });

        bodyGroup.add(drawBackZebra(surface, flattenData, container, elementsByStage, rowHeights, timescaleHeight));
        bodyGroup.add(drawGrid(surface, gridLineCount, cellWidth, timescaleHeight, yearLineDivisor, yearLineAttrs));

        bodyGroup.add(drawStages(surface, flattenData, minYear, maxYear, container, elementsByStage, rowHeights, timescaleHeight));

        if (isClustered) {
            bodyGroup.add(drawClusterDividers(surface, container, originalData, rowHeights, timescaleHeight));
            bodyGroup.add(drawClusterLabels(surface, container, originalData, rowHeights, timescaleHeight));
            bodyGroup.add(drawClusterControls(surface, container, originalData, rowHeights, timescaleHeight));
        }
    }

    /* Серые полосы на фоне */
    function drawBackZebra(surface, data, container, elementsByStage, rowHeights, timescaleHeight) {
        var zebraGroup = surface.g().attr({ id: 'zebra' }),
            chartBodyWidth = getChartBodyWidth(container),
            startY, stripe, rowClusterIndex, clusterDividersHeight, zebraItem, i, l;

        /* Белые полосы тоже придется отрендерить, чтобы навесить на них обработчик клика */
        for (i = 0, l = data.length; i < l; i++) {
            rowClusterIndex = data[i].clusterIndex;
            clusterDividersHeight = rowClusterIndex !== undefined
                ? settings.cluster.divider.height * (rowClusterIndex + 1)
                : 0;
            startY = settings.currentDate.blockHeight + timescaleHeight + /*getVisibleStagesCommonHeight(rowHeights, visibleStageIds, i) +*/ clusterDividersHeight;
            stripe = surface
                .rect(settings.stageColumn.width, startY, chartBodyWidth, rowHeights[i])
                .attr(settings.zebra[i % 2 ? 'odd' : 'even'])
                .data('isBackground', true);
            if (data[i].link) {
                zebraItem = wrapToLink(stripe, data[i].link);
            } else {
                zebraItem = stripe;
            }
            zebraGroup.add(zebraItem);
            clickableElemsByRow[i].push(stripe);

            elementsByStage[i].bg = zebraItem;

            // Пока скрываем все этапы - потом покажем нужные по списку visibleStageIds
            zebraItem.attr({ visibility: 'hidden', opacity: 0 });
        }

        return zebraGroup;
    }

    /* yearLineDivisor - для возможности отрисовки каждой N-й полосы, соответствующей году, цветом потемнее (N === yearLineDivisor). Например, при наличии шкалы по месяцам нужно отрисовывать другим цветом каждую 12-ю полосу (yearLineDivisor = 12).
    При наличии квартальной шкалы - каждую 4-ю (yearLineDivisor = 4) */
    function drawGrid(surface, lineCount, cellWidth, timescaleHeight, yearLineDivisor = null, yearLineAttrs = null) {
        var startCoords = {
                x: Math.round(settings.stageColumn.width + cellWidth),
                y: settings.currentDate.blockHeight + timescaleHeight
            },
            gridGroup = surface.g().attr({ id: 'grid' }),
            y2 = chartHeight,
            x, lineAttrs;

        for (let i = 0; i < lineCount; i++) {
            x = startCoords.x + Math.round(i * cellWidth);
            let y1 = startCoords.y;
            let lineAttrs = settings.grid.year;
            if (i && !((i + 1) % yearLineDivisor) && yearLineDivisor && yearLineAttrs) {
                y1 -= timescaleHeight; // линию, разделяющую года, проведем повыше
                lineAttrs = Object.assign({}, lineAttrs, yearLineAttrs);
            }
            gridGroup.add(surface.line(x, y1, x, y2).attr(lineAttrs));
        }

        return gridGroup;
    }

    function drawStages(surface, data, minYear, maxYear, container, elementsByStage, rowHeights, timescaleHeight) {
        var stripesGroup = surface.g().attr({ id: 'stripes' }),
            minTimestamp = getTimestamp(Date.parse(minYear + '-01-01')),
            maxTimestamp = getTimestamp(Date.parse(maxYear + '-12-31')),
            chartBodyWidth = getChartBodyWidth(container),
            stage, stageStripes, i, l;

        for (i = 0, l = data.length; i < l; i++) {
            stage = data[i];
            stageStripes = drawStage(surface, stage, i, minTimestamp, maxTimestamp, chartBodyWidth, minYear, maxYear, container, rowHeights, timescaleHeight);
            stripesGroup.add(stageStripes);

            elementsByStage[i].series = stageStripes;

            // Пока скрываем все этапы - потом покажем нужные по списку visibleStageIds
            stageStripes.attr({ visibility: 'hidden', opacity: 0 });
        }

        return stripesGroup;
    }

    function drawStage(surface, stage, orderNumber, minTimestamp, maxTimestamp, chartBodyWidth, minYear, maxYear, container, rowHeights, timescaleHeight) {
        var stageGroup = surface.g(),
            i, l;

        if (stage.series) {
            for (i = 0, l = stage.series.length; i < l; i++) {
                stageGroup.add(drawSeries(surface, stage, orderNumber, i, minTimestamp, maxTimestamp, chartBodyWidth, rowHeights, timescaleHeight));
            }
        }

        if (stage.marks) {
            normalizeMarks(stage.marks);
            stageGroup.add(drawMarks(surface, stage.marks, minYear, maxYear, container, getStageTopY(stage, orderNumber, timescaleHeight),
                rowHeights[orderNumber]));
        }

        return stageGroup;
    }

    /* Рисует полоску в пределах основного блока (который с текстовой меткой) */
    function drawSeries(surface, stage, stageOrderNumber, seriesOrderNumber, minTimestamp, maxTimestamp, chartBodyWidth, rowHeights, timescaleHeight) {
        var series = stage.series[seriesOrderNumber],
            bodyStartX = settings.stageColumn.width,
            seriesHeight = settings.series[!seriesOrderNumber ? 'main' : 'additional'].height,
            seriesTopY = getStageTopY(stage, stageOrderNumber, timescaleHeight) +
                Math.round(rowHeights[stageOrderNumber] / 2 - seriesHeight / 2) + settings.series.main.topPadding +
                settings.series.main.height * seriesOrderNumber +
                settings.series.additional.topMargin * seriesOrderNumber,
            seriesColor = series.color ? '#' + series.color : colors.GREY_2,
            seriesGroup = surface.g(),
            period, periodStartDate, periodEndDate,
            periodStartTimestamp, periodEndTimestamp,
            segment, periodColor, x1, x2, i, l;

        if (series.color && ~series.color.indexOf('rgb')) {
            seriesColor = series.color; // для возможности задавать цвет с прозрачностью в виде rgba()
        }

        if (!series.periods) return seriesGroup;

        for (i = 0, l = series.periods.length; i < l; i++) {
            period = series.periods[i];

            periodStartDate = Date.parse(period.startDate);
            periodEndDate = Date.parse(period.endDate);
            if (isNaN(periodStartDate) || isNaN(periodEndDate)) continue;

            periodStartTimestamp = getTimestamp(periodStartDate);
            periodEndTimestamp = getTimestamp(periodEndDate);
            // Входные данные могут быть "грязные", поэтому добавляем проверку на перепутанные границы периода
            if (periodEndTimestamp < periodStartTimestamp) {
                // обмен значениями без использования буферной переменной
                periodStartTimestamp += periodEndTimestamp;
                periodEndTimestamp = periodStartTimestamp - periodEndTimestamp;
                periodStartTimestamp -= periodEndTimestamp;
            }

            var dx1 = Math.round((periodStartTimestamp - minTimestamp) / (maxTimestamp - minTimestamp) * chartBodyWidth);
            var dx2 = Math.round((periodEndTimestamp - minTimestamp) / (maxTimestamp - minTimestamp) * chartBodyWidth);
            x1 = bodyStartX + dx1;
            x2 = bodyStartX + dx2;

            periodColor = period.color ? '#' + period.color : seriesColor;

            segment = surface
                .rect(x1, seriesTopY, x2 - x1, seriesHeight)
                .attr({
                    fill: periodColor
                });

            seriesGroup.add(stage.link ? wrapToLink(segment, stage.link) : segment);

            clickableElemsByRow[stageOrderNumber].push(segment);
        }

        return seriesGroup;
    }

    function drawMarks(surface, marks, minYear, maxYear, container, y1, height) {
        if (!marks) return;

        var sortedMarks = marks.slice(),
            isStageMarks = y1 !== undefined && height !== undefined,
            svgGroup = surface.g().attr({ id: 'marks' + (isStageMarks ? Math.round(Math.random() * 1000) : '') }),
            markGroup, dateMs1, dateMs2,
            i, l, j, buf;

        /* сначала отсортируем метки по координате X линии */
        const markComparatorByDate = function(markA, markB) {
            const dateMsA = typeof markA.date == 'string' ? Date.parse(markA.date) : +markA.date;
            const dateMsB = typeof markB.date == 'string' ? Date.parse(markB.date) : +markB.date;
            return dateMsA - dateMsB;
        };
        sortedMarks.sort(markComparatorByDate);

        for (i = 0, l = sortedMarks.length; i < l; i++) {
            if (isStageMarks) {
                sortedMarks[i].isStageMark = true;
            }
            markGroup = drawMark(surface, sortedMarks[i], minYear, maxYear, container, y1, height);
            if (markGroup) {
                svgGroup.add(markGroup);
            }
        }

        adjustMarkPositions(surface, sortedMarks, container);

        return svgGroup;
    }

    function drawMark(surface, mark, minYear, maxYear, container, y1, height) { // y1 и height - для меток в уровнях
        if (!mark || !mark.date) return;

        var minTimestamp = getTimestamp(Date.parse(minYear + '-01-01')),
            maxTimestamp = getTimestamp(Date.parse(maxYear + '-12-31')),
            dateMs = Date.parse(mark.date),
            date = new Date(dateMs),
            timestamp = getTimestamp(dateMs);

        if (!date || timestamp < minTimestamp) return;

        var isStageMark = y1 !== undefined && height !== undefined,
            chartWidth = getAvailableWidth(container),
            chartBodyWidth = getChartBodyWidth(container),
            bodyStartX = settings.stageColumn.width,
            x = bodyStartX + Math.round((timestamp - minTimestamp) / (maxTimestamp - minTimestamp) * chartBodyWidth),
            textCoords,
            labelTexts = mark.label instanceof Array ? mark.label : [ (mark.label || '') + '' ],
            markClass = `gantt_${isStageMark ? 'local' : 'global'}_mark`,
            markGroup = surface.g().attr({
                id: 'mark_' + dateMs + Math.round(Math.random() * 1000),
                class: markClass
            }),
            markSettings = settings[isStageMark ? 'stageMarks' : 'currentDate' ],
            labelSettings = markSettings.label,
            line, label, labels = [], textBackgroundRect, labelBackgroundRects = [], y2, i, l;

        if (x > chartWidth) { // почему-то в случае последней даты графика линия выходит за вьюпорт на пару пикселей
            x = chartWidth - Math.round(markSettings.line['strokeWidth'] / 2);
        }

        y1 = y1 || 0;
        y2 = height ? y1 + height : chartHeight;

        textCoords = [
            {
                x: x + labelSettings.leftPadding,
                y: labelSettings.topPadding + (isStageMark ? y1 : 0)
            },
            {
                x: x + labelSettings.leftPadding,
                y: labelSettings.topPadding + (isStageMark ? y1 + 12 : 20)
            }
        ];

        line = surface
            .line(x, y1, x, y2)
            .attr(markSettings.line)
            .attr({ class: `${markClass}_line` });
        if (mark.color) {
            line.attr({ stroke: '#' + mark.color, opacity: 0.6 });
        } else if (isStageMark) {
            line.attr({ opacity: 0.4 });
        }

        markGroup.add(line);

        if (!isStageMark && labelTexts.length < 2) {
            labelTexts.push(formatDate(date));
        }

        for (i = 0, l = labelTexts.length; i < l; i++) {
            label = surface
                .text(textCoords[i].x, textCoords[i].y, labelTexts[i])
                .attr(labelSettings.subLabels[i]);
            if (mark.color) {
                label.attr({ fill: '#' + mark.color });
            }

            if (!isStageMark) {
                var labelBBox = label.getBBox();
                textBackgroundRect = surface
                    .rect(textCoords[i].x, textCoords[i].y - labelBBox.height, labelBBox.width, labelBBox.height + 3)
                    // 3 добавлено, т.к. фон не охватывал нижние "хвостики" букв
                    .attr({ fill: '#FFFFFF' });
                markGroup.add(textBackgroundRect);
                labelBackgroundRects.push(textBackgroundRect);
            }

            markGroup.add(label);
            labels.push(label);
        }

        // Сохраняем отрисованный элемент для дальнейшей коррекции взаимного расположения меток
        mark.elements = {
            container: markGroup,
            line: line,
            labels: labels,
            labelBackgroundRects: labelBackgroundRects
        };

        return markGroup;
    }

    function adjustMarkPositions(surface, marks, container) {
        if (!marks) return;

        var mark, nextMark, prevMark,
            isOverlapOnRight = false,
            isOverlapOnLeft = false,
            bBox, nextBBox, prevBBox,
            i, l;

        for (i = 0, l = marks.length; i < l - 1; i++) {
            mark = marks[i];
            nextMark = i < l - 1 ? marks[i + 1] : null;
            prevMark = i > 0 ? marks[i - 1] : null;

            bBox = mark.elements.container.getBBox();
            nextBBox = nextMark ? nextMark.elements.container.getBBox() : null;
            prevBBox = prevMark ? prevMark.elements.container.getBBox() : null;

            isOverlapOnRight = nextMark && Snap.path.isBBoxIntersect(bBox, nextBBox);
            if (isOverlapOnRight) {
                // пробуем поставить текст слева от линии
                moveMarkLabelToTheLeft(mark);
                bBox = mark.elements.container.getBBox(); // обновить bounding box после перемещения метки
                isOverlapOnLeft = prevMark && Snap.path.isBBoxIntersect(bBox, prevBBox);
                if (isOverlapOnLeft) {
                    // возвращаем текст вправо
                    moveMarkLabelToTheRight(mark);
                    // Текст не вмещается между соседними метками; поднимаем его выше
                    /* Временно отключено, т.к. плохо смотрится для меток внутри stages; предложено использовать ссылки в легенде */
                    /*moveBody(settings.currentDate.blockHeight);
                    liftUpMark(mark);*/
                }
            }
        }

        /* Обработаем случай вылезания текста за правую границу графика */
        var lastMark = marks[marks.length - 1];
        var maxLeftX = getAvailableWidth(container) - (maxButtonCount
            ? maxButtonCount * (settings.buttonColumn.width + settings.buttonColumn.interButtonGap)
            : 0)
        if (lastMark && lastMark.elements && lastMark.elements.container.getBBox().x2 >= maxLeftX) {
            moveMarkLabelToTheLeft(lastMark);
        }
    }

    function normalizeMarks(marks) { // очищает входной массив меток с пустыми и невалидными датами
        var mark, isValid, i, l;

        for (i = 0, l = marks.length; i < l - 1; i++) {
            mark = marks[i];

            isValid = mark && mark.date && (
                /\d{4}-\d{2}-\d{2}/.test(mark.date) ||
                mark.date instanceof Date
            );

            if (!isValid) {
                marks.splice(i, 1);
                i--;
                l--;
            }
        }
    }

    /* Перемещает текст метки влево от линии */
    function moveMarkLabelToTheLeft(mark) {
        var line = mark.elements.line,
            labels = mark.elements.labels,
            labelBackgroundRects = mark.elements.labelBackgroundRects,
            markSettings = settings[mark.isStageMark ? 'stageMarks' : 'currentDate'],
            bBox, newX, i, l;

        for (i = 0, l = labels.length; i < l; i++) {
            bBox = labels[i].getBBox();
            newX = line.attr('x1') - markSettings.label.leftPadding - bBox.width
                 + 1; // небольшая коррекция вправо, т.к. расстояние между текстом и линией кажется больше, чем в расположении метки справа
            labels[i].attr('x', newX);
            if (!mark.isStageMark) {
                labelBackgroundRects[i].attr('x', newX);
            }
        }
    }

    /* Перемещает текст метки вправо от линии */
    function moveMarkLabelToTheRight(mark) {
        var line = mark.elements.line,
            labels = mark.elements.labels,
            labelBackgroundRects = mark.elements.labelBackgroundRects,
            bBox, newX, i, l;

        for (i = 0, l = labels.length; i < l; i++) {
            newX = +line.attr('x1') + settings.currentDate.label.leftPadding;
            labels[i].attr('x', newX);
            if (!mark.isStageMark) {
                labelBackgroundRects[i].attr('x', newX);
            }
        }
    }

    /* Сдвигает таблицу графика (без меток) вниз на заданную высоту */
    function moveBody(dy) {
        var matrix = Snap.matrix().translate(0, dy),
            stages = Snap.select('#stages'),
            years = Snap.select('#years'),
            body = Snap.select('#body'),
            marks = Snap.select('#marks');

        stages.transform('t0,' + dy);
        years.transform('t0,' + dy);
        body.transform('t0,' + dy);
        if (marks) {
            marks.transform('t0,' + dy);
        }

        svgElement.setAttribute('height', +svgElement.getAttribute('height') + dy);
    }

    /* Поднимаем выше текст метки, когда он не вмещается между соседними метками */
    function liftUpMark(mark) {
        var i, l;

        // Удлинить линию метки
        mark.elements.line.attr({
            y1: mark.elements.line.attr('y1') - settings.currentDate.blockHeight
        });

        // поднять текст метки
        for (i = 0; i < 2; i++) { // кол-во элементов в метке
            if (!mark.elements.labels[i]) break;

            mark.elements.labels[i] && mark.elements.labels[i].attr({
                y: mark.elements.labels[i].attr('y') - settings.currentDate.blockHeight
            });
            mark.elements.labelBackgroundRects[i] && mark.elements.labelBackgroundRects[i].attr({
                y: mark.elements.labelBackgroundRects[i].attr('y') - settings.currentDate.blockHeight
            });
        }
    }

    function calcClusterHeights(originalData, rowHeights) {
        var result = [], clusterHeight, clusterRowCount,
            clusterRowHeights, globalRowIndex = 0,
            i, l;

        for (i = 0, l = originalData.length; i < l; i++) {
            clusterRowCount = originalData[i].rows ? originalData[i].rows.length : 0;
            clusterRowHeights = rowHeights.slice(globalRowIndex, globalRowIndex + clusterRowCount);
            clusterHeight = clusterRowHeights.reduce(function(sum, height) {
                return sum + height;
            }, 0);
            result.push(clusterHeight);
            globalRowIndex += clusterRowCount;
        }

        return result;
    }

    function drawClusterDividers(surface, container, originalData, rowHeights, timescaleHeight) {
        var clusterHeights = calcClusterHeights(originalData, rowHeights),
            topY = settings.currentDate.blockHeight + timescaleHeight,
            chartWidth = getAvailableWidth(container),
            dividerHeight = settings.cluster.divider.height,
            dividersGroup = surface.g(),
            line, i, l;

        for (i = 0, l = originalData.length; i < l; i++) {
            line = surface
                .rect(0, topY, chartWidth, dividerHeight)
                .attr(settings.cluster.divider.style);
            dividersGroup.add(line);
            topY += clusterHeights[i] + dividerHeight;
        }

        return dividersGroup;
    }

    function drawClusterLabels(surface, container, originalData, rowHeights, timescaleHeight) {
        var clusterHeights = calcClusterHeights(originalData, rowHeights),
            dividerHeight = settings.cluster.divider.height,
            topY = settings.currentDate.blockHeight + timescaleHeight + dividerHeight,
            leftX = settings.stageColumn.width,
            chartBodyWidth = getChartBodyWidth(container),
            chartBodyMiddleX = Math.round(leftX + chartBodyWidth / 2),
            clusterLabelsGroup = surface.g(),
            cluster, labelMiddleY, label, fontSize, i, l;

        for (i = 0, l = originalData.length; i < l; i++) {
            cluster = originalData[i];
            labelMiddleY = Math.round(topY - dividerHeight / 2);
            fontSize = Math.min(chartBodyWidth, clusterHeights[i]);
            label = surface
                .text(chartBodyMiddleX, labelMiddleY - 1, cluster.label) // -1 добавлено из-за того, что визуально текст выглядел смещенным вниз
                .attr(settings.cluster.label.text);
            clusterLabelsGroup.add(label);
            topY += clusterHeights[i] + dividerHeight;
        }

        return clusterLabelsGroup;
    }

    function drawClusterControls(surface, container, originalData, rowHeights, timescaleHeight) {
        var clusterHeights = calcClusterHeights(originalData, rowHeights),
            dividerHeight = settings.cluster.divider.height,
            topY = settings.currentDate.blockHeight + timescaleHeight + dividerHeight,
            leftX = settings.stageColumn.width,
            chartBodyWidth = getChartBodyWidth(container),
            chartBodyMiddleX = Math.round(leftX + chartBodyWidth / 2),
            clusterLabelsGroup = surface.g(),
            cluster, controlsX, controlsY, controlsWidth, selectTemplate,
            clusterSort, sortParam, sortDirection, isSortDirectionVisible, sortDirectionLabel,
            i, l;

        for (i = 0, l = originalData.length; i < l; i++) {
            cluster = originalData[i];
            if (cluster.rows.length > 1) { // для одного элемента не показывать кнопки сортировки
                controlsX = settings.stageColumn.leftPadding - 2; // 2 подобрано эмпирически в FF
                controlsY = topY - dividerHeight + 10;
                controlsWidth = settings.stageColumn.width - (settings.stageColumn.leftPadding - 2) * 2
                     + 6  // боковой паддинг sort-кнопки
                     - 2; // немного сместим влево, т.к. лучше смотрится
                clusterSort = sort[i];
                sortParam = clusterSort && clusterSort.param;
                sortDirection = clusterSort && clusterSort.direction || 'asc';
                isSortDirectionVisible = ~['startDate', 'endDate'].indexOf(sortParam);
                sortDirectionLabel = sortDirection === 'asc' ? '&#x025B2' : '&#x025BC';
                selectTemplate =
                    '<svg>' +
                        '<foreignObject x="' + controlsX + '" y="' + controlsY + '" width="' + controlsWidth + '" height="40">' +
                            '<body>' +
                                '<form autocomplete="off" class="stageControls" data-stage-controls data-cluster-index="' + i + '">' +
                                    '<div class="select_wrap">' +
                                        '<select name="sortParam" class="input_text">' +
                                            '<option value="">По умолчанию</option>' +
                                            '<option value="startDate"' + (sortParam === 'startDate' ? ' selected' : '') + '>Начало</option>' +
                                            '<option value="endDate"' + (sortParam === 'endDate' ? ' selected' : '') + '>Окончание</option>' +
                                        '</select>' +
                                    '</div>' +
                                    '<button type="button" class="btn sort' + (isSortDirectionVisible ? '' : ' hidden') + '" data-sort-direction="' + sortDirection + '">' + sortDirectionLabel + '</button>' +
                                '</form>' +
                            '</body>' +
                        '</foreignObject>' +
                    '</svg>';
                clusterLabelsGroup.append(Snap.parse(selectTemplate));
            }
            topY += clusterHeights[i] + dividerHeight;
        }

        return clusterLabelsGroup;
    }


    /* Столбец с кнопками на правом краю */

    function drawButtonColumn(surface, data, commonButtons, container, elementsByStage, rowHeights, timescaleHeight) {
        var stageColumnGroup = surface.g().attr({ id: 'buttonColumn' }),
            cellGroup, stage, stageButtons, i, j, l, m;

        for (i = 0, l = data.length; i < l; i++) {
            stage = data[i];
            stageButtons = drawStageButtons(surface, stage, i, container, commonButtons, rowHeights, timescaleHeight);
            stageColumnGroup.add(stageButtons);

            elementsByStage[i].buttons = stageButtons;

            // Пока скрываем все этапы - потом покажем нужные по списку visibleStageIds
            stageButtons.attr({ visibility: 'hidden', opacity: 0 });
        }
    }

    function drawStageButtons(surface, stage, orderNumber, container, commonButtons, rowHeights, timescaleHeight) {
        var stageButtonsGroup = surface.g(),
            chartBodyWidth = getChartBodyWidth(container),
            buttonX, stageY, bgElement, rowClusterIndex, clusterDividersHeight, buttonWidth, buttonHeight;

        rowClusterIndex = stage.clusterIndex;
        clusterDividersHeight = rowClusterIndex !== undefined
            ? settings.cluster.divider.height * (rowClusterIndex + 1)
            : 0;
        stageY = settings.currentDate.blockHeight + timescaleHeight + /*getVisibleStagesCommonHeight(rowHeights, visibleStageIds, orderNumber) + */ clusterDividersHeight;

        var resultStageButtons = (commonButtons || []).concat(stage.sideButtons || []);

        buttonX = settings.stageColumn.width + chartBodyWidth + settings.buttonColumn.interButtonGap;

        for (let buttonData of resultStageButtons) {
            var buttonGroup = drawSideButton(surface, stage, orderNumber, container, buttonData, buttonX, stageY, rowHeights);
            stageButtonsGroup.add(buttonGroup);
            buttonX += settings.buttonColumn.width + settings.buttonColumn.interButtonGap;
        }

        return stageButtonsGroup;
    }

    function drawSideButton(surface, stage, orderNumber, container, buttonData, buttonX, buttonY, rowHeights) {
        var buttonGroup = surface.g(),
            bgElement, buttonWidth, buttonHeight;

        buttonWidth = settings.buttonColumn.width;
        buttonHeight = rowHeights[orderNumber] - 1; // оставлям gap для различения границ кнопок

        bgElement = surface
            .rect(buttonX, buttonY, buttonWidth, buttonHeight)
            .attr(settings.buttonColumn.style)
            .data('isBackground', true);

        buttonGroup.add(bgElement);

        var buttonCreatorsByActions = {
            edit: drawEditButton,
            showAttachments: drawAttachmentsButton
        };
        var buttonCreator = buttonCreatorsByActions[buttonData.action];
        if (!buttonCreator) {
            console.log('Gantt chart renderer: unknown button action - ' + buttonData.action);
            return buttonGroup;
        }
        var { buttonIconElement, isButtonHighlightable = true, foregroundElement } = buttonCreator(surface, stage, container, buttonData, buttonGroup, bgElement, buttonX, buttonY, buttonHeight);

        if (isButtonHighlightable !== false) {
            const additionalHighlightTriggers = foregroundElement ? [ foregroundElement ] : undefined;
            addHighlightToButton(bgElement, buttonIconElement, additionalHighlightTriggers);
        }

        return buttonGroup;
    }

    function drawEditButton(surface, stage, container, buttonData, buttonGroup, bgElement, buttonX, buttonY, buttonHeight) {
        /* Иконка */
        var iconWidth = 20;
        var iconHeight = 20;
        var iconX = buttonX + 13;
        var iconY = buttonY + Math.round((buttonHeight - iconHeight) / 2);
        var iconColor = colors.GREY_2;
        var editIconMarkup =
            '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" xmlns:xlink="http://www.w3.org/1999/xlink" enable-background="new 0 0 512 512" width="' + iconWidth + '" height="' + iconHeight + '" x="' + iconX + '" y="' + iconY + '">' +
                '<path class="svg_icon" fill="' + iconColor + '" cursor="pointer" d="m455.1,137.9l-32.4,32.4-81-81.1 32.4-32.4c6.6-6.6 18.1-6.6 24.7,0l56.3,56.4c6.8,6.8 6.8,17.9 0,24.7zm-270.7,271l-81-81.1 209.4-209.7 81,81.1-209.4,209.7zm-99.7-42l60.6,60.7-84.4,23.8 23.8-84.5zm399.3-282.6l-56.3-56.4c-11-11-50.7-31.8-82.4,0l-285.3,285.5c-2.5,2.5-4.3,5.5-5.2,8.9l-43,153.1c-2,7.1 0.1,14.7 5.2,20 5.2,5.3 15.6,6.2 20,5.2l153-43.1c3.4-0.9 6.4-2.7 8.9-5.2l285.1-285.5c22.7-22.7 22.7-59.7 0-82.5z"/>' +
            '</svg>';
        var buttonIconSvg = Snap.parse(editIconMarkup);
        buttonGroup.append(buttonIconSvg);

        var buttonIconElement = buttonIconSvg.select('.svg_icon'); // Создаём buttonIconElement, т.к. напрямую к buttonIconSvg не получится подцепить обработчик события (из-за типа Fragment, а не Element)

        function initForm() {
            $form = $('.gantt_chart_form');

            $form.find('.popup_close, [data-action="cancel"]').click(function() {
                hideForm();
            });

            $('.chart .form_overlay').click(function() {
                hideForm();
            });

            $form.on('submit', async function(event) {
                event.preventDefault();

                var $submitButton = $form.find('button[type="submit"]');
                $submitButton.prop('disabled', true);

                var formData = new FormData($form[0]);
                var formDataObject = {};
                for (let [ name, value ] of formData) {
                    let $input = $form.find(`[name="${name}"]`);
                    let inputTag = $input[0].tagName.toLowerCase();

                    if (inputTag === 'select' && $input[0].multiple) {
                        // Collect all values of multivalued dropdown
                        let selectedValues = [];
                        $input.find(':selected').each(function() {
                            selectedValues.push($(this).val());
                        });
                        formDataObject[name] = selectedValues;
                    } else {
                        formDataObject[name] = value;
                    }
                }

                var response;
                try {
                    response = await api.post($form.attr('action'), formDataObject);
                } catch (error) {
                    const message = error.responseJson && error.responseJson.message
                        || error.responseText
                        || error.message
                        || error;
                    alert(`Ошибка:\n\n${message}`);
                    return false;
                } finally {
                    $submitButton.prop('disabled', false);
                }

                if (response.status === 'OK') {
                    $form.find('.success').css('visibility', 'visible');
                    setTimeout(function() {
                        hideForm();
                        // Redraw the chart with the updated data
                        loadPopupContent(currentPopupConfig);
                    }, 1500);
                }

                return false;
            });
        }

        function hideForm() {
            $form.hide();
            $(container).removeClass('form_opened');
            $form.find('.success').css('visibility', 'hidden');

            // Destroy Selectize.js instances
            $form.find('select[multiple]').each(function() {
                if (!this.selectize) return;
                this.selectize.destroy();
            });
            // Очистить мультиселекты
            $form.find('select[multiple] option').removeAttr('selected');
        }

        var buttonClickHandler = function(stageData) { // this - кликнутый элемент графика (Snap.svg Element)
            if (!$form) initForm();

            if ($form.is(':visible')) {
                hideForm();
                return;
            }

            /* Fill form fields */
            var formData = new FormData($form[0]);
            // Костыль: select[multiple] добавляем к formData отдельно, т.к. они не подхватываются new FormData, если пустые
            $form.find('select[multiple]').each(function() {
                formData.append($(this).attr('name'), '');
            });
            for (let [ name ] of formData) {
                var value = stageData.form && stageData.form.fields && stageData.form.fields[name];
                if (value !== undefined) {
                    var $input = $form.find(`[name="${name}"]`);
                    var inputTag = $input[0].tagName.toLowerCase();

                    if (~['text', 'hidden'].indexOf($input[0].type) || inputTag === 'textarea') {
                        $input[0].value = value;
                    } else if (inputTag === 'select') {
                        $input.find('[selected]').removeAttr('selected');
                        if (Array.isArray(value)) {
                            // Мультиселект
                            for (let singleValue of value) {
                                $input.find(`[value="${singleValue}"]`).attr('selected', true);
                            }
                        } else {
                            // Селект одного значения
                            $input.find(`[value="${value}"]`).attr('selected', true);
                        }
                    }
                    // TODO: добавить остальные виды инпутов
                }
            }

            var formWidth = $form.actual('outerWidth');
            var formHeight = $form.actual('outerHeight');

            var containerWindowTop = container.getBoundingClientRect().top; // координата относительно окна
            var formTop = Math.max((window.innerHeight - formHeight) / 2, 40) - containerWindowTop;
            var formLeft = Math.round(($(container).width() - formWidth) / 2);

            var containerTopY = $(container).offset().top;
            var containerBottomY = containerTopY + container.offsetHeight;
            var formBottomY = containerTopY + formTop + formHeight;
            if (formBottomY > containerBottomY) {
                formTop = container.offsetHeight - formHeight - 2; // 2 - небольшой сдвиг вверх (лучше смотрится)
            }

            $form.find('[data-title]').html(stageData.form && stageData.form.title || stageData.stage);

            $(container).addClass('form_opened');
            $form.css({ top: `${formTop}px`, left: `${formLeft}px`, /*width: `${chartBodyWidth}px`*/ }).show();

            /* Кастомный множественный селект */
            $form.find('select[multiple]').selectize({
                onInitialize: function() {
                    this.$wrapper.removeClass('input_text wide');
                    this.$control.addClass('input_text wide');

                    /* Удаление выбранных элементов селекта кликом по крестику */
                    const selectizeInstance = this;
                    this.$wrapper.click(function(event) {
                        const $target = $(event.target);
                        if ($target.hasClass('selectize-remove-item') || $target.parents('.selectize-remove-item').length) {
                            const itemValue = $target.parents('.item[data-value]').data('value');
                            selectizeInstance.removeItem(itemValue);
                            selectizeInstance.refreshOptions(false);
                            event.stopPropagation();
                        }
                    });
                },
                render: {
                    item: function(data, escape) {
                        // TODO: учитывать атрибут data.disabled (отображать элемент серым/полупрозрачным)
                        return (
                            '<div class="item" data-value="sinitsyn">' +
                                escape(data.text) +
                                '<div class="selectize-remove-item">' +
                                    '<svg width="12px" height="12px"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#icn_close_cross"></use></svg>' +
                                '</div>' +
                            '</div>'
                        );
                    }
                }
            });
        }


        bindClickHandlers(bgElement, [ buttonClickHandler ], stage);
        bindClickHandlers(buttonIconElement, [ buttonClickHandler ], stage);

        return { buttonIconElement };
    }

    function drawAttachmentsButton(surface, stage, container, buttonData, buttonGroup, bgElement, buttonX, buttonY, buttonHeight) {
        /* Иконка */
        var iconWidth = 23;
        var iconHeight = 23;
        var iconX = buttonX + 13;
        var iconY = buttonY + Math.round((buttonHeight - iconHeight) / 2);
        var iconColor = colors.GREY_2;
        var editIconMarkup =
            '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" xmlns:xlink="http://www.w3.org/1999/xlink" enable-background="new 0 0 23 23" width="' + iconWidth + '" height="' + iconHeight + '" x="' + iconX + '" y="' + iconY + '">' +
                '<path class="svg_icon" fill="' + iconColor + '" cursor="pointer" d="M21.097,10.919l-6.784,6.784c-1.404,1.403-3.687,1.403-5.09,0c-1.403-1.402-1.403-3.686,0-5.088l6.784-6.784l1.131,1.131 l-6.783,6.784c-0.781,0.779-0.781,2.047-0.001,2.827c0.779,0.781,2.047,0.781,2.827,0l6.786-6.784c1.869-1.871,1.869-4.913,0-6.784 c-1.871-1.871-4.915-1.871-6.786,0L3.004,13.181c-1.871,1.871-1.871,4.915,0,6.785c1.871,1.869,4.914,1.869,6.785,0l0.002-0.003 c0.6,0.248,1.24,0.37,1.879,0.383l-0.751,0.751c-2.498,2.497-6.548,2.497-9.046,0c-2.498-2.499-2.498-6.548,0-9.047L12.05,1.874 c2.499-2.499,6.548-2.499,9.047,0C23.594,4.371,23.594,8.421,21.097,10.919z"/>' +
            '</svg>';
        var buttonIconSvg = Snap.parse(editIconMarkup);
        buttonGroup.append(buttonIconSvg);
        var buttonIconElement = buttonIconSvg.select('.svg_icon');

        // Кол-во файлов - синий фон
        const attachmentCount = buttonData.attachments && buttonData.attachments.length || 0;
        if (!attachmentCount) {
            buttonIconElement.attr({ 'fill-opacity': 0.5, cursor: 'pointer' });
        }
        var attachmentCountBgMetrics = { width: 18, height: 18, borderRadius: 5 };
        var attachmentCountBg = surface
            .rect(buttonX + 28, iconY - 5,
                attachmentCountBgMetrics.width,
                attachmentCountBgMetrics.height,
                attachmentCountBgMetrics.borderRadius,
                attachmentCountBgMetrics.borderRadius
            ).attr({ fill: '#1e7fc9' });
        buttonGroup.add(attachmentCountBg);
        // Кол-во файлов - цифры
        const attachmentCountText = surface
            .text(attachmentCountBg.attr('x'), attachmentCountBg.attr('y'), attachmentCount + '')
            .attr({
                'font-family': DEFAULT_TEXT_STYLE['font-family'],
                'font-size': '10px',
                'font-weight': 'bold',
                'fill': colors.WHITE
            });
        buttonGroup.append(attachmentCountText);
        const attachmentCountTextBBox = attachmentCountText.getBBox();

        attachmentCountText.attr({
            x: Math.round(+attachmentCountBg.attr('x') + (attachmentCountBgMetrics.width - attachmentCountTextBBox.width) / 2) + 1,
            y: Math.round(+attachmentCountBg.attr('y') + (attachmentCountBgMetrics.height - attachmentCountTextBBox.height) / 2) + attachmentCountTextBBox.height - 2
        });

        let foregroundElement;

        if (!attachmentCount) {
            bgElement.attr({ cursor: 'default' });
            buttonIconElement.attr({ cursor: 'default' });
        } else {
            // Прозрачный кликабельный блок
            const buttonMetrics = buttonGroup.getBBox();
            foregroundElement = surface
                .rect(buttonX, buttonY, buttonMetrics.width, buttonMetrics.height)
                .attr({ fill: 'rgba(0,0,0,0)', cursor: 'pointer' });
            buttonGroup.add(foregroundElement);

            var buttonClickHandler = function(stageData) { // this - кликнутый элемент графика (Snap.svg Element)
                const popupOffsets = { left: 11 }; // сместить всплывающий список файлов чуть правее дефолтной позиции
                handleAttachmentsTrigger(buttonData.attachments, foregroundElement, popupOffsets);
            }

            bindClickHandlers(foregroundElement, [ buttonClickHandler ], stage);
        }

        // buttonIconElement нужно вернуть, чтобы нацепить на него подсветку при наведении
        return { buttonIconElement, isButtonHighlightable: !!attachmentCount, foregroundElement };
    }

    function addHighlightToButton(button, label, additionalEventTriggers) {
        function enter() {
            button
                .data('hoverBackupFill', button.attr('fill')) // запоминаем исходный цвет ячейки
                .attr({ fill: colors.AQUA });

            label
                .data('hoverBackupFill', label.attr('fill')) // запоминаем исходный цвет текста
                .attr({ fill: colors.NAVY_2 });
        }

        function leave() {
            button.attr({
                fill: button.data('hoverBackupFill') // восстанавливаем исходный цвет ячейки
            });

            label.attr({
                fill: label.data('hoverBackupFill') // восстанавливаем исходный цвет текста
            });
        }

        button.hover(enter, leave);
        label.hover(enter, leave);

        /* additionalEventTriggers задается в случае, когда кнопка накрыта отдельным прозрачным кликабельным прямоугольником,
        чтобы не перебирать множество составляющих кнопку элементов для навешивания события. Тогда при наведении на прозрачный прямоугольник
        нужно подсветить элементы под ним */
        if (additionalEventTriggers && additionalEventTriggers.length) {
            for (let element of additionalEventTriggers) {
                element.hover(enter, leave);
            }
        }
    }

    function getMonthColumnWidth(chartBodyWidth, minYear, maxYear) {
        var yearCount = maxYear - minYear + 1;

        return chartBodyWidth / (yearCount * 12);
    }

    function getQuarterColumnWidth(chartBodyWidth, minYear, maxYear) {
        var yearCount = maxYear - minYear + 1;

        return chartBodyWidth / (yearCount * 4);
    }

    function needMonthScale(estimatedMonthColumnWidth) {
        const MIN_MONTH_CELL_PADDING = 11;
        const MAX_MONTH_CELL_TEXT_WIDTH = 24; // TODO: вычислять точнее через getBBox(widestLabel)
        const MIN_MONTH_CELL_WIDTH = MIN_MONTH_CELL_PADDING * 2 + MAX_MONTH_CELL_TEXT_WIDTH;

        return estimatedMonthColumnWidth >= MIN_MONTH_CELL_WIDTH;
    }

    function needQuarterScale(estimatedQuarterColumnWidth) {
        const MIN_QUARTER_CELL_PADDING = 11;
        const MAX_QUARTER_CELL_TEXT_WIDTH = 33; // TODO: вычислять точнее через getBBox(widestLabel)
        const MIN_QUARTER_CELL_WIDTH = MIN_QUARTER_CELL_PADDING * 2 + MAX_QUARTER_CELL_TEXT_WIDTH;

        return estimatedQuarterColumnWidth >= MIN_QUARTER_CELL_WIDTH;
    }

    function getTimestamp(dateMs) {
        return Math.floor(+dateMs / 1000);
    }

    /* Ширина части графика без начальной колонки с названиями этапов и опциональной колонки с кнопками с правого края */
    function getChartBodyWidth(container) {
        var result = getAvailableWidth(container) - settings.stageColumn.width;
        if (maxButtonCount) {
            result -= (settings.buttonColumn.width + settings.buttonColumn.interButtonGap) * maxButtonCount;
        }
        return result;
    }

    /* Ширина пространства, доступного графику */
    function getAvailableWidth(container) {
        if (isMobile) {
            return isInPopup ?
                window.innerWidth - mobilePopupMargin * 2 - mobilePopupPadding * 2 :
                window.innerWidth - mobileChartPadding * 2;
        }
        return container.clientWidth;
    }

    function calcMobileChartPadding() {
        mobileChartPadding = isInAccordeonBody ? 10 : 5;
    }

    function initClickableElemsByRow(data) { // инициализация переменной сlickableElemsByRow
        var i, l;

        clickableElemsByRow = [];

        for (i = 0, l = data.length; i < l; i++) {
            clickableElemsByRow.push([]);
        }
    }

    function addRowClickHandlers(data, surface, elementsByStage, visibleStageIds, rowHeights, timescaleHeight) {
        var stageData, rowElements, hasSubstages, isLabelElement, canAddCustomHandlers, i, l, j, m;
        var stageLabelsContainer = document.querySelector('#stages');

        for (i = 0, l = clickableElemsByRow.length; i < l; i++) {
            rowElements = clickableElemsByRow[i];
            stageData = data[i];
            hasSubstages = stageData && stageData.substages && stageData.substages.length;
            for (j = 0, m = rowElements.length; j < m; j++) {
                rowElements[j].data('stage', stageData);

                /* Если этап имеет поэтапы (hasSubstages), то клик по заголовку этапа будет вызывать сворачивание/разворачивание дерева,
                и никакие другие обработчики навешивать не нужно */
                if (!hasSubstages) {
                    canAddCustomHandlers = true;
                    rowElements[j].click(rowClickHandler);
                } else {
                    isLabelElement = stageLabelsContainer.contains(rowElements[j].node);
                    canAddCustomHandlers = !isLabelElement;
                    rowElements[j].click(treeNodeClickHandler(data, surface, elementsByStage, visibleStageIds, rowHeights, timescaleHeight));
                }

                if (canAddCustomHandlers && stageData && (stageData.subchart || stageData.popup || stageData.link)) {
                    rowElements[j]
                        .data('siblings', rowElements) // сохраняем ссылку на остальные связанные элементы (для подсветки всей строки по ховеру)
                        .attr({
                            cursor: 'pointer'
                        })
                        .hover(
                            function() {
                                var siblings = this.data('siblings');
                                if (!siblings) return;

                                var sibling, k, n;

                                for (k = 0, n = siblings.length; k < n; k++) {
                                    sibling = siblings[k];
                                    if (sibling.data('isBackground')) {
                                        sibling
                                            .data('hoverBackupFill', sibling.attr('fill')) // запоминаем исходный цвет ячейки
                                            .attr({
                                                fill: colors.AQUA
                                            });
                                    }
                                    if (sibling.data('isLabelText')) {
                                        sibling
                                            .data('hoverBackupFill', sibling.attr('fill')) // запоминаем исходный цвет ячейки
                                            .attr({
                                                fill: settings.stageColumn.text.fill
                                            });
                                    }
                                }
                            }, function() {
                                var siblings = this.data('siblings');
                                if (!siblings) return;

                                var sibling, k, n;

                                for (k = 0, n = siblings.length; k < n; k++) {
                                    sibling = siblings[k];
                                    if (sibling.data('isBackground')) {
                                        sibling.attr({
                                            fill: sibling.data('hoverBackupFill') // восстанавливаем исходный цвет ячейки
                                        });
                                    }
                                    if (sibling.data('isLabelText')) {
                                        sibling.attr({
                                            fill: sibling.data('hoverBackupFill') // восстанавливаем исходный цвет ячейки
                                        });
                                    }
                                }
                            });
                }
            }
        }
    }

    function initTooltips(data) {
        var stage, rowElements, tooltipBindClass, i, l, j, m;

        for (i = 0, l = clickableElemsByRow.length; i < l; i++) {
            stage = data[i];
            if (stage && (stage.subchart || stage.popup || stage.link)
                || !stage.tooltip) return;

            rowElements = clickableElemsByRow[i];
            for (j = 2, m = rowElements.length; j < m; j++) { // первые 2 элемента - столбец с заголовками строк, сейчас тултипы там не нужны
                var options = rowTooltipOptions;
                options.content = stage.tooltip;
                tooltipBindClass = 'tooltip_' + i + '_' + j; // привязка тултипа через прямую $-обертку не работает
                rowElements[j].attr({ class: tooltipBindClass });
                $('.' + tooltipBindClass).tooltipster(options);
            }
        }
    }

    // группируем элементы строк по их id для возможности фильтрации (посдветки определенных)
    function initClickableElemsByStageId(data) {
        var stage, i, l;

        clickableElemsByStageId = {};

        for (i = 0, l = data.length; i < l; i++) {
            stage = data[i];
            if (stage.id === undefined) continue;
            clickableElemsByStageId[stage.id + ''] = clickableElemsByRow[i];
        }
    }

    function rowClickHandler() {
        var stageData = this.data('stage'),
            popupData = stageData && (stageData.subchart || stageData.popup);

        if (!popupData) return;

        const defaultPopupTitle = Array.isArray(stageData.stage) && stageData.stage[0] && stageData.stage[0].text
            ? stageData.stage[0].text
            : '';

        openChartPopup(popupData, popupData.title || defaultPopupTitle);
    }

    function treeNodeClickHandler(allStages, surface, elementsByStage, visibleStageIds, rowHeights, timescaleHeight) {
        return function() {
            // КОСТЫЛЬ от ошибки при быстром двойном клике по одному этапу (не реагировать, пока не отработает уже идущая анимация)
            const isPrevAnimationInProgress = !!surface.node.querySelector('.gantt_tmp_animation_group');
            if (isPrevAnimationInProgress) {
                // TODO: сделать "поумнее" - либо останавливать предыдущую анимацию, либо откладывать обработку нового клика на момент сразу после окончания предыдущей
                return;
            }

            var stageData = this.data('stage'),
                substages = stageData.substages;

            if (!substages || !substages.length) return;

            var stageId = stageData._globalOrderNumber,
                parentStageId = stageData._parentStageId,
                isExpanded = !!~visibleStageIds.indexOf(substages[0]._globalOrderNumber);

            let diffStageIds;

            if (isExpanded) {
                const stageIdsToHide = findAllDescendantStageIds(allStages, stageId);
                // visibleStageIds = visibleStageIds.filter(stageId => !~stageIdsToHide.indexOf(stageId));
                // WARNING: КОСТЫЛЬ: Ссылку на массив visibleStageIds нельзя перезаписывать, поэтому применяем splice() вместо filter()
                for (let i = 0; i < visibleStageIds.length; i++) {
                    if (~stageIdsToHide.indexOf(visibleStageIds[i])) {
                        visibleStageIds.splice(i--, 1);
                    }
                }
                diffStageIds = stageIdsToHide;

                /* Rotate the expand arrows to the "collapsed" state */
                // Делаем таймаут, чтобы стрелка не сворачивалась сильно раньше анимации сворачивания
                setTimeout(function() {
                    for (let stageIdToHide of stageIdsToHide) {
                        const stageElems = elementsByStage[stageIdToHide];
                        const expandArrow = stageElems.label && stageElems.label.node.querySelector('.gantt_expand_arrow');
                        if (expandArrow) rotateExpandArrow(expandArrow, false, false);
                    }
                }, 200);
            } else {
                const stageIdsToShow = substages.map(item => item._globalOrderNumber);
                // visibleStageIds = visibleStageIds.concat(stageIdsToShow);
                // WARNING: КОСТЫЛЬ: Ссылку на массив visibleStageIds нельзя перезаписывать, поэтому применяем цикл вместо concat()
                for (let i = 0, l = stageIdsToShow.length; i < l; i++) {
                    visibleStageIds.push(stageIdsToShow[i]);
                }
                diffStageIds = stageIdsToShow;
            }

            /* Rotate the expand arrow */
            const stageElems = elementsByStage[stageId];
            const expandArrow = stageElems.label && stageElems.label.node.querySelector('.gantt_expand_arrow');
            if (expandArrow) rotateExpandArrow(expandArrow, !isExpanded);

            showVisibleStages(allStages, surface, elementsByStage, visibleStageIds, rowHeights, timescaleHeight, true, diffStageIds);
        };
    }

    function findAllDescendantStageIds(stages, parentStageId) {
        let result = [];

        for (let i = 0, l = stages.length; i < l; i++) {
            const stage = stages[i];

            if (stage._parentStageId === parentStageId) {
                const stageId = stage._globalOrderNumber;

                result.push(stageId);

                if (stage.substages) {
                    result = result.concat(
                        findAllDescendantStageIds(stage.substages, stageId)
                    );
                }
            }
        }

        return result;
    }

    function rotateExpandArrow(expandArrow, expand, withAnimation = true) {
        const arrowBBox = expandArrow.getBBox();
        const rotateCenterX = Math.round(arrowBBox.x + arrowBBox.width / 2);
        const rotateCenterY = Math.round(arrowBBox.y + arrowBBox.height / 2);
        const animateToValue = expand
            ? `r180,${rotateCenterX},${rotateCenterY}`
            : `r0,${rotateCenterX},${rotateCenterY}`;
        const fromAngle = expand ? 0 : 180;
        const toAngle = expand ? 180 : 0;
        if (withAnimation) {
            Snap(expandArrow).animate({ transform: animateToValue }, 200);
        } else {
            Snap(expandArrow).attr({ transform: animateToValue });
        }
    }

    async function openChartPopup(chartData, title) {
        if (chartData.url) {
            /* Load popup content via AJAX */
            loadPopupContent(chartData);
            return;
        }

        var legend = chartData.legend,
            additional = chartData.additional,
            titleHtml = '<h3>' + (title || '') + '</h3>',
            legendHtml = '', innerHtml, i, l;

        if (legend && legend.length) {
            for (i = 0, l = legend.length; i < l; i++) {
                legendHtml +=
                    '<div class="item">' +
                        '<div class="color" style="background-color: #' + legend[i].color + '"></div>' +
                        '<div class="label">' + legend[i].description + '</div>' +
                    '</div>';
            }
            legendHtml = '<div class="chart-legend">' + legendHtml + '</div>';
        }

        innerHtml = titleHtml + (additional || '') + legendHtml + '<div class="chart" data-gantt-chart></div>';

        const commonPopupOptions = getCommonPopupOptions(chartData);

        $.magnificPopup.open(Object.assign({}, commonPopupOptions, {
            preloader: false,
            callbacks: {
                open: function() {
                    const chartContainerNode = $('.mfp-container .chart')[0];
                    if (chartContainerNode) drawChart(chartContainerNode, chartData);

                    /* Костыль от бага: при клике по самому SVG почему-то попап не закрывался */
                    this.content.on('click', '.popup_close svg', function() {
                        $(this).parent().click();
                    });
                }
            },
            items: [
                {
                    src: popupWrapHTML[0] + innerHtml + popupWrapHTML[1],
                    type: 'inline'
                }
            ]
        }));
    }

    async function loadPopupContent(popupConfig, restoreScrollTop) {
        const commonPopupOptions = getCommonPopupOptions(popupConfig);
        const blockIndexAttr = 'data-ajax-popup-block-id';
        let popupScrollTop = null;

        if ($.magnificPopup.isOpen()) {
            /* Запомнить положение прокрутки, чтобы восстановить положение окна после перезагрузки попапа */
            popupScrollTop = document.querySelector('.mfp-wrap').scrollTop;

            $.magnificPopup.close();
        }

        $.magnificPopup.showOverlay({
            preloader: true,
            ajax: {
                cursor: 'mfp-ajax-cur', // CSS class that will be added to body during the loading (adds "progress" cursor)
                tError: '<a href="%url%">Ошибка</a> загрузки модального окна.'
            },
            tLoading: 'Загрузка...'
        });

        const popupContentBlocks = await api.get(popupConfig.url);

        /* JSON blocks => HTML */
        let popupContentHTML = '';
        for (let i = 0, l = popupContentBlocks.length; i < l; i++) {
            const popupBlock = popupContentBlocks[i];
            if (popupBlock.type === 'html') {
                popupContentHTML += popupBlock.content;
            } else if (popupBlock.type === 'table') {
                popupContentHTML += `<div class="popup_table" ${blockIndexAttr}="${i}"></div>`;
            } else if (popupBlock.type === 'ganttChart') {
                // TODO: REFACTOR: частичная копипаста куска функции `openChartPopup`, расположенного ниже

                const chartData = popupBlock.content;
                const legend = chartData.legend;
                let legendHtml = '';

                if (legend && legend.length) {
                    for (let i = 0, l = legend.length; i < l; i++) {
                        legendHtml +=
                            '<div class="item">' +
                                '<div class="color" style="background-color: #' + legend[i].color + '"></div>' +
                                '<div class="label">' + legend[i].description + '</div>' +
                            '</div>';
                    }
                    legendHtml = '<div class="chart-legend">' + legendHtml + '</div>';
                }

                const innerHtml = `${legendHtml}<div class="chart" data-gantt-chart ${blockIndexAttr}="${i}"></div>`;

                popupContentHTML += innerHtml;
            }
        }

        $.magnificPopup.close(); // close overlay

        $.magnificPopup.open(Object.assign({}, commonPopupOptions, {
            callbacks: {
                open: function() {
                    var $popup = this.content;

                    /* Отрисовка таблиц */
                    this.content.find('.popup_table').each(function() {
                        const blockIndex = +this.getAttribute(blockIndexAttr);
                        const tableData = popupContentBlocks[blockIndex].content;
                        new ReportTable().render({
                            container: this,
                            _report: tableData,
                            _filter: {},
                            _isHeaderStickable: false,
                        });
                    });

                    /* Отрисовка графиков */
                    this.content.find('.chart').each(function() {
                        const blockIndex = +this.getAttribute(blockIndexAttr);
                        const chartData = popupContentBlocks[blockIndex].content;

                        drawChart(this, chartData);
                    });

                    /* Попап с формой для загрузки XLSX планов-графиков мероприятий */
                    this.content.find('form.activity_xlsx_import_form').each(function() {
                        var updatePopup = function() {
                            // Redraw the chart with the updated data
                            loadPopupContent(popupConfig);
                        }
                        initActivityXlsxImportForm(this, $popup, updatePopup);
                    });

                    /* Костыль от бага: при клике по самому SVG почему-то попап не закрывался */
                    this.content.on('click', '.popup_close svg', function() {
                        $(this).parent().click();
                    });

                    // Костыль для передачи popupConfig в обработчик submit (для возможности перезагрузки содержимого попапа)
                    currentPopupConfig = popupConfig;

                    // Восстанавливаем положение скролла окна после перезагрузки попапа
                    if (popupScrollTop !== null) {
                        document.querySelector('.mfp-wrap').scrollTo(0, popupScrollTop);
                    }
                }
            },
            items: [
                {
                    type: 'inline',
                    src: popupWrapHTML[0] + popupContentHTML + popupWrapHTML[1]
                }
            ],
            overflowY: 'scroll'  // From the docs: "As we know that popup content is tall we set scroll overflow by default to avoid jump"
        }));
    }

    async function initActivityXlsxImportForm(form, $popup, updatePopup) {
        var $form = $(form);
        var $overlay = $form.prev();
        var $formOpenButton = $popup.find('[data-xlsx-menu-button]');
        var $importButton = $popup.find('[data-xlsx-import-button]');
        var $exportButton = $popup.find('[data-xlsx-export-button]');
        var $fileInput = $form.find('input[type="file"]');
        var $importLoader = $form.find('.import_loader');
        var needUpdateChart = false;

        const submenuOutsideClickListener = function(event) {
            const isClickInsideMenu = $formOpenButton[0].contains(event.target);
            if (!isClickInsideMenu) {
                closeSubmenu();
            }
        };

        $formOpenButton.click(function() {
            const $parent = $(this).parent();

            $parent.toggleClass('menu_opened');

            if ($parent.hasClass('menu_opened')) {
                $popup.click(submenuOutsideClickListener);
            } else {
                $popup.off('click', submenuOutsideClickListener);
            }
        });

        function closeSubmenu() {
            $formOpenButton.parent().removeClass('menu_opened');
            $popup.off('click', submenuOutsideClickListener);
        }

        $importButton.click(function() {
            closeSubmenu();
            showImportForm();
        });

        $exportButton.click(async function() {
            closeSubmenu();

            // Redirect to the export URL

            if (this.dataset.processing) return;

            const activityId = this.dataset.activityId;

            const url = await api.getActivityScheduleExportUrl({ activityId });
            const additionalOptions = {};
            if (isIOSSafari) additionalOptions.access_token = User.token;

            const filename = this.dataset.fileName || 'plan-grafik.xlsx';

            if (isIOSSafari) {
                // Safari на iOS не может нормально скачивать блобы - редиректим напрямую на ссылку с токеном
                window.location.href = url;
            } else {
                this.dataset.processing = true;

                const finishCallback = () => {
                    delete this.dataset.processing;
                };

                api.downloadFile(url, filename, finishCallback);
            }

            // location.href = 'http://prod-host.test:15000/api/activity-schedule/excel/export?activityId=514';
        });

        function showImportForm() {
            var formWidth = $form.actual('outerWidth');
            var formHeight = $form.actual('outerHeight');

            var minTop = 80;
            var formTop = Math.max((window.innerHeight - formHeight) / 2, minTop);
            var formLeft = Math.round(($popup.outerWidth() - formWidth) / 2);

            var containerTopY = $popup.offset().top;
            var containerBottomY = containerTopY + $popup[0].offsetHeight;
            var formBottomY = containerTopY + formTop + formHeight;
            if (formBottomY > containerBottomY) {
                formTop = $popup[0].offsetHeight - formHeight - 2; // 2 - небольшой сдвиг вверх (лучше смотрится)
            }

            /* Stretch overlay to full screen */
            var popupPos = $popup[0].getBoundingClientRect();
            var overlayTop = Math.floor(-popupPos.top);
            var overlayLeft = Math.floor(-popupPos.left);
            var overlayRight = overlayLeft;
            var popupStyle = window.getComputedStyle($popup[0]);
            var popupMarginBottom = parseInt(popupStyle.getPropertyValue('margin-top'));
            var overlayBottom = Math.floor(-popupMarginBottom);

            $overlay.css({ top: `${overlayTop}px`, left: `${overlayLeft}px`, right: `${overlayRight}px`, bottom: `${overlayBottom}px` })
                .addClass('open');

            $form.css({ top: `${formTop}px`, left: `${formLeft}px`, /*width: `${chartBodyWidth}px`*/ }).show();
        }

        function hideForm() {
            $form.hide();
            $overlay.removeClass('open');

            if (needUpdateChart) {
                // Redraw the chart with the updated data
                updatePopup();
            } else {
                clearActivityXlsxImportForm(this, $popup);
            }
        }

        function showError(message) {
            $form.find('.error_message .red').html(message);
        }

        $form.find('.popup_close').click(function() {
            if ($popup.hasClass('processing')) return;
            hideForm();
        });

        $overlay.click(function() {
            if ($popup.hasClass('processing')) return;
            hideForm();
        });

        $form.find('button[data-action="close"]').click(function() {
            hideForm();
        });

        $form.find('button[data-select-file]').click(function() {
            $fileInput.val('').click();
        });

        $fileInput.on('change', function(event) {
            var files = event.target.files;
            if (!files || !files.length) return;

            var file = files[0];
            uploadFile(this.name, file);
        });

        async function uploadFile(fileFieldName, file) {
            event.preventDefault();

            var tableContainer = $form.find('.import_result_table')[0];
            tableContainer.innerHTML = '';
            showError(''); // clear error message

            $form.find('button').prop('disabled', true);
            $popup.addClass('processing');
            $importLoader.removeClass('hidden');

            var formDataObject = {
                [fileFieldName]: file,
                activityId: $form.find('input[name="activityId"]').val()
            };

            var response;
            try {
                response = await api.post($form.attr('action'), formDataObject);
            } catch (error) {
                const message = error.responseJson && error.responseJson.message
                    || error.responseText
                    || error.message
                    || error;
                showError(message);
            } finally {
                $form.find('button').prop('disabled', false);
                $importLoader.addClass('hidden');
                $form.find('.import_result').removeClass('hidden');
                $popup.removeClass('processing');
            }

            if (response && response.success === true) {
                if (response.resultTable) {
                    new ReportTable().render({
                        container: tableContainer,
                        _report: { data: response.resultTable },
                        _filter: {},
                        _isHeaderStickable: false,
                    });
                }
                needUpdateChart = true;
            } else {
                const message = response.error && response.error.message
                    || response.error
                    || response;
                showError(message);
            }
        }

        function clearActivityXlsxImportForm() {
            $form.find('.import_success_table').html('');
            $form.find('.error_message .red').html('');
            $form.find('.import_result').addClass('hidden');
            $importLoader.addClass('hidden');
        }
    }

    function getCommonPopupOptions(chartData) {
        return {
            closeMarkup:
                '<button title="Закрыть" type="button" class="mfp-close popup_close">' +
                    '<svg class="" width="22px" height="22px">' +
                        '<use xlink:href="#icn_close_cross"></use>' +
                    '</svg>' +
                '</button>',
            mainClass: 'white-popup-wrap'
        };
    }

    function wrapToLink(element, url) {
        var link = Snap(document.createElementNS('http://www.w3.org/2000/svg', 'a')).attr({
            'xlink:href': url,
            'target': '_blank'
        });
        link.append(element);
        return link;
    }

    function svg_textMultiline(element, x, width, fontSize = 16) {
        var dy = 0; // смещение от предыдущей строки
        var lineHeight = 1.25;

        var text = element.innerHTML;
        var words = text.split(' ');
        var line = '';

        /* Make a tspan for testing */
        element.innerHTML = '<tspan id="PROCESSING">busy</tspan>';
        var testElem = document.getElementById('PROCESSING');

        var resultSvg = '';

        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + ' ';
            /* Add line in testElement */
            testElem.innerHTML = testLine;
            /* Measure textElement */
            var metrics = testElem.getBoundingClientRect();
            var testWidth = metrics.width;

            if (testWidth > width && n > 0) {
                resultSvg += '<tspan x="' + x + '" dy="' + dy + '">' + line + '</tspan>';
                line = words[n] + ' ';
                dy = fontSize * lineHeight;
            } else {
                line = testLine;
            }
        }

        resultSvg += '<tspan x="' + x + '" dy="' + dy + '">' + line + '</tspan>';
        testElem.remove();
        element.innerHTML = resultSvg;
    }

    function getStageTopY(stage, stageOrderNumber, timescaleHeight) {
        var rowClusterIndex = stage.clusterIndex,
            clusterDividersHeight = rowClusterIndex !== undefined
                ? settings.cluster.divider.height * (rowClusterIndex + 1)
                : 0;

        return settings.currentDate.blockHeight + timescaleHeight
            /* + getVisibleStagesCommonHeight(rowHeights, visibleStageIds, stageOrderNumber)*/
            + clusterDividersHeight;
    }

    /* Возвращает сумму высот строк, видимых в данный момент;
    опционально - до некоторой N-й строки (невключительно) */
    function getVisibleStagesCommonHeight(rowHeights, visibleStageIds, beforeRowIndex) {
        var heights = beforeRowIndex !== undefined
            ? rowHeights.slice(0, beforeRowIndex)
            : rowHeights;
        var l = beforeRowIndex !== undefined
            ? beforeRowIndex
            : heights.length;
        var resultSum = 0;

        for (let i = 0; i < l; i++) {
            if (~visibleStageIds.indexOf(i)) {
                resultSum += heights[i];
            }
        }

        return resultSum;
    }

    function moveStageElemsUnderRow(surface, rowHeights, visibleStageIds, diffStageIds) {
        const numComparator = function(a, b) {
            return a - b;
        };

        const lastDiffStageId = diffStageIds.slice().sort(numComparator)[diffStageIds.length - 1];
        const maxDiffId = Math.max(...diffStageIds);

        let bottomTopVisibleStageId = null;
        const sortedVisibleStageIds = visibleStageIds.slice().sort(numComparator);
        for (let visibleStageId of sortedVisibleStageIds) {
            if (visibleStageId > lastDiffStageId) {
                bottomTopVisibleStageId = visibleStageId;
                break;
            }
        }

        // Если под разворачиваемыми/сворачиваемыми этапами нет нижестоящих, выходим
        if (bottomTopVisibleStageId === null) return;

        const groupAbsTranslateY = getVisibleStagesCommonHeight(rowHeights, visibleStageIds, bottomTopVisibleStageId);
        let groupTranslateY = null;

        const allStageLabels = [].slice.apply(surface.node.querySelector('#stages').children, [1]);
        const allStageBgs = [].slice.apply(surface.node.querySelector('#zebra').children);
        const allStageSeries = [].slice.apply(surface.node.querySelector('#stripes').children);
        const allStageButtons = [].slice.apply(surface.node.querySelector('#buttonColumn').children);
        const stagePartGroups = [
            allStageLabels,
            allStageBgs,
            allStageSeries,
            allStageButtons,
        ];

        for (let allStageParts of stagePartGroups) {
            const lastDiffStagePart = allStageParts[lastDiffStageId];
            const tmpGroupClass = 'gantt_tmp_animation_group';
            const tmpGroup = surface.g().attr({ class: tmpGroupClass });
            Snap(lastDiffStagePart.parentElement).add(tmpGroup);

            for (let i = lastDiffStageId + 1, l = allStageParts.length; i < l; i++) {
                tmpGroup.add(Snap(allStageParts[i]));
            }

            if (groupTranslateY === null) {
                /* offset группы этапов одинаков для всех частей этих этапов, поэтому вычисляем его однажды при разворачивании */
                // currentBottomTranslateY - смещение самого верхнего этапа в нижнем сдвигающемся блоке
                const currentBottomTranslateY = +Snap(allStageParts[bottomTopVisibleStageId]).attr('transform').string.match(/^t\d+,([\d\.]+)$/)[1];
                groupTranslateY = groupAbsTranslateY - currentBottomTranslateY;
            }

            const animateAttrs = { transform: `translate(0,${groupTranslateY})` };
            tmpGroup.animate(animateAttrs, 300, undefined, function() {
                // Разгруппировываем элементы из вспомогательной группы
                for (let i = lastDiffStageId + 1, l = allStageParts.length; i < l; i++) {
                    const currentTransform = Snap(allStageParts[i]).attr('transform').string;
                    const match = currentTransform.match(/^t\d+,([\d\.]+)$/);
                    if (match) {
                        const currentYOffset = +match[1] || 0;
                        const newStageYOffset = currentYOffset + groupTranslateY;
                        Snap(allStageParts[i]).attr({ transform: `translate(0,${newStageYOffset})` });
                    }
                    tmpGroup.parent().add(Snap(allStageParts[i]));
                }
                tmpGroup.remove();
            });
        }
    }

    function showVisibleStages(allStages, surface, elementsByStage, visibleStageIds, rowHeights, timescaleHeight, animate = true, diffStageIds = null) {
        /* diffStageIds - это список ID подэтапов, которые скрываются/раскрываются.
        Они нужны, чтобы красиво анимировать сворачивание/разворачивание дерева */
        let isExpanding = null;
        if (diffStageIds && diffStageIds.length) {
            isExpanding = !!~visibleStageIds.indexOf(diffStageIds[0]);

            if (isExpanding) {
                /* Все этапы по умолчанию рендерятся в левом верхнем углу поля графика.
                Для плавного появления при разворачивании сначала нужно перенести "новые" этапы в место появления без анимаций */
                for (let stageId of diffStageIds) {
                    const stageElems = elementsByStage[stageId];
                    if (!stageElems) {
                        // TODO: throw an error?..
                        console.log(`Elements of stage ${stageId} not found`);
                        continue;
                    }
                    const translateY = getVisibleStagesCommonHeight(rowHeights, visibleStageIds, stageId);
                    for (let key in stageElems) {
                        const elemGroup = stageElems[key];
                        elemGroup.attr({ transform: `translate(0,${translateY})`, opacity: 0.1 });
                    }
                }
            }

            moveStageElemsUnderRow(surface, rowHeights, visibleStageIds, diffStageIds);
        }

        let isOddVisibleStage = false;

        for (let i = 0, l = allStages.length; i < l; i++) {
            const stage = allStages[i];
            const stageId = stage._globalOrderNumber;
            const isStageVisible = !!~visibleStageIds.indexOf(stageId);
            const stageElems = elementsByStage[stageId];
            if (!stageElems) {
                // TODO: throw an error?..
                console.log(`Elements of stage ${stageId} not found`);
                continue;
            }

            // TODO: отрефакторить код ниже после добавления функции moveStageElemsUnderRow (убрать ненужный, если есть)
            if (diffStageIds && !~diffStageIds.indexOf(stageId)) continue;

            let translateY, newVisibility, newOpacity;
            if (isStageVisible) {
                translateY = getVisibleStagesCommonHeight(rowHeights, visibleStageIds, stageId);

                /* С этапами, которые уже видны/скрыты, не производим никаких манипуляций (иначе может быть заметно дрожание элементов) */
                const isStageAlreadyInPosition =
                    stageElems.label &&
                    stageElems.label.attr('visibility') === 'visible' &&
                    stageElems.label.attr('transform') === `matrix(1,0,0,1,0,${translateY})`;
                if (isStageAlreadyInPosition) {
                    // Recolor back zebra (copypasted from the bottom of this loop; TODO: refactor)
                    stageElems.bg.attr(settings.zebra[isOddVisibleStage ? 'odd' : 'even']);
                    isOddVisibleStage = !isOddVisibleStage;
                    continue;
                }

                newVisibility = 'visible';
                newOpacity = 1;
            } else {
                const isStageAlreadyHidden = stageElems.label && stageElems.label.attr('visibility') === 'hidden';
                if (isStageAlreadyHidden) continue;

                translateY = 0;
                newVisibility = 'hidden';
                newOpacity = 0;
            }

            for (let key in stageElems) {
                const elemGroup = stageElems[key];

                if (isStageVisible) {
                    elemGroup.attr({ visibility: newVisibility });
                    const animateAttrs = { transform: `translate(0,${translateY})`, opacity: newOpacity };
                    if (animate) {
                        elemGroup.animate(animateAttrs, 300, undefined, () => {
                            /* Видимость этапа проверяем заново, т.к. когда пользователь быстро сворачивает/разворачивает этап,
                            этот постанимационный коллбэк может быть уже не нужен
                            (иначе будет ситуация, когда этап снова открыт, но запоздавший коллбэк ставит visibility: hidden) */
                            const isStageVisibleYet = !!~visibleStageIds.indexOf(stageId);
                            if (isStageVisibleYet) {
                                elemGroup.attr({ visibility: newVisibility });
                            }
                        });
                    } else {
                        elemGroup.attr(animateAttrs);
                    }
                } else {
                    const animateAttrs = { opacity: newOpacity };
                    if (animate) {
                        elemGroup.animate(animateAttrs, 300, undefined, () => {
                            /* Видимость этапа проверяем заново, т.к. когда пользователь быстро сворачивает/разворачивает этап,
                            этот постанимационный коллбэк может быть уже не нужен
                            (иначе будет ситуация, когда этап снова открыт, но запоздавший коллбэк ставит visibility: hidden) */
                            const isStageVisibleYet = !!~visibleStageIds.indexOf(stageId);
                            if (!isStageVisibleYet) {
                                elemGroup.attr({ transform: `translate(0,${translateY})`, visibility: newVisibility });
                            }
                        });
                    } else {
                        elemGroup.attr(animateAttrs);
                        if (!isStageVisible) {
                            elemGroup.attr({ transform: `translate(0,${translateY})`, visibility: newVisibility });
                        }
                    }
                }
            }

            if (isStageVisible) {
                // Recolor back zebra
                stageElems.bg.attr(settings.zebra[isOddVisibleStage ? 'odd' : 'even']);
                isOddVisibleStage = !isOddVisibleStage;
            }
        }

        // Update chart height
        const totalChartHeight = settings.currentDate.blockHeight + timescaleHeight + getVisibleStagesCommonHeight(rowHeights, visibleStageIds);
        const chartAnimateAttrs = { height: totalChartHeight };
        if (animate) {
            surface.animate(chartAnimateAttrs, 300);
        } else {
            surface.attr(chartAnimateAttrs);
        }

        // Adjust grid
        const gridLines = surface.node.querySelectorAll('[id="grid"] line');
        const gridAnimateAttrs = { y2: totalChartHeight };
        for (let line of gridLines) {
            if (animate) {
                Snap(line).animate(gridAnimateAttrs, 300);
            } else {
                Snap(line).attr(gridAnimateAttrs);
            }
        }

        // Adjust global marks
        const globalMarks = surface.node.querySelectorAll('.gantt_global_mark_line');
        for (let mark of globalMarks) {
            if (animate) {
                Snap(mark).animate(gridAnimateAttrs, 300);
            } else {
                Snap(mark).attr(gridAnimateAttrs);
            }
        }
    }

    function highlightStages(stageIds) {
        var stageId, elements,
            i, l, j, m;

        for (i = 0, l = stageIds.length; i < l; i++) {
            stageId = stageIds[i] + '';
            elements = clickableElemsByStageId[stageId];
            if (!elements) continue;
            highlightStage(elements);
        }
    }

    function highlightStage(elements) {
        var labelBackground, labelText;

        // подсвечиваем пока только первый элемент (фон метки с текстом)
        labelBackground = elements[0];
        labelText = elements[1];
        labelBackground
            .data('highlightBackupFill', labelBackground.attr('fill')) // запоминаем исходный цвет ячейки
            .attr({ fill: settings.stageHighlighting.labelBackground });
        labelText
            .data('highlightBackupFill', labelText.attr('fill')) // запоминаем исходный цвет текста
            .attr({ fill: settings.stageHighlighting.textColor });
    }

    function clearStageHighlighting() {
        var elements, labelBackground, labelText,
            i, l, j, m;

        for (i = 0, l = clickableElemsByRow.length; i < l; i++) {
            elements = clickableElemsByRow[i];
            if (!elements) continue;

            labelBackground = elements[0];
            labelText = elements[1];

            if (labelBackground.data('highlightBackupFill')) {
                labelBackground.attr({
                    fill: labelBackground.data('highlightBackupFill') // восстанавливаем исходный цвет ячейки
                });
            }
            if (labelText.data('highlightBackupFill')) {
                labelText.attr({
                    fill: labelText.data('highlightBackupFill') // восстанавливаем исходный цвет текста
                });
            }
        }
    }

    /* Форматирует дату в виде: 16 фев 2017 */
    function formatDate(date) {
        var monthNames = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
            year = date.getFullYear(),
            monthIndex = date.getMonth(),
            day = date.getDate();

        return [day, monthNames[monthIndex], year].join(' ');
    }

    function bindClickHandlers(element, handlers, stageData) {
        for (var i = 0, l = handlers.length; i < l; i++) {
            element.click(handlers[i].bind(element, stageData));
        }
    }

    $('body').on('click', '[data-highlight-stages]', function() {
        $(this).siblings().removeClass('on');
        $(this).removeClass('off').toggleClass('on');

        var stageIds = $(this).data('highlightStages'),
            isOn = $(this).hasClass('on');

        if (isOn) {
            $(this).siblings().addClass('off'); // для изменения цвета неактивных
        } else {
            $(this).siblings().removeClass('off');
        }

        clearStageHighlighting();
        if (isOn) {
            highlightStages(stageIds);
        }
    });

    function updateLegend(legend, chartContainer) {
        var legendNode = chartContainer.parentElement.querySelector('.chart-legend');

        if (!legend || !legendNode) {
            if (legendNode) legendNode.innerHTML = '';
            return;
        }

        var html = '';
        var isSingleRow = !legend.data && !legend.layout;
        if (isSingleRow) {
            html = '<div class="box">' + _renderLegendBlock(legend) + '</div>';
        } else {
            for (var i = 0, l = legend.data.length; i < l; i++) {
                html += '<div class="box">' + _renderLegendBlock(legend.data[i]) + '</div>';
            }
        }

        legendNode.innerHTML = html;

        if (!isSingleRow && legend.layout === 'columns') {
            legendNode.classList.remove('layout-rows');
            legendNode.classList.add('layout-columns');
        } else {
            legendNode.classList.remove('layout-columns');
            legendNode.classList.add('layout-rows');
        }
    }

    function _renderLegendBlock(legendBlock) {
        var result = '';
        for (var i = 0, l = legendBlock.length; i < l; i++) {
            var item = legendBlock[i];

            var color = escapeHtml(item.color || 'fff');
            var value = escapeHtml(item.value || '');
            var description = escapeHtml(item.description || '');
            var isColorItem = !!item.color;

            result +=
                '<div class="item">' +
                    ( isColorItem
                        ?
                            '<div class="color" style="background-color: #' + color + '"></div>' +
                            '<div class="label">' + description + '</div>'
                        :
                            '<div class="label">' + value + ' &mdash; ' + description + '</div>'
                    ) +
                '</div>';
        }
        return result;
    }

    function escapeHtml(str) {
        return str
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    function cloneViaJSON(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    window.ganttChart_update = function(container, data) {
        settings = cloneViaJSON(defaultSettings); // TODO: ужасный костыль, убрать
        drawChart(container, data);
        if (data) {
            updateLegend(data.legend, container);
        }
    };

    window.ganttChart_highlightStages = function(stageIds) {
        clearStageHighlighting();
        highlightStages(stageIds);
    }

})();

export { ganttChart_update };
