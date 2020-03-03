// ==UserScript==
// @name         Freedcamp project background image
// @namespace    http://freedcamp.com/
// @version      0.4
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

    function testImage(url, name) {
        return new Promise(function (resolve, reject) {
            const timeout = 5000;
            let timer,
                img = new Image();
            img.onerror = img.onabort = function () {
                clearTimeout(timer);
                viewUrlError(name);
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
                viewUrlError(name);
                reject(false);
            }, timeout);
            img.src = url;
        });
    }

    function viewUrlError(text) {
        alert(
            `${text} background image error:\nIncorrect background url! Please change it.`
        );
    }

    let lastUrls = {};
    let lastSwitchers = {};

    function deleteHtmlElement(element) {
        const grandParent = element.parentNode;
        grandParent.parentNode.removeChild(grandParent);
    }

    function invertColor(element, isLight) {
        if (element.style.color) {
            element.removeAttribute("style");
        } else {
            element.style.color = isLight ? "black" : "white";
        }
    }

    function setProjectBackground(url, fontColor) {
        try {
            document.querySelector("#improved_filters .sort").style.color = fontColor;
            document.querySelector(
                "#improved_filters .filter_label"
            ).style.color = fontColor;
        } catch (e) {
        }

        const s = document.body.style;

        s.background = `url(${url})`;
        s.backgroundSize = "100vw 100vh";
        s.backgroundAttachment = "fixed";
    }

    const imageSelectConfig = new MonkeyConfig({
        title: "Config",
        menuCommand: true,
        params: {
            custom_project_background: {
                type: "custom",
                html: project_unique_name
                    ? "<input type='text' placeholder='url' style='width: 30em;'/>" +
                    "</br><input type='checkbox' id='enable_cpb'/>" +
                    "<label for='enable_cpb'> Enable </label>" +
                    "<input type='checkbox' id='invert_cpb'/>" +
                    "<label for='invert_cpb'> Invert font color</label>"
                    : "",
                set: function (value, parent) {
                    lastUrls = Object.keys(value).length !== 0 ? value : lastUrls;

                    if (project_unique_name) {
                        const input = parent.querySelectorAll("input");

                        if (Object.keys(value).length === 0) {
                            // "Set defaults"
                            input[0].value = "";
                            input[1].checked = false;
                            input[2].checked = false;
                        } else if (value[project_unique_name]) {
                            input[0].value = value[project_unique_name].url || "";
                            input[1].checked = value[project_unique_name].enabled || false;
                            input[2].checked =
                                value[project_unique_name].font_inverted || false;
                        }
                    } else {
                        try {
                            const grandParent = parent.parentNode;
                            const grandGrandParent = grandParent.parentNode;
                            grandParent.parentNode.removeChild(grandParent);
                            grandGrandParent.insertAdjacentHTML(
                                "afterbegin",
                                "<tr><td style='display:block; width:0px;'><div style=" +
                                "'font-size:14px; color:red;'>" +
                                "Open a project page to select a custom background.</div></td></tr>"
                            );
                        } catch (e) {
                        }
                    }
                },
                get: function (parent) {
                    if (project_unique_name) {
                        const input = parent.querySelectorAll("input");

                        lastUrls[project_unique_name] = {
                            url: input[0].value,
                            enabled: input[1].checked,
                            font_inverted: input[2].checked
                        };
                    }

                    return lastUrls;
                },
                default: {}
            },
            display_custom_backgrounds_on_project_cards: {
                type: "checkbox",
                default: false
            },
            default_project_background: {
                type: "custom",
                html:
                    "<input type='text' placeholder='url' style='width: 30em;'/>" +
                    "</br><input type='checkbox' id='enable_dpb'/>" +
                    "<label for='enable_dpb'> Enable </label>" +
                    "<input type='checkbox' id='invert_dpf'/>" +
                    "<label for='invert_dpf'> Invert font color</label>",
                set: function (value, parent) {
                    const elements = parent.querySelectorAll("input");
                    elements[0].value = value.url;
                    elements[1].checked = value.enabled;
                    elements[2].checked = value.font_inverted;
                },
                get: function (parent) {
                    const elements = parent.querySelectorAll("input");
                    const url = elements[0].value;
                    const enabled = elements[1].checked;
                    const fontInverted = elements[2].checked;

                    return {url: url, enabled: enabled, font_inverted: fontInverted};
                },
                default: {url: "", enabled: false, font_inverted: false}
            },
            dashboard_background: {
                type: "custom",
                html:
                    "<input type='text' placeholder='url' style='width: 30em;'/>" +
                    "</br><input type='checkbox' id='enable_db'/>" +
                    "<label for='enable_db'> Enable </label>" +
                    "<input type='checkbox' id='invert_df'/>" +
                    "<label for='invert_df'> Invert font color</label>",
                set: function (value, parent) {
                    const elements = parent.querySelectorAll("input");
                    elements[0].value = value.url;
                    elements[1].checked = value.enabled;
                    elements[2].checked = value.font_inverted;
                },
                get: function (parent) {
                    const elements = parent.querySelectorAll("input");
                    const url = elements[0].value;
                    const enabled = elements[1].checked;
                    const fontInverted = elements[2].checked;

                    return {url: url, enabled: enabled, font_inverted: fontInverted};
                },
                default: {url: "", enabled: false, font_inverted: false}
            }
        },
        onSave: function (values) {
            location.reload();
        }
    });

    if (project_unique_name) {
        const cbConfig = imageSelectConfig.get("custom_project_background")[
            project_unique_name
            ];

        if (cbConfig && cbConfig.enabled) {
            const cbUrl = cbConfig.url;

            testImage(cbUrl, "Custom project").then(success => {
                if (success) {
                    const fontColor = cbConfig.font_inverted ? "black" : "white";

                    setProjectBackground(cbUrl, fontColor);
                }
            });
        } else {
            const dpbConfig = imageSelectConfig.get("default_project_background");
            const dbpEnabled = dpbConfig.enabled;

            if (dbpEnabled) {
                const dpbUrl = dpbConfig.url;

                testImage(dpbUrl, "Default project").then(success => {
                    if (success) {
                        const fontColor = dpbConfig.font_inverted ? "black" : "white";

                        setProjectBackground(dpbUrl, fontColor);
                    }
                });
            }
        }
    } else {
        // if not project page
        let match = window.location.href.match(
            /.+\/(dashboard|dashboard\/home|dashboard\/calendar|dashboard\/tasks|dashboard\/calendar|dashboard\/widgets|dashboard\/reports)\/?$/
        );
        if (match) {
            const page = match[match.length - 1];

            const pcbEnabled = imageSelectConfig.get(
                "display_custom_backgrounds_on_project_cards"
            );

            if (pcbEnabled && page === "dashboard") {
                const backgroundUrls = imageSelectConfig.get(
                    "custom_project_background"
                );

                for (let projectName in backgroundUrls) {
                    if (backgroundUrls[projectName].enabled) {
                        const pBlock = document.querySelector(
                            `[data-unique="${projectName}"]`
                        ).parentElement.parentElement;

                        const backgroundUrl = backgroundUrls[projectName].url;

                        testImage(backgroundUrl, `Project ${projectName}`).then(success => {
                            if (success) {
                                // set background image and disable animation
                                pBlock.style =
                                    `background:url(${backgroundUrl});` +
                                    "background-size: cover;" +
                                    "background-repeat: no-repeat;" +
                                    "background-position: 50% 50%;" +
                                    "transition-property: none !important;";

                                const fontInverted = backgroundUrls[projectName].font_inverted;

                                const desc = pBlock.querySelector(".project_desc");
                                const noDesc = pBlock.querySelector(".no_description");
                                const cogImage = pBlock.querySelector(".cog_image");

                                const name = pBlock.querySelector(".project_name");

                                invertColor(name, fontInverted);

                                if (noDesc) {
                                    invertColor(noDesc, fontInverted);
                                } else {
                                    invertColor(desc, fontInverted);
                                }
                            }
                        });
                    }
                }
            }

            const dbParams = imageSelectConfig.get("dashboard_background");
            const dbUrl = dbParams.url;
            const dbEnabled = dbParams.enabled;
            const color = dbParams.font_inverted ? "black" : "white";

            if (dbEnabled) {
                testImage(dbUrl, "Dashboard").then(success => {
                    if (success) {
                        const s = document.body.style;

                        s.background = `url(${dbUrl})`;
                        s.backgroundSize = "100vw 100vh";
                        s.backgroundAttachment = "fixed";

                        switch (page) {
                            case "dashboard/home": {
                                document.querySelector(
                                    ".heading-xl.greeting_name"
                                ).style.color = color;
                                break;
                            }
                            case "dashboard": {
                                const subheaders = document.querySelectorAll(".subheader");
                                subheaders.forEach(subheader => {
                                    subheader.style.color = color;
                                });

                                document.querySelector(".greeting.left").style.color = color;
                                break;
                            }
                            case "dashboard/tasks": {
                                document.querySelector(".sort").style.color = color;
                                document.querySelector(".filter_label").style.color = color;
                                break;
                            }
                            case "dashboard/calendar": {
                                document.querySelector(".filter_label").style.color = color;
                                break;
                            }
                            case "dashboard/widgets": {
                                document.querySelector(
                                    ".no_entries.no_widgets"
                                ).style.color = color;
                                break;
                            }
                            case "dashboard/reports": {
                                const rtInterval = setInterval(function () {
                                    if (document.querySelector("#report_text")) {
                                        document.querySelector("#report_text").style.color = color;
                                        clearInterval(rtInterval);
                                    }
                                }, 100);

                                const rndInterval = setInterval(function () {
                                    if (document.querySelector("#report_name_and_date")) {
                                        document.querySelector(
                                            "#report_name_and_date"
                                        ).style.color = color;
                                        clearInterval(rndInterval);
                                    }
                                }, 100);

                                const rcbInterval = setInterval(function () {
                                    if (document.querySelector("#report_created_by")) {
                                        document.querySelector(
                                            "#report_created_by"
                                        ).style.color = color;
                                        clearInterval(rcbInterval);
                                    }
                                }, 100);

                                const fgsInterval = setInterval(function () {
                                    if (document.querySelector(".fg-slate")) {
                                        document.querySelector(".fg-slate").style.color = color;
                                        clearInterval(fgsInterval);
                                    }
                                }, 100);

                                break;
                            }
                        }
                    }
                });
            }
        }
    }
})();
