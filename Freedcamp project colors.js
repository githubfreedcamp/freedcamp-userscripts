// ==UserScript==
// @name         Freedcamp project colors
// @namespace    http://freedcamp.com/
// @version      0.1
// @description  enable project cards background color
// @author       s010vey
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
            mode: {
                type: 'select',
                choices: [ 'Highlight favorite projects by their color', 'Highlight favorite projects by custom color', 'Use text in a project name to highlight project cards' ],
                'default': 'Highlight favorite projects by their color',
                variant: 'radio column'
            }
        },
        onSave: function (values) {
            location.reload();
        }
    });

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

    if (modeSelect.get('mode') === 'Highlight favorite projects by custom color') {
        var secondMode = new MonkeyConfig({
            title: 'Config',
            menuCommand: true,
            params: {
                custom_color: {
                    type: 'custom',
                    html: '<input type="color" style="width: 10em;"/>',
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
    } else if (modeSelect.get('mode') === 'Use text in a project name to highlight project cards') {
        var thirdMode = new MonkeyConfig({
            title: 'Config',
            menuCommand: true,
            params: {
                keywords: {
                    type: 'custom',
                    html: '<input type="text" placeholder="keyword" style="width: 10em;" />  ' +
                    '<input type="color" placeholder="HEX color" style="width: 10em;" /></br>' +
                    '<input type="text" style="width: 10em;" />  ' +
                    '<input type="color" style="width: 10em;" /></br>' +
                    '<input type="text" style="width: 10em;" />  ' +
                    '<input type="color" style="width: 10em;" /></br>' +
                    '<input type="text" style="width: 10em;" />  ' +
                    '<input type="color" style="width: 10em;" /></br>' +
                    '<input type="text" style="width: 10em;" />  ' +
                    '<input type="color" style="width: 10em;" /></br>' +
                    '<input type="text" style="width: 10em;" />  ' +
                    '<input type="color" style="width: 10em;" /></br>' +
                    '<input type="text" style="width: 10em;" />  ' +
                    '<input type="color" style="width: 10em;" /></br>' +
                    '<input type="text" style="width: 10em;" />  ' +
                    '<input type="color" style="width: 10em;" /></br>' +
                    '<input type="text" style="width: 10em;" />  ' +
                    '<input type="color" style="width: 10em;" /></br>' +
                    '<input type="text" style="width: 10em;" />  ' +
                    '<input type="color" style="width: 10em;" />',
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
                    default: {"test" : "#00ff00"}
                }
            },
            onSave: function (values) {
                location.reload();
            }
        });
    }

    const MODE = modeSelect.get('mode');

    const OPACITY = colorOpacity.get('opacity') / 100;

    // on dashboard page
    if (window.location.href === 'https://freedcamp.com/dashboard') {
        let projects = document.querySelectorAll('.project');

        for (let i = 0; i < projects.length; i++) {
            const pBlock = projects[i];

            if (pBlock.querySelectorAll('.favorited')[0]) {
                switchFavorited(pBlock);
            }

            pBlock.querySelectorAll('.favorite_project_action')[0].onclick = function() {
                switchFavorited(pBlock);
            };
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

                if (MODE === 'Highlight favorite projects by their color') {
                    color = sideProject.querySelectorAll('.color')[0].style.backgroundColor;
                } else if (MODE === 'Use text in a project name to highlight project cards') {
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

                    switchColor(name, colorIsLight);

                    if (desc) {
                        switchColor(desc, colorIsLight);
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

    function switchFavorited(pBlock) {
        let color, colorIsLight, opColor;

        if (MODE === 'Highlight favorite projects by their color') {
            color = pBlock.querySelectorAll('.card_color')[0].style.backgroundColor;
        } else if (MODE === 'Highlight favorite projects by custom color') {
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
            const cogImage = pBlock.querySelectorAll('.cog_image')[0];

            let desc = pBlock.querySelectorAll('.project_desc')[0];
            let noDesc = pBlock.querySelectorAll('.no_description')[0];

            let name = pBlock.querySelectorAll('.project_name')[0];

            if (pBlock.style.background) {
                pBlock.style.background = '';
            } else {
                pBlock.style.background = opColor;
            }

            if (cogImage.style.color) {
                cogImage.style.color = '';
            } else {
                cogImage.style.color = 'black';
            }

            switchColor(name, colorIsLight);

            if (noDesc) {
                switchColor(noDesc, colorIsLight);
            } else {
                switchColor(desc, colorIsLight);
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

    function switchColor(element, light) {
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