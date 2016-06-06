document.addEventListener("DOMContentLoaded", function() {
    var allowHiddenResults = false;
    var canvas = document.querySelector("canvas");
    var examples;
    function makeSearchClearable () {
        var icon = $('.ui.search i');
        icon.attr('class', 'remove link icon');
        icon.on('click', function () {
            document.querySelector('.prompt').value = '';
            icon.attr('class', 'search icon').on('click', null);
            $('.ui.search .prompt').focus();
        });
    }
    var req = new XMLHttpRequest();
    req.open("GET", "examples.json");
    req.responseType = "json";
    req.onload = function() {
        examples = req.response;
        $('.ui.search').search({
            duration: 0,
            transition: false,
            maxResults: 50,
            minCharacters: 0,
            searchFields: ['title'],
            searchFullText: true,
            source: examples,
            onResultsOpen: function() {
                $('#ComplexCurves').hide();
                allowHiddenResults = false;
            },
            onResultsClose: function() {
                if (!allowHiddenResults)
                    $('.ui.search').search('show results');
            },
            onSelect: function(example) {
                if (canvas.complexCurves)
                    canvas.complexCurves.unregisterEventHandlers();
                var piOver180 = Math.PI / 180;
                var lat = 75 * piOver180;
                var lon = 30 * piOver180;
                if (example.cached) {
                    canvas.complexCurves =
                        ComplexCurves.fromFile(canvas,
                            'http://complexcurves.org/models/' + example.id +
                            '.bin', example.equation, lat, lon);
                } else {
                    canvas.complexCurves = ComplexCurves.fromEquation(canvas,
                        example.equation ||
                        $('.ui.search').search('get value'),
                        example.depth || 12, lat, lon);
                }
                $('#ComplexCurves').show();
                allowHiddenResults = true;
                makeSearchClearable();
            },
            onSearchQuery: function(query) {
                var icon = $('.ui.search i');
                if (query === '') {
                    icon.attr('class', 'search icon');
                } else
                    makeSearchClearable();
            },
            templates: {
                message: function(message, type) {
                    var
                        html = '';
                    var value = $('.ui.search').search('get value');
                    if (PolynomialParser.parse(value)) {
                        html = $('.ui.search').search('generate results', {
                            "results": [{
                                "id": "Custom",
                                "cached": false,
                                "title": value,
                                "equation": value,
                                "description": "Custom equation"
                            }]
                        });
                        $('.ui.search').search('add results', html);
                        return;
                    }
                    if (message !== undefined && type !== undefined) {
                        html += '' + '<div class="message ' + type + '">';
                        // message type
                        if (type == 'empty') {
                            html += '' +
                            '<div class="header">' + 'No Results' + '</div>' +
                            '<div class="description">' + message + '</div>';
                        } else {
                            html += ' <div class="description">' + message +
                            '</div>';
                        }
                        html += '</div>';
                    }
                    return html;
                },
                standard: function(response, fields) {
                    var
                        html = '';
                    if (response[fields.results] !== undefined) {

                        // each result
                        $.each(response[fields.results], function(index, result) {
                            if (result[fields.url]) {
                                html += '<a class="ui card result" href="' +
                                result[fields.url] + '">';
                            } else {
                                html += '<a class="ui card result">';
                            }
                            if (result[fields.image] !== undefined) {
                                html += '' + '<div class="ui medium image">' +
                                ' <img src="' + result[fields.image] + '">' +
                                '</div>';
                            }
                            html += '<div class="content">';
                            if (result[fields.price] !== undefined) {
                                html += '<div class="price">' +
                                result[fields.price] + '</div>';
                            }
                            if (result[fields.title] !== undefined) {
                                html += '<div class="title">' +
                                result[fields.title] + '</div>';
                            }
                            if (result[fields.description] !== undefined) {
                                html += '<div class="description">' +
                                result[fields.description] + '</div>';
                            }
                            html += '' + '</div>';
                            html += '</a>';
                        });

                        if (response[fields.action]) {
                            html += '' + '<a href="' +
                            response[fields.action][fields.actionURL] +
                            '" class="action">' +
                            response[fields.action][fields.actionText] + '</a>';
                        }
                        return html;
                    }
                    return false;
                }
            }
        });
        $('.ui.search').search('search local', '');
        $('.ui.search').search('show results');
    };
    req.send();
    $('.ui.dropdown').dropdown().on('change', function (evt) {
        var text = evt.target.value;
        var phi = 5 / 12 * Math.PI;
        var theta = Math.PI / 6;
        switch (text) {
            case 'Default':
                canvas.complexCurves.rotateLatLong(phi, theta);
                break;
            case 'Front':
                canvas.complexCurves.rotateFront();
                break;
            case 'Back':
                canvas.complexCurves.rotateBack();
                break;
            case 'Left':
                canvas.complexCurves.rotateLeft();
                break;
            case 'Right':
                canvas.complexCurves.rotateRight();
                break;
            case 'Top':
                canvas.complexCurves.rotateTop();
                break;
            case 'Bottom':
                canvas.complexCurves.rotateBottom();
                break;
        }
    });
    $('#autorotateCheckbox').checkbox({
        onChange: function() {
            canvas.complexCurves.setAutorotate($(this).context.checked);
        }
    });
    $('#clippingCheckbox').checkbox({
        onChange: function() {
            canvas.complexCurves.setClipping($(this).context.checked);
        }
    });
    $('#orthoCheckbox').checkbox({
        onChange: function() {
            canvas.complexCurves.setOrtho($(this).context.checked);
        }
    });
    $('#transparencyCheckbox').checkbox({
        onChange: function() {
            canvas.complexCurves.setTransparency($(this).context.checked);
        }
    });
    $('#surfaceButton').on('click', function () {
        canvas.complexCurves.exportSurface();
    });
    $('#screenshotButton').on('click', function () {
        canvas.complexCurves.exportScreenshot();
    });
    $('#domainColouringButton').on('click', function () {
        canvas.complexCurves.exportDomainColouring();
    });
});
