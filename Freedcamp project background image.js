// ==UserScript==
// @name         Freedcamp project background image
// @namespace    http://freedcamp.com/
// @version      0.1
// @description  set project background image
// @author       devops@freedcamp.com
// @match        *://freedcamp.com/*
// @match        *://*.freedcamp.com/*
// @require      https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
    "use strict";

    function testImage(url) {
        return new Promise(function (resolve, reject) {
            const timeout = 5000;
            let timer,
                img = new Image();
            img.onerror = img.onabort = function () {
                clearTimeout(timer);
                viewUrlError();
                reject(false);
            };
            img.onload = function () {
                clearTimeout(timer);
                resolve(true);
            };
            timer = setTimeout(function () {
                // reset .src to invalid URL so it stops previous
                // loading, but doens't trigger new load
                img.src = "//!!!!/noexist.jpg";
                viewUrlError();
                reject(false);
            }, timeout);
            img.src = url;
        });
    }

    function viewUrlError() {
        alert(
            "Freedcamp project background image error:\nIncorrect background url! Please change it."
        );
    }

    let lastUrls = {};
    let lastSwitchers = {};

    const imageSelectConfig = new MonkeyConfig({
        title: "Select image url",
        menuCommand: true,
        params: {
            background_url: {
                type: "custom",
                html: "<input type='text' placeholder='url' style='width: 20em;' />",
                set: function (value, parent) {
                    if (Object.keys(value).length === 0) {
                        parent.querySelectorAll("input")[0].value = "";
                    } else {
                        lastUrls = value;

                        if (value[project_unique_name]) {
                            parent.querySelectorAll("input")[0].value =
                                value[project_unique_name];
                        }
                    }
                },
                get: function (parent) {
                    let input = parent.querySelectorAll("input")[0].value;

                    if (input) {
                        lastUrls[project_unique_name] = input;
                    } else {
                        delete lastUrls[project_unique_name];
                    }

                    return lastUrls;
                },
                default: {}
            },
            invert_font_color: {
                type: "custom",
                html: "<input type='checkbox' id='invert_font'/>",
                set: function (value, parent) {
                    if (Object.keys(value).length !== 0) {
                        lastSwitchers = value;

                        if (value[project_unique_name]) {
                            parent.querySelectorAll("input")[0].checked =
                                value[project_unique_name];
                        }
                    }
                },
                get: function (parent) {
                    let isChecked = parent.querySelectorAll("input")[0].checked;

                    if (isChecked) {
                        lastSwitchers[project_unique_name] = isChecked;
                    } else {
                        delete lastSwitchers[project_unique_name];
                    }

                    return lastSwitchers;
                },
                default: {}
            }
        },
        onSave: function (values) {
            location.reload();
        }
    });

    const currentBackground = imageSelectConfig.get("background_url")[
        project_unique_name
    ];

    if (currentBackground) {
        testImage(currentBackground).then(success => {
            if (success) {
                let isRGBLight = imageSelectConfig.get("invert_font_color")[
                    project_unique_name
                ];

                let fontColor = isRGBLight ? "black" : "white";

                try {
                    document.querySelector(
                        "#improved_filters .sort"
                    ).style.color = fontColor;
                    document.querySelector(
                        "#improved_filters .filter_label"
                    ).style.color = fontColor;
                } catch (e) {
                }

                document.body.style.background = `url(${currentBackground})`;
            }
        });
    }
})();
