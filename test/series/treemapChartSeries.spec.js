/**
 * @fileoverview test for TreemapChartSeries
 * @author NHN Ent.
 *         FE Development Lab <dl_javascript@nhnent.com>
 */

'use strict';

var TreemapChartSeries = require('../../src/js/series/treemapChartSeries.js');
var SeriesDataModel = require('../../src/js/dataModels/seriesDataModelForTreemap');
var chartConst = require('../../src/js/const');
var dom = require('../../src/js/helpers/domHandler');
var renderUtil = require('../../src/js/helpers/renderUtil');

describe('TreemapChartSeries', function() {
    var rootId = chartConst.TREEMAP_ROOT_ID;
    var series, boundsMaker, seriesDataModel;

    beforeAll(function() {
        boundsMaker = jasmine.createSpyObj('boundsMaker', ['getDimension']);
        spyOn(renderUtil, 'getRenderedLabelWidth').and.returnValue(50);
        spyOn(renderUtil, 'getRenderedLabelHeight').and.returnValue(30);
    });

    beforeEach(function() {
        series = new TreemapChartSeries({
            boundsMaker: boundsMaker,
            chartType: 'treemap',
            theme: {
                label: {
                    fontSize: 12,
                    fontFamily: 'Verdana'
                }
            }
        });
        seriesDataModel = new SeriesDataModel([], 'treemap');
        spyOn(series, '_getSeriesDataModel').and.returnValue(seriesDataModel);
    });

    describe('_makeBoundMap()', function() {
        it('make bound map by dimension', function() {
            var actual, expected;

            boundsMaker.getDimension.and.returnValue({
                width: 600,
                height: 400
            });
            seriesDataModel.rawSeriesData = [
                {
                    id: 'id_0',
                    parent: rootId,
                    value: 6,
                    depth: 1,
                    group: 0
                },
                {
                    id: 'id_1',
                    parent: rootId,
                    value: 6,
                    depth: 1,
                    group: 1
                },
                {
                    id: 'id_3',
                    parent: rootId,
                    value: 3,
                    depth: 1,
                    group: 2
                },
                {
                    id: 'id_4',
                    parent: rootId,
                    value: 3,
                    depth: 1,
                    group: 3
                }
            ];

            actual = series._makeBoundMap(rootId);
            expected = {
                'id_0': {left: 0, top: 0, width: 200, height: 400},
                'id_1': {left: 200, top: 0, width: 400, height: 200},
                'id_3': {left: 200, top: 200, width: 200, height: 200},
                'id_4': {left: 400, top: 200, width: 200, height: 200}
            };

            expect(actual).toEqual(expected);
        });
    });

    describe('_makeBounds()', function() {
        it('make bounds for rendering graph', function() {
            var boundMap, actual;

            boundsMaker.getDimension.and.returnValue({
                width: 600,
                height: 400
            });
            seriesDataModel.rawSeriesData = [
                {
                    id: 'id_0',
                    parent: rootId,
                    value: 6,
                    depth: 1,
                    group: 0
                },
                {
                    id: 'id_1',
                    parent: rootId,
                    value: 6,
                    depth: 1,
                    group: 1
                },
                {
                    id: 'id_3',
                    parent: rootId,
                    value: 3,
                    depth: 1,
                    group: 2
                },
                {
                    id: 'id_4',
                    parent: rootId,
                    value: 3,
                    depth: 1,
                    group: 3
                }
            ];
            boundMap = series._makeBoundMap(rootId);

            actual = series._makeBounds(boundMap);

            expect(actual.length).toBe(1);
            expect(actual[0].length).toBe(4);
            expect(actual[0][0]).toEqual({end: {left: 0, top: 0, width: 200, height: 400}});
            expect(actual[0][1]).toEqual({end: {left: 200, top: 0, width: 400, height: 200}});
            expect(actual[0][2]).toEqual({end: {left: 200, top: 200, width: 200, height: 200}});
            expect(actual[0][3]).toEqual({end: {left: 400, top: 200, width: 200, height: 200}});
        });
    });

    describe('_renderSeriesLabel()', function() {
        beforeEach(function() {
            boundsMaker.getDimension.and.returnValue({
                width: 600,
                height: 400
            });
            seriesDataModel.rawSeriesData = [
                {
                    label: 'label1',
                    children: [
                        {
                            label: 'label2',
                            value: 6
                        }, {
                            label: 'label3',
                            children: [
                                {
                                    label: 'label3-1',
                                    children: [
                                        {
                                            label: 'label3-1-1',
                                            value: 2
                                        },
                                        {
                                            label: 'label3-1-2',
                                            value: 1
                                        }
                                    ]
                                },
                                {
                                    label: 'label3-2',
                                    value: 3
                                }
                            ]
                        }
                    ]
                }
            ];
        });

        it('render series label, when labelLevel is top', function() {
            var labelContainer = dom.create('DIV');
            var expectedElement = dom.create('DIV');

            series.labelLevel = 'top';
            series._renderSeriesLabel(labelContainer);

            expectedElement.innerHTML = '<div class="tui-chart-series-label"' +
                ' style="left:275px;top:186px;font-family:Verdana;font-size:12px">label1</div>';

            expect(labelContainer.innerHTML).toBe(expectedElement.innerHTML);
        });

        it('render series label, when labelLevel is bottom', function() {
            var labelContainer = dom.create('DIV');
            var expectedElement = dom.create('DIV');

            series.labelLevel = 'bottom';
            series._renderSeriesLabel(labelContainer);

            expectedElement.innerHTML = '<div class="tui-chart-series-label"' +
                    ' style="left:125px;top:186px;font-family:Verdana;font-size:12px">label2</div>' +
                '<div class="tui-chart-series-label"' +
                    ' style="left:425px;top:286px;font-family:Verdana;font-size:12px">label3-2</div>' +
                '<div class="tui-chart-series-label"' +
                    ' style="left:375px;top:86px;font-family:Verdana;font-size:12px">label3-1-1</div>' +
                '<div class="tui-chart-series-label"' +
                    ' style="left:525px;top:86px;font-family:Verdana;font-size:12px">label3-1-2</div>';

            expect(labelContainer.innerHTML).toBe(expectedElement.innerHTML);
        });
    });
});