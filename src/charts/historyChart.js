import { format_dmY, format_dmY_time, formatYmd, getWeekAgoDate, getMonthAgoDate } from '../utils/date';
import { isMobile, isIOSSafari } from '../utils/browser';
import { isObject } from '../utils/common';
import $ from 'jquery';
import api from '../api';
import Flot from '../vendor/flot/jquery.flot.js';
import FlotAxisLabels from '../vendor/flot/jquery.flot.axislabels.js';
import FlotCrosshair from '../vendor/flot/jquery.flot.crosshair.js';
import FlotNavigate from '../vendor/flot/jquery.flot.navigate.js';
import FlotTime from '../vendor/flot/jquery.flot.time.js';
import FlotTouch from '../vendor/flot/jquery.flot.touch.kim.js';
import FlotTooltip from '../vendor/flot/flot.tooltip-0.9.0/js/jquery.flot.tooltip.kim.js';
import MagnificPopup from '../vendor/jquery.magnific-popup.js'; // своя вариация с запоминанием ранее открытого попапа
import pickmeup from '../vendor/jquery.pickmeup/jquery.pickmeup.min';
import pickmeupCss from '../vendor/jquery.pickmeup/pickmeup.min.css';

const loaderIcon = createLoader();

let hidePlotTooltip = null; // function; костыль для закрытия тултипа над графиком при закрытии попапа

/* Открытие попапа с графиком при клике по кнопке */
export function bindHistoryChart(linkNode, options) {
    linkNode.addEventListener('click', async function() {

        const settings = options || this.dataset;
        const showLoaderInToggle = settings.showLoaderInToggle !== false;

        const historyDataUrl = settings.historyDataUrl;
        if (!historyDataUrl) return;

        const hasPeriodFilter = !!settings.hasPeriodFilter;

        const defaultParams = !hasPeriodFilter
            ? {}
            : { startDate: formatYmd(getMonthAgoDate()), endDate: formatYmd(new Date()) };
        const chartData = await loadData(historyDataUrl, defaultParams, showLoaderInToggle ? this : null);

        const chartTitle = settings.chartTitle;
        const yAxisLabel = settings.xAxisLabel; // TODO ошибка в названии параметра - вместо 'x' должно быть 'y'!!! исправить на сервере

        const popupMargins = isMobile
            ? { top: 10, right: 10, bottom: 10, left: 10 }
            : { top: 20, right: 20, bottom: 20, left: 20 };
        const popupPaddings = isMobile
            ? { top: 20, right: 30, bottom: 35, left: 30 }
            : { top: 20, right: 40, bottom: 40, left: 40 };
        const titleHeight = 75; // высота двух строчек заголовка
        const legendHeight = 42; // высота одной строки легенды
        const chartWidth = Math.min(window.innerWidth -
            (popupMargins.left + popupMargins.right) -
            (popupPaddings.left + popupPaddings.right),
            1000
        );
        const chartHeight = Math.min(window.innerHeight -
            titleHeight -
            legendHeight -
            (popupMargins.top + popupMargins.bottom) -
            (popupPaddings.top + popupPaddings.bottom),
            350
        );

        const periodFilterHtml = hasPeriodFilter
            ? `<div class="filter flex white">
                <div class="left_part">
                    <div class="filters_group">
                        <ul data-filter="true" data-type="radio" data-name="period">
                            <li data-value="week">
                                <a href="javascript:">За неделю</a>
                            </li>
                            <li data-value="month" class="selected">
                                <a href="javascript:">За месяц</a>
                            </li>
                            <li data-value="year">
                                <a href="javascript:">За год</a>
                            </li>
                            <li data-value="all">
                                <a href="javascript:">За всё время</a>
                            </li>
                            <li data-value="custom" data-has-datepicker="true" data-pmu-mode="range">
                                <a href="javascript:">Произвольный</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>`
            : '';

        $.magnificPopup.open({
            preloader: true,
            items: {
                src:
                    `<div class="history-chart-container">
                        <h3>${chartTitle}</h3>
                        ${periodFilterHtml}
                        <div class="history-chart" style="width:${chartWidth}px;height:${chartHeight}px" data-working-height="${chartHeight}"></div>
                        <div class="legend-container"></div>
                        <div class="mfp-close history-chart-close icn icn_cross_big_white" title="Закрыть окно с графиком"></div>
                    </div>`,
                type: 'inline'
            },
            closeBtnInside: false,
            closeOnBgClick: true,
            mainClass: 'mfp-history-chart',
            showCloseBtn: false,
            rememberPrevious: true,
            callbacks: {
                open: async function() {
                    const $baseContainer = this.content;

                    renderChart($baseContainer, chartData);

                    /* Init period filters */
                    if (!hasPeriodFilter) return;
                    $baseContainer.find('[data-filter] li:not([data-value="custom"])').click(async function(event) {
                        $(this).siblings('.selected').removeClass('selected');
                        $(this).addClass('selected');

                        const periodKey = this.dataset.value;
                        let endDateTime = new Date();
                        let startDateTime = new Date();

                        switch (periodKey) {
                            case 'week':
                                startDateTime = getWeekAgoDate(endDateTime);
                                break;
                            case 'month':
                                startDateTime = getMonthAgoDate(endDateTime);
                                break;
                            case 'year':
                                startDateTime.setFullYear(startDateTime.getFullYear() - 1);
                                break;
                            case 'all':
                                startDateTime = endDateTime = null;
                                break;
                        }

                        const chartData = await loadData(historyDataUrl,
                            startDateTime && endDateTime
                            ? {
                                startDate: formatYmd(startDateTime),
                                endDate: formatYmd(endDateTime)
                            }
                            : {}
                        );

                        renderChart($baseContainer, chartData);
                    });

                    const $datePickerNode = $baseContainer.find('[data-filter] li[data-value="custom"]');
                    initDatepicker($datePickerNode);
                    $datePickerNode.on('periodPick', async function(event) {
                        $(this).siblings('.selected').removeClass('selected');
                        $(this).addClass('selected');

                        const node = event.currentTarget;
                        const { startDate, endDate } = JSON.parse(node.dataset.value);

                        const chartData = await loadData(historyDataUrl,
                            { startDate, endDate }
                        );

                        renderChart($baseContainer, chartData);
                    });
                },
                beforeClose: function() {
                    const $baseContainer = this.content;

                    const $datePickerNode = $baseContainer.find('[data-filter] li[data-has-datepicker]');
                    $datePickerNode.pickmeup('destroy');

                    if (hidePlotTooltip) {
                        hidePlotTooltip();
                        hidePlotTooltip = null;
                    }
                }
            }
        });
    });
}

export function bindHistoryCharts(container) {
    container.querySelectorAll('[data-history-link]').forEach(linkNode => {
        bindHistoryChart(linkNode);
    });
}

export function renderChart($baseContainer, chartData, yAxisLabel) {
    const $chartBox = $baseContainer.find('.history-chart');

    if (!chartData || !chartData.length) {
        showNoDataMessage($chartBox);
        return;
    } else {
        // При повторной отрисовке в тот же контейнер
        $chartBox.removeClass('no_data').html('')
            .css({ height: `${$chartBox[0].dataset.workingHeight}px` });
    }

    let periodsToHighlight;
    for (let i = 0, l = chartData.length; i < l; i++) {
        const series = chartData[i];
        if (series.kimHighlightPeriods) {
            periodsToHighlight = series.kimHighlightPeriods;
            chartData.splice(i, 1);
            break;
        }
    }

    const $legendContainer = $chartBox.siblings('.legend-container').eq(0);
    const historySeries = chartData[chartData.length - 1];

    if (!historySeries.data || !historySeries.data.length) {
        showNoDataMessage($chartBox);
        return;
    }

    const minX = historySeries.data[0][0];
    const maxX = historySeries.data[historySeries.data.length - 1][0];
    const chartXRange = maxX - minX;

    const plot = $.plot($chartBox, chartData, mergeChartOptions({
        series: {
            lines: {
                show: true
            },
            shadowSize: 0
        },
        xaxis: {
            mode: 'time',
            timeformat: '%d.%m.%Y',
            zoomRange: [ 7 * 24 * 60 * 60 * 1000, chartXRange ],
            panRange: [minX, maxX]
        },
        yaxis: {
            axisLabel: yAxisLabel,
            axisLabelClasses: (yAxisLabel || '').length < 3 ? ' horizontal' : '',
            axisLabelPadding: 6,
            zoomRange: false,
            panRange: false
        },
        axisLabels: {
            show: true
        },
        crosshair: {
            mode: 'x',
            color: '#25366D',
            //lineWidth: 2,
        },
        grid: {
            hoverable: true,
            autoHighlight: false,
            gridlineStyle: function(value, axisDirection, ctx) { // функция для задания стиля отдельной gridline
                // Более темные линии для 1 января
                if (axisDirection !== 'x') return;
                const date = new Date(value);
                if (!date.getMonth() && date.getDate() == 1) {
                    ctx.strokeStyle = '#545454';
                    ctx.setLineDash([10, 5]);
                };
            }
        },
        legend: {
            container: $legendContainer,
            labelBoxBorderColor: 'transparent'
        },
        zoom: {
            interactive: true
        },
        pan: {
            interactive: true
        },
        tooltip: {
            show: true,
            maxDistance: false, // показывать тултип при наведении на любую точку полотна графика (не при приближении к точкам)
            defaultTheme: false,
            clickTips: isMobile,
            content: function(unsortedFlotItems) {
                if (!unsortedFlotItems.length) return '';

                const flotItems = unsortedFlotItems.slice().sort((itemA, itemB) => {
                    const itemAOrder = +(itemA.series.tooltip && itemA.series.tooltip.seriesOrder !== undefined
                        ? +itemA.series.tooltip.seriesOrder
                        : 100500);
                    const itemBOrder = +(itemB.series.tooltip && itemB.series.tooltip.seriesOrder !== undefined
                        ? +itemB.series.tooltip.seriesOrder
                        : 100500);
                    return itemAOrder - itemBOrder;
                });

                const rowTemplate = '<tr><td class="flotTip-label">{label}</td><td class="flotTip-value">{value}</td></tr>';
                const singleRowTemplate = '<tr><td class="flotTip-value" colspan="2">{value}</td></tr>';

                /* Render date first */
                const firstFlotItem = flotItems[0];
                const date = new Date(Math.round(firstFlotItem.datapoint[0]));
                const timeFormatFunction = firstFlotItem.series.showTimeOnHover ? format_dmY_time : format_dmY;
                /* WARNING! Костыль: сервер передает местное время будто бы в UTC - для Flot.
                А чтоб отобразить пользователю, придется делать вычет сдвига временной зоны */
                const visibleDate = new Date(+date + date.getTimezoneOffset() * 60000);
                const formattedDateTime = timeFormatFunction(visibleDate);

                let result = '<table><tbody>' +
                    singleRowTemplate.replace('{value}', formattedDateTime);

                for (let flotItem of flotItems) {
                    const { series, datapoint } = flotItem;

                    const formattedValue = datapoint[1].toFixed(2);

                    let label = series.formatting && series.formatting.label || series.label;
                    if (series.color) {
                        label = `<div class="flotTip-color" style="background-color:${series.color};"></div>${label}`;
                    }

                    let unit = series.formatting && series.formatting.unit || '';

                    result += rowTemplate
                        .replace('{label}', label)
                        .replace('{value}', `${formattedValue}${unit}`);
                }

                result += '</tbody></table>';

                return result;
            },
        },
        hooks: {
            drawBackground: [
                function(plot, canvascontext) {
                    highlightPeriods(periodsToHighlight, plot, canvascontext); // Подсветка периодов навигации
                }
            ]
        },
        touch: isMobile
            ? {
                pan: 'x',
                scale: 'x',
            }
            : undefined,
    }, historySeries && historySeries.chartOptions || {}));

    /* Close the tooltip when clicking/tapping outside of the plot area */
    if (isMobile) {
        $baseContainer.click(event => {
            if ($chartBox[0] && !$chartBox[0].contains(event.target)) {
                plot.hideTooltip();
            }
        });

        hidePlotTooltip = function() {
            plot.hideTooltip();
        };
    }

    var latestPosition = null;

    function findNearestPoint(series, pos) { // Find the nearest points, x-wise
        var minDistance = 0;
        var nearestPoint = null;
        var nearestPointIndex = null;
        for (let i = 0; i < series.data.length; ++i) {
            const distance = Math.abs(series.data[i][0] - pos.x);
            if (!nearestPoint || distance < minDistance) {
                minDistance = distance;
                nearestPoint = series.data[i];
                nearestPointIndex = i;
            }
            /* Хак для оптимизации: предполагаем, что точки упорядочены по возрастанию X,
            тогда увеличение расстояния означает, что ближайшую точку мы уже нашли */
            if (distance > minDistance) {
                break;
            }
        }
        return { nearestPoint, nearestPointIndex };
    }

    function highlightPeriods(periods, plot, canvascontext) {
        if (!periods) return;

        const canvasHeight = +plot.getCanvas().height;
        const plotArea = getPlotAreaCoords(plot);
        const fillOpacity = isIOSSafari ? .8 : .3;
        canvascontext.fillStyle = `rgba(234, 243, 251, ${fillOpacity})`;

        for (let period of periods) {
            let [ startDate, endDate ] = period;

            var point1 = plot.pointOffset({ x: startDate, y: 0}); // translate a value to pixels
            var point2 = plot.pointOffset({ x: endDate, y: 0});

            const rectLeftX = point1.left;
            const rectWidth = point2.left - point1.left;
            const rectRightX = rectLeftX + rectWidth;

            const isRectInvisible =
                rectLeftX > plotArea.right ||
                rectRightX < plotArea.left;

            if (isRectInvisible) continue;

            if (rectLeftX < plotArea.left) {
                rectWidth -= plotArea.left - rectLeftX;
                rectLeftX = plotArea.left;
            }
            if (rectRightX > plotArea.right) {
                rectWidth -= rectRightX - plotArea.right;
            }

            canvascontext.fillRect(rectLeftX, plotArea.top, rectWidth, plotArea.height);
        }
    }

    function getPlotAreaCoords(plot) {
        const { top: plotAreaPageTop, left: plotAreaPageLeft } = plot.offset();
        const canvasTop = plot.getCanvas().getBoundingClientRect().top + window.pageYOffset;
        const canvasLeft = plot.getCanvas().getBoundingClientRect().left + window.pageXOffset;
        const plotArea = {
            top: plotAreaPageTop - canvasTop,
            left: plotAreaPageLeft - canvasLeft,
            width: plot.width(),
            height: plot.height()
        };
        plotArea.right = plotArea.left + plotArea.width;
        return plotArea;
    }
}

async function loadData(baseUrl, params, loaderContainer = null) {
    if (loaderContainer) showLoader(loaderContainer);

    let chartData;
    try {
        chartData = await api.get(baseUrl, params);
    } finally {
        if (loaderContainer) hideLoader(loaderContainer);
    }

    return chartData;
}

function createLoader() {
    const loaderIcon = new Image();
    loaderIcon.src = require('../images/loader_small_slate@2x.gif');
    loaderIcon.classList.add('loader');
    return loaderIcon;
}

function showLoader(historyButton) {
    const historyIcon = historyButton.querySelector('.icn_history_icon');
    if (historyIcon) {
        // Кнопка с иконкой в окне объекта на карте
        historyIcon.style.display = 'none';
    } else {
        // Псевдоссылка с текстом в табличных отчетах
        historyButton.dataset.originalText = historyButton.textContent;
        historyButton.textContent = '';
    }
    historyButton.appendChild(loaderIcon);
    historyButton.classList.add('loading');
}

function hideLoader(historyButton) {
    const historyIcon = historyButton.querySelector('.icn_history_icon');
    if (historyIcon) {
        // Кнопка с иконкой в окне объекта на карте
        historyButton.removeChild(loaderIcon);
        historyIcon.style.display = '';
    } else {
        // Псевдоссылка с текстом в табличных отчетах
        historyButton.textContent = historyButton.dataset.originalText;
        delete historyButton.dataset.originalText;
    }
    historyButton.classList.remove('loading');
}

function showNoDataMessage($chartBox) {
    $chartBox.css({ height: '' }).addClass('no_data').html('Данные отсутствуют');
}

function initDatepicker($node) {
    var datepickerSettings = {
            format: 'Y-m-d',
            hide_on_select: true,
            first_day: 1,
            select_month: true,
            select_year: true,
            position: window.innerWidth > 825 ? 'right' : 'bottom',
            locale: {
                days:        ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'],
                daysShort:   ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                daysMin:     ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                months:      ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
                monthsShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
            },
            change: function(date) { /* В случае выбора диапазона дат передаётся массив */
                var filterItem = this;

                /* `pmu-mode` must be set to 'range' */

                var startDate = date[0],
                    endDate = date[1];

                /* При выборе диапазона сначала (после выбора первой даты) передается массив
                из 2-х одинаковых дат, затем собственно диапазон - первую дату запомним
                в data-start-date и подождем выбора 2-й */
                if (!filterItem.dataset.startDate) {
                    filterItem.dataset.startDate = startDate;
                    return;
                }

                filterItem.dataset.startDate = '';

                if (!startDate || !endDate) return;

                var newValue = { startDate: startDate, endDate: endDate };
                filterItem.dataset.value = JSON.stringify(newValue);

                this.dispatchEvent(new CustomEvent('periodPick', {
                    bubbles: false
                }));
            },
            // Toggling panel
            show: function() {
                this.pickmeup.css({ zIndex: 7300 }); // костыль от перекрытия datapicker-попапа окном графика

                if (+this.dataset.visible) {
                    this.dataset.visible = 0;
                    $(this).pickmeup('hide');
                    return false;
                } else {
                    this.dataset.visible = 1;
                    return true;
                }
            },
            hide: function() {
                this.dataset.visible = 0;
            }
        };

    $node.pickmeup(datepickerSettings);
}

function mergeChartOptions(targetOptions, sourceOptions) {
    const result = Object.assign({}, targetOptions);

    for (let key in sourceOptions) {
        const sourceValue = sourceOptions[key];
        const targetValue = targetOptions[key];
        if (isObject(sourceValue) && isObject(targetValue)) {
            result[key] = Object.assign({}, targetValue, sourceValue);
        } else {
            result[key] = sourceValue;
        }
    }

    return result;
}