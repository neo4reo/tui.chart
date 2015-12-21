/**
 * @fileoverview Column chart series component.
 * @author NHN Ent.
 *         FE Development Team <dl_javascript@nhnent.com>
 */

'use strict';

var chartConst = require('../const'),
    renderUtil = require('../helpers/renderUtil');

var BarTypeSeriesBase = tui.util.defineClass(/** @lends BarTypeSeriesBase.prototype */ {
    /**
     * Make series data.
     * @param {{
     *      dimension: {width: number, height: number},
     *      position: {left: number, top: number}
     * }} bound series bound
     * @returns {object} add data
     */
    makeSeriesData: function(bound) {
        var groupBounds = this._makeBounds(bound.dimension);

        this.groupBounds = groupBounds;

        return {
            groupBounds: groupBounds,
            groupValues: this._getPercentValues()
        };
    },

    /**
     * Make bar gutter.
     * @param {number} groupSize bar group size
     * @param {number} itemCount group item count
     * @returns {number} bar gutter
     * @private
     */
    _makeBarGutter: function(groupSize, itemCount) {
        var baseSize = groupSize / (itemCount + 1) / 2,
            gutter;

        if (baseSize <= 2) {
            gutter = 0;
        } else if (baseSize <= 6) {
            gutter = 2;
        } else {
            gutter = 4;
        }
        return gutter;
    },

    /**
     * Make bar size.
     * @param {number} groupSize bar group size
     * @param {number} barGutter bar padding
     * @param {number} itemCount group item count
     * @returns {number} bar size (width or height)
     * @private
     */
    _makeBarSize: function(groupSize, barGutter, itemCount) {
        return (groupSize - (barGutter * (itemCount - 1))) / (itemCount + 1);
    },

    /**
     * Make option size.
     * @param {number} barSize bar size
     * @param {?number} optionBarWidth barWidth option
     * @returns {number} option size
     * @private
     */
    _makeOptionSize: function(barSize, optionBarWidth) {
        var optionsSize = 0;
        if (optionBarWidth) {
            optionsSize = tui.util.min([barSize, optionBarWidth]);
        }
        return optionsSize;
    },

    /**
     * Make addition padding.
     * @param {number} barSize bar size
     * @param {number} optionSize option size
     * @param {number} itemCount item count
     * @returns {number} addition padding
     * @private
     */
    _makeAdditionPadding: function(barSize, optionSize, itemCount) {
        var padding = 0;

        if (optionSize && optionSize < barSize) {
            padding = (barSize - optionSize) * itemCount / 2;
        }

        return (barSize / 2) + padding;
    },

    /**
     * Make base info for normal chart bounds.
     * @param {{width: number, height: number}} dimension series dimension
     * @param {string} sizeType size type (width or height)
     * @param {string} anotherSizeType another size type (width or height)
     * @returns {{
     *      dimension: {width: number, height: number},
     *      groupValues: array.<array.<number>>,
     *      groupSize: number, barSize: number, step: number,
     *      distanceToMin: number, isMinus: boolean
     * }} base info
     */
    makeBaseInfoForNormalChartBounds: function(dimension, sizeType, anotherSizeType) {
        var groupValues = this._getPercentValues(),
            groupSize = dimension[anotherSizeType] / groupValues.length,
            itemCount = groupValues[0] && groupValues[0].length || 0,
            barGutter = this._makeBarGutter(groupSize, itemCount),
            barSize = this._makeBarSize(groupSize, barGutter, itemCount),
            optionSize = this._makeOptionSize(barSize, this.options.barWidth),
            additionPadding = this._makeAdditionPadding(barSize, optionSize, itemCount),
            limitDistance = this.getLimitDistanceFromZeroPoint(dimension[sizeType], this.data.limit);

        barSize = optionSize || barSize;

        return {
            dimension: dimension,
            groupValues: groupValues,
            groupSize: groupSize,
            barSize: barSize,
            additionPadding: additionPadding,
            step: barSize + barGutter,
            distanceToMin: limitDistance.toMin,
            isMinus: this.data.limit.min < 0 && this.data.limit.max <= 0
        };
    },

    /**
     * Render normal series label.
     * @param {object} params parameters
     *      @param {HTMLElement} params.container container
     *      @param {array.<array>} params.groupBounds group bounds
     * @param {HTMLElement} elSeriesLabelArea series label area element
     * @private
     */
    _renderNormalSeriesLabel: function(params, elSeriesLabelArea) {
        var groupBounds = params.groupBounds,
            firstFormattedValue = this.dataProcessor.getFirstFormattedValue(this.chartType),
            labelHeight = renderUtil.getRenderedLabelHeight(firstFormattedValue, this.theme.label),
            html;

        html = tui.util.map(this.dataProcessor.getGroupValues(this.chartType), function(values, groupIndex) {
            return tui.util.map(values, function(value, index) {
                var bound, formattedValue, renderingPosition;
                bound = groupBounds[groupIndex][index].end;
                formattedValue = this.dataProcessor.getFormattedValue(groupIndex, index, this.chartType);
                renderingPosition = this.makeSeriesRenderingPosition({
                    value: value,
                    bound: bound,
                    formattedValue: formattedValue,
                    labelHeight: labelHeight
                });
                return this.makeSeriesLabelHtml(renderingPosition, formattedValue, groupIndex, index);
            }, this).join('');
        }, this).join('');

        elSeriesLabelArea.innerHTML = html;
    },

    /**
     * Make sum values.
     * @returns {number} sum result.
     */
    makeSumValues: function(values) {
        var formatFunctions = this.dataProcessor.getFormatFunctions(),
            sum = tui.util.sum(tui.util.filter(values, function(value) {
                return value > 0;
            })),
            fns = [sum].concat(formatFunctions || []);

        return tui.util.reduce(fns, function(stored, fn) {
            return fn(stored);
        });
    },

    /**
     * Make stacked labels html.
     * @param {object} params parameters
     *      @param {number} params.groupIndex group index
     *      @param {array.<object>} params.bounds bounds,
     *      @param {number} params.labelHeight label height
     * @returns {string} labels html
     * @private
     */
    _makeStackedLabelsHtml: function(params) {
        var values = params.values,
            bound, htmls;

        htmls = tui.util.map(values, function(value, index) {
            var labelWidth, left, top, labelHtml, formattedValue;

            if (value < 0) {
                return '';
            }

            bound = params.bounds[index].end;
            formattedValue = this.dataProcessor.getFormattedValue(params.groupIndex, index, this.chartType);
            labelWidth = renderUtil.getRenderedLabelWidth(formattedValue, this.theme.label);
            left = bound.left + ((bound.width - labelWidth + chartConst.TEXT_PADDING) / 2);
            top = bound.top + ((bound.height - params.labelHeight + chartConst.TEXT_PADDING) / 2);
            labelHtml = this.makeSeriesLabelHtml({
                left: left,
                top: top
            }, formattedValue, params.groupIndex, index);
            return labelHtml;
        }, this);

        if (this.options.stacked === 'normal' && bound) {
            htmls.push(this.makeSumLabelHtml({
                values: values,
                bound: bound,
                labelHeight: params.labelHeight
            }));
        }
        return htmls.join('');
    },

    /**
     * Render stacked series label.
     * @param {object} params parameters
     *      @param {array.<array>} params.groupBounds group bounds
     * @param {HTMLElement} elSeriesLabelArea series label area element
     * @private
     */
    _renderStackedSeriesLabel: function(params, elSeriesLabelArea) {
        var groupBounds = params.groupBounds,
            groupValues = this.dataProcessor.getGroupValues(this.chartType),
            firstFormattedValue = this.dataProcessor.getFirstFormattedValue(this.chartType),
            labelHeight = renderUtil.getRenderedLabelHeight(firstFormattedValue, this.theme.label),
            html;

        html = tui.util.map(groupValues, function(values, index) {
            var labelsHtml = this._makeStackedLabelsHtml({
                groupIndex: index,
                values: values,
                bounds: groupBounds[index],
                labelHeight: labelHeight
            });
            return labelsHtml;
        }, this).join('');

        elSeriesLabelArea.innerHTML = html;
    },

    /**
     * Render series label.
     * @param {object} params parameters
     *      @param {array.<array>} params.groupBounds group bounds
     *      @param {array.<array>} params.formattedValues formatted values
     * @param {HTMLElement} elSeriesLabelArea series label area element
     * @private
     */
    _renderSeriesLabel: function(params, elSeriesLabelArea) {
        if (!this.options.showLabel) {
            return;
        }

        if (this.options.stacked) {
            this._renderStackedSeriesLabel(params, elSeriesLabelArea);
        } else {
            this._renderNormalSeriesLabel(params, elSeriesLabelArea);
        }
    }
});

BarTypeSeriesBase.mixin = function(func) {
    tui.util.extend(func.prototype, BarTypeSeriesBase.prototype);
};

module.exports = BarTypeSeriesBase;