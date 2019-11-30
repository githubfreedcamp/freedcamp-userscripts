// ==UserScript==
// @name         Freedcamp project colors
// @namespace    http://freedcamp.com/
// @version      0.3
// @description  enable project cards background color
// @author       devops@freedcamp.com
// @match        https://freedcamp.com/*
// @require      https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand

// ==/UserScript==

(function() {
    'use strict';

    const HEX_REGEX = /^(\s+)?((#(0x){0,1}|#{0,1})([0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}))(\s+)?$/;

    var modeSelect = new MonkeyConfig({
        title: 'Select mode',
        menuCommand: true,
        params: {
            highlight: {
                type: 'select',
                choices: [ 'Favorite projects with a project color', 'Favorite projects by a set color',
                          'All projects with a project color', 'Projects matching the text in a project name' ],
                'default': 'Favorite projects with a project color',
                variant: 'radio column'
            }
        },
        onSave: function (values) {
            location.reload();
        }
    });

    const MODE = modeSelect.get('highlight');


    var colorOpacity = new MonkeyConfig({
        title: 'Color opacity',
        menuCommand: true,
        params: {
            opacity: {
                type: 'custom',
                html: '<input type="range" min="30" max="100" value="100" class="slider"',
                set: function (value, parent) {
                    parent.querySelectorAll('input')[0].value = value;
                },
                get: function (parent) {
                    return parent.querySelectorAll('input')[0].value;
                },
                default: '50'
            }
        },
        onSave: function (values) {
            location.reload();
        }
    });

    const OPACITY = colorOpacity.get('opacity') / 100;

    switch(MODE) {
        case('Favorite projects by a set color') : {
            var secondMode = new MonkeyConfig({
                title: 'Set color',
                menuCommand: true,
                params: {
                    custom_color: {
                        type: 'custom',
                        html: '<input type="color" style="width: 5em;"/>',
                        set: function (value, parent) {
                            parent.querySelectorAll('input')[0].value = value;
                        },
                        get: function (parent) {
                            let value = parent.querySelectorAll('input')[0].value;
                            if (!value.match(HEX_REGEX)) {
                                alert('Wrong HEX color! Restored default.');
                                return '#00FF00';
                            } else {
                                return value.replace(HEX_REGEX, "$2")
                            }
                        },
                        default: '#00ff00'
                    }
                },
                onSave: function (values) {
                    location.reload();
                }
            });
            break;
        }
        case('Projects matching the text in a project name') : {
            function generateFields(count) {
                let html = '<input type="text" placeholder="keyword" style="width: 10em;" />  ' +
                    '<input type="color" placeholder="HEX color" style="width: 5em;" /></br>';

                for (let i = 0; i < count - 1; i++) {
                    html += '<input type="text" style="width: 10em;" />  ' +
                        '<input type="color" style="width: 5em;" /></br>'
                }
                return html;
            }

            var thirdMode = new MonkeyConfig({
                title: 'Set keywords',
                menuCommand: true,
                params: {
                    keywords: {
                        type: 'custom',
                        html: generateFields(10),
                        set: function (value, parent) {
                            let i = 0;

                            for (let key in value) {
                                parent.querySelectorAll('input')[i].value = key;
                                parent.querySelectorAll('input')[i + 1].value = value[key];

                                i += 2;
                            }
                            for ( ; i < parent.querySelectorAll('input').length; i++) {
                                parent.querySelectorAll('input')[i].value = "";
                            }
                        },
                        get: function (parent) {
                            let result = {};

                            let inputs = parent.querySelectorAll('input');

                            for (let i = 0; i < inputs.length; i += 2 ) {
                                const key = inputs[i].value;
                                const val = inputs[i + 1].value.toLowerCase();

                                if (key.length > 3 && val.match(HEX_REGEX)) {
                                    result[key] = val.replace(HEX_REGEX, "$2");
                                }
                            }

                            return result;
                        },
                        default: {"keyword1" : "#00ff00"}
                    }
                },
                onSave: function (values) {
                    location.reload();
                }
            });
            break;
        }
    }

    // on dashboard page
    if (window.location.href === 'https://freedcamp.com/dashboard') {
        let projects = document.querySelectorAll('.project');

        for (let i = 0; i < projects.length; i++) {
            const pBlock = projects[i];

            if (MODE === 'All projects with a project color'
                || MODE ==='Projects matching the text in a project name') {
                switchBlockColor(pBlock);
            } else {
                if (pBlock.querySelectorAll('.favorited')[0]) {
                    switchBlockColor(pBlock);
                }

                pBlock.querySelectorAll('.favorite_project_action')[0].onclick = function() {
                    switchBlockColor(pBlock);
                };
            }
        }
    }

    // sidebar
    let switcherNotOpened = true;
    document.querySelectorAll('.fc_project_switcher')[0].onclick = function() {
        if (switcherNotOpened) {
            let color;
            let sideProjects = document.querySelectorAll('.fc_project_item');

            for (let z = 0; z < sideProjects.length; z++) {
                let sideProject = sideProjects[z];

                if (MODE === 'All projects with a project color') {
                    color = sideProject.querySelectorAll('.color')[0].style.backgroundColor;
                } else if (MODE === 'Projects matching the text in a project name') {
                    let keywords = thirdMode.get('keywords');
                    let name = sideProject.querySelectorAll('.name')[0].textContent.toLowerCase();

                    for (let key in keywords) {
                        let value = keywords[key];

                        if (name.indexOf(key.toLowerCase()) != -1) {
                            color = hexToRgb(value);
                            break;
                        }
                    }
                }

                if (color) {
                    let colorIsLight = isLight(color);

                    let name = sideProject.querySelectorAll('.name')[0];
                    let desc = sideProject.querySelectorAll('.fc_description')[0];

                    let fcApps = document.querySelectorAll('.fc_app');

                    inverseColor(name, colorIsLight);

                    if (desc) {
                        inverseColor(desc, colorIsLight);
                    }

                    // make buttons dark
                    for (let x = 0; x < fcApps.length; x++) {
                        let btns = fcApps[x].querySelectorAll('.btn');

                        for (let y = 0; y < btns.length; y++) {
                            btns[y].style.color = 'black';
                        }
                    }

                    sideProject.style.backgroundColor = `${color.substring(0, color.length - 1)}, ${OPACITY})`;

                    sideProject.style.borderColor = color;
                }

                color = null;
            }

            switcherNotOpened = false;
        }
    };

    function switchBlockColor(pBlock) {
        let color, colorIsLight, opColor;

        if (MODE === 'Favorite projects with a project color'
            || MODE === 'All projects with a project color') {
            color = pBlock.querySelectorAll('.card_color')[0].style.backgroundColor;
        } else if (MODE === 'Favorite projects by a set color') {
            color = hexToRgb(secondMode.get('custom_color'));
        } else {
            let keywords = thirdMode.get('keywords');
            let name = pBlock.querySelectorAll('.project_name')[0].textContent.toLowerCase();

            for (let key in keywords) {
                let value = keywords[key];
                if (name.indexOf(key.toLowerCase()) != -1) {
                    color = hexToRgb(value);
                }
            }
        }

        if (color) {
            colorIsLight = isLight(color);
            opColor = `${color.substring(0, color.length - 1)}, ${OPACITY})`;

            let desc = pBlock.querySelectorAll('.project_desc')[0];
            let noDesc = pBlock.querySelectorAll('.no_description')[0];

            let name = pBlock.querySelectorAll('.project_name')[0];

            if (pBlock.style.background) {
                pBlock.style.background = '';
            } else {
                pBlock.style.background = opColor;
            }

            inverseColor(name, colorIsLight);

            if (noDesc) {
                inverseColor(noDesc, colorIsLight);
            } else {
                inverseColor(desc, colorIsLight);
            }
        }
    }

    function isLight(color) {
        let r, g, b, hsp;

        color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);

        r = color[1];
        g = color[2];
        b = color[3];

        hsp = Math.sqrt(
            0.299 * (r * r) +
            0.587 * (g * g) +
            0.114 * (b * b)
        );

        return hsp > 127.5;
    }

    function inverseColor(element, light) {
        if (element.style.color) {
            element.style.color = '';
        } else {
            element.style.color = light ? 'black' : 'white';
        }
    }

    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : null;
    }
})();
