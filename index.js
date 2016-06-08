document.addEventListener("DOMContentLoaded", function() {
    var allowHiddenResults = false;
    var canvas = document.querySelector("canvas");
    var examples;
    var currentExample = null;

    function changeView(text) {
        var phi = 5 / 12 * Math.PI;
        var theta = Math.PI / 6;
        if (text === 'Default')
            canvas.complexCurves.rotateLatLong(phi, theta);
        else
            canvas.complexCurves['rotate' + text]();
    };

    function customExample(equation) {
        return {
            "id": "Custom",
            "cached": false,
            "title": equation,
            "equation": equation,
            "description": "Custom equation"
        };
    }

    function updateHash() {
        if (currentExample === null) {
            window.location.hash = '';
            return;
        }
        var id = encodeURIComponent(currentExample.id);
        var options = [];
        if (id === 'Custom')
            options.push('equation=' +
                encodeURIComponent(currentExample.equation));
        if (!currentExample.cached && id !== 'Custom')
            options.push('cached=0');
        var view = $('#viewDropdown').dropdown('get value')[0];
        if (view !== 'Default')
            options.push('view=' + view);
        if ($('#autorotateCheckbox').checkbox('is checked'))
            options.push('autorotate=1');
        if ($('#clippingCheckbox').checkbox('is checked'))
            options.push('clip=1');
        if ($('#orthoCheckbox').checkbox('is checked'))
            options.push('ortho=1');
        if ($('#transparencyCheckbox').checkbox('is checked'))
            options.push('transparency=1');
        var hash = id + (options.length === 0 ? '' : '?' + options.join('&'));
        window.location.hash = hash;
    }

    function selectExample(example) {
        if (canvas.complexCurves)
            canvas.complexCurves.unregisterEventHandlers();
        var piOver180 = Math.PI / 180;
        var lat = 75 * piOver180;
        var lon = 30 * piOver180;
        if (example.cached) {
            canvas.complexCurves =
                ComplexCurves.fromFile(canvas,
                    'http://complexcurves.org/models/' + example.id + '.bin',
                    example.equation, lat, lon);
        } else {
            canvas.complexCurves = ComplexCurves.fromEquation(canvas,
                example.equation ||
                $('.ui.search').search('get value'),
                example.depth || 12, lat, lon);
        }
        allowHiddenResults = true;
        $('.ui.search').search('hide results');
        $('#viewDropdown').dropdown('set selected', 'Default');
        $('#autorotateCheckbox').checkbox('uncheck');
        $('#clippingCheckbox').checkbox('uncheck');
        $('#orthoCheckbox').checkbox('uncheck');
        $('#transparencyCheckbox').checkbox('uncheck');
        $('#ComplexCurves').show();
        currentExample = example ||
            customExample($('.ui.search').search('get value'));
        $('.ui.search').search('set value', currentExample.id === 'Custom' ?
            currentExample.equation : currentExample.id);
        makeSearchClearable();
        updateHash();
    }

    function updateState() {
        var splitHash = window.location.hash.split('?');
        var id = splitHash[0].slice(1);
        var options = {};
        (splitHash[1] || '').split('&').forEach(function(option) {
            var split = option.split('=');
            options[split[0]] = split[1];
        });
        if (id === 'Custom') {
            var equation = decodeURIComponent(options.equation);
            if (options.equation && currentExample.equation !== equation)
                selectExample(customExample(equation));
        } else if (currentExample === null || currentExample.id !== id) {
            var example = examples.filter(function(ex) {
                return ex.id === id;
            })[0];
            if (example) {
                example.cached = options.cached !== '0';
                selectExample(example);
            }
        }
        var view = options.view || 'Default';
        if (view !== $('#viewDropdown').dropdown('get value')[0])
            $('#viewDropdown').dropdown('set value', view);
        var clip = !(options.clip !== '1');
        if (clip !== $('#clippingCheckbox').checkbox('is checked'))
            $('#clippingCheckbox').checkbox('toggle');
        var ortho = !(options.ortho !== '1');
        if (ortho !== $('#orthoCheckbox').checkbox('is checked'))
            $('#orthoCheckbox').checkbox('toggle');
        var transparency = !(options.transparency !== '1');
        if (transparency !== $('#transparencyCheckbox').checkbox('is checked'))
            $('#transparencyCheckbox').checkbox('toggle');
        var autorotate = !(options.autorotate !== '1');
        if (autorotate !== $('#autorotateCheckbox').checkbox('is checked'))
            $('#autorotateCheckbox').checkbox('toggle');
    }

    window.addEventListener('hashchange', updateState);

    function makeSearchClearable() {
        var icon = $('.ui.search i');
        icon.attr('class', 'remove link icon');
        icon.on('click', function() {
            document.querySelector('.prompt').value = '';
            icon.attr('class', 'search icon').on('click', null);
            $('.ui.search .prompt').focus();
        });
    }
    $('#viewDropdown').dropdown().on('change', function(evt) {
        var view = evt.target.value;
        changeView(view);
        updateHash();
    });

    function registerToggleAction(id, action) {
        $(id).checkbox({
            onChange: function() {
                canvas.complexCurves[action]($(this).context.checked);
                updateHash();
                return true;
            }
        });
    }

    function registerExportButton(id, action) {
        $(id).on('click', function() {
            canvas.complexCurves[action]();
        });
    }
    registerToggleAction('#autorotateCheckbox', 'setAutorotate');
    registerToggleAction('#clippingCheckbox', 'setClipping');
    registerToggleAction('#orthoCheckbox', 'setOrtho');
    registerToggleAction('#transparencyCheckbox', 'setTransparency');
    registerExportButton('#surfaceButton', 'exportSurface');
    registerExportButton('#screenshotButton', 'exportScreenshot');
    registerExportButton('#domainColouringButton', 'exportDomainColouring');

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
                currentExample = null;
                updateHash();
                $('#ComplexCurves').hide();
                allowHiddenResults = false;
            },
            onResultsClose: function() {
                if (!allowHiddenResults)
                    $('.ui.search').search('show results');
            },
            onSelect: selectExample,
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
                            "results": [customExample(value)]
                        });
                        $('.ui.search').search('add results', html);
                        return;
                    }
                    if (message !== undefined && type !== undefined) {
                        html += '' + '<div class="message ' + type + '">';
                        // message type
                        if (type == 'empty') {
                            html += '' +
                                '<div class="header">' + 'No Results' +
                                '</div>' + '<div class="description">' +
                                message + '</div>';
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
                                    ' <img src="' + result[fields.image] +
                                    '">' + '</div>';
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
                                response[fields.action][fields.actionText] +
                                '</a>';
                        }
                        return html;
                    }
                    return false;
                }
            }
        });
        $('.ui.search').search('search local', '');
        $('.ui.search').search('show results');

        updateState();
    };
    req.send();
});
