// ==UserScript==
// @name         Freedcamp project background image
// @namespace    http://freedcamp.com/
// @version      0.3
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

    function testImage(url, projectName) {
        return new Promise(function (resolve, reject) {
            const timeout = 5000;
            let timer,
                img = new Image();
            img.onerror = img.onabort = function () {
                clearTimeout(timer);
                viewUrlError(projectName);
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
                viewUrlError(projectName);
                reject(false);
            }, timeout);
            img.src = url;
        });
    }

    function viewUrlError(project) {
        const projectName = project ? project : "";

        alert(
            `Project ${projectName} background image error:\nIncorrect background url! Please change it.`
        );
    }

    let lastUrls = {};
    let lastSwitchers = {};

    function deleteHtmlElement(element) {
        const grandParent = element.parentNode;
        grandParent.parentNode.removeChild(grandParent);
    }

    function inverseColor(element, light) {
        if (element.style.color) {
            element.removeAttribute("style");
        } else {
            element.style.color = light ? "black" : "white";
        }
    }

    const imageSelectConfig = new MonkeyConfig({
        title: "Config",
        menuCommand: true,
        params: {
            background_url: {
                type: "custom",
                html: project_unique_name
                    ? "<input type='text' placeholder='url' style='width: 20em;' />"
                    : "",
                set: function (value, parent) {
                    lastUrls = Object.keys(value).length !== 0 ? value : lastUrls;

                    if (project_unique_name) {
                        if (Object.keys(value).length === 0) {
                            parent.querySelector("input").value = "";
                        } else {
                            if (value[project_unique_name]) {
                                parent.querySelector("input").value =
                                    value[project_unique_name];
                            }
                        }
                    } else {
                        const grandParent = parent.parentNode;
                        const grandGrandParent = grandParent.parentNode;
                        grandParent.parentNode.removeChild(grandParent);
                        grandGrandParent.insertAdjacentHTML(
                            "afterbegin",
                            "<div style=" +
                            "'" +
                            "font-size:14px; color:red;" +
                            "text-align:center;" +
                            "margin-top:19px; margin-bottom:19px;" +
                            "'" +
                            ">" +
                            "Open a project page to select a background.</div>"
                        );
                    }
                },
                get: function (parent) {
                    if (project_unique_name) {
                        const input = parent.querySelectorAll("input")[0].value;

                        if (input) {
                            lastUrls[project_unique_name] = input;
                        } else {
                            delete lastUrls[project_unique_name];
                        }
                    }

                    return lastUrls;
                },
                default: {}
            },
            invert_font_color: {
                type: "custom",
                html: project_unique_name
                    ? "<input type='checkbox' id='invert_font'/>" +
                    "<label for='invert_font'> Enable</label>"
                    : "",
                set: function (value, parent) {
                    lastSwitchers =
                        Object.keys(value).length !== 0 ? value : lastSwitchers;

                    if (project_unique_name) {
                        if (Object.keys(value).length !== 0) {
                            if (value[project_unique_name]) {
                                parent.querySelector("input").checked =
                                    value[project_unique_name];
                            }
                        } else {
                            parent.querySelector("input").checked = false;
                        }
                    } else {
                        const grandParent = parent.parentNode;
                        grandParent.parentNode.removeChild(grandParent);
                    }
                },
                get: function (parent) {
                    if (project_unique_name) {
                        const isChecked = parent.querySelector("input").checked;

                        if (isChecked) {
                            lastSwitchers[project_unique_name] = isChecked;
                        } else {
                            delete lastSwitchers[project_unique_name];
                        }
                    }

                    return lastSwitchers;
                },
                default: {}
            },
            display_backgrounds_on_project_cards: {
                type: "checkbox",
                default: true
            }
        },
        onSave: function (values) {
            location.reload();
        }
    });

    if (
        imageSelectConfig.get("display_backgrounds_on_project_cards") &&
        window.location.href.match(/.+(\/dashboard)$/)
    ) {
        const backgroundUrls = imageSelectConfig.get("background_url");
        const colorSwitchers = imageSelectConfig.get("invert_font_color");

        for (let projectName in backgroundUrls) {
            const pBlock = document.querySelector(`[data-unique="${projectName}"]`)
                .parentElement.parentElement;

            const backgroundUrl = backgroundUrls[projectName];

            testImage(backgroundUrl, projectName).then(success => {
                if (success) {
                    // set background image and disable animation
                    pBlock.style = `background:url(${backgroundUrl});` +
                        "background-size: cover;" +
                        "background-repeat: no-repeat;" +
                        "background-position: 50% 50%;" +
                        "transition-property: none !important;";

                    const colorIsLight = colorSwitchers[projectName];

                    const desc = pBlock.querySelector(".project_desc");
                    const noDesc = pBlock.querySelector(".no_description");
                    const cogImage = pBlock.querySelector(".cog_image");

                    const name = pBlock.querySelector(".project_name");

                    inverseColor(name, colorIsLight);

                    if (noDesc) {
                        inverseColor(noDesc, colorIsLight);
                    } else {
                        inverseColor(desc, colorIsLight);
                    }
                }
            });
        }
    }

    const currentBackground = imageSelectConfig.get("background_url")[
        project_unique_name
    ];

    if (currentBackground) {
        testImage(currentBackground).then(success => {
            if (success) {
                const isRGBLight = imageSelectConfig.get("invert_font_color")[
                    project_unique_name
                ];

                const fontColor = isRGBLight ? "black" : "white";

                try {
                    document.querySelector(
                        "#improved_filters .sort"
                    ).style.color = fontColor;
                    document.querySelector(
                        "#improved_filters .filter_label"
                    ).style.color = fontColor;
                } catch (e) {
                }

                const s = document.body.style;

                s.background = `url(${currentBackground})`;
                s.backgroundSize = "100vw 100vh";
                s.backgroundAttachment = "fixed";
            }
        });
    }
})();
