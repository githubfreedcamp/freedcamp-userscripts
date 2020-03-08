// ==UserScript==
// @name         Freedcamp custom image background
// @namespace    http://freedcamp.com/
// @version      0.7
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

    function setProjectCardFontColor(element, fontInverted, marginLeftPx, shadowPx) {
        element.color = fontInverted ? "black" : "white";
        element.overflow = "visible";
        element.marginLeft = `${marginLeftPx}px`;
        element.textShadow = `${fontInverted ? "white" : "black"} 0px 1px ${shadowPx}px`;
    }

    function setProjectBackground(url, fontColor) {
        try {
            const shadowColor = fontColor === "white" ? "black" : "white";

            const sortLabel = document.querySelector(".sort").style;
            const filterLabel = document.querySelector(".filter_label").style;

            sortLabel.color = fontColor;
            sortLabel.textShadow = `${shadowColor} 0px 1px 8px`;
            filterLabel.color = fontColor;
            filterLabel.textShadow = `${shadowColor} 0px 1px 8px`;
        } catch (e) {
        }

        const s = document.body.style;

        s.background = `url(${url})`;
        s.backgroundSize = "cover";
        s.backgroundRepeat = "no-repeat";
        s.backgroundPosition = "50% 50%";
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

                                setProjectCardFontColor(name.style, fontInverted, 0, 4);

                                if (noDesc) {
                                    setProjectCardFontColor(noDesc.style, fontInverted, 1, 2);
                                } else {
                                    setProjectCardFontColor(desc.style, fontInverted, 1, 2);
                                }
                            }
                        });
                    }
                }
            }

            const dbParams = imageSelectConfig.get("dashboard_background");
            const dbUrl = dbParams.url;
            const dbEnabled = dbParams.enabled;
            const fontColor = dbParams.font_inverted ? "black" : "white";
            const shadowColor = dbParams.font_inverted ? "white" : "black";

            if (dbEnabled) {
                testImage(dbUrl, "Dashboard").then(success => {
                    if (success) {
                        const body = document.body.style;

                        body.background = `url(${dbUrl})`;
                        body.backgroundSize = "cover";
                        body.backgroundRepeat = "no-repeat";
                        body.backgroundPosition = "50% 50%";
                        body.backgroundAttachment = "fixed";

                        switch (page) {
                            case "dashboard/home": {
                                const greetingName = document.querySelector(
                                    ".heading-xl.greeting_name"
                                ).style;
                                const greetingMessage = document.querySelector(
                                    ".text-xl.greeting_message"
                                ).style;

                                greetingName.color = fontColor;
                                greetingName.textShadow = `${shadowColor} 0px 1px 18px`;
                                greetingMessage.color = fontColor;
                                greetingMessage.textShadow = `${shadowColor} 0px 1px 18px`;

                                break;
                            }
                            case "dashboard": {
                                const subheaders = document.querySelectorAll(".subheader");
                                subheaders.forEach(subheader => {
                                    subheader.style.color = fontColor;
                                    subheader.style.textShadow = `${shadowColor} 0px 1px 14px`;
                                });

                                const greeting = document.querySelector(".greeting.left").style;
                                greeting.color = fontColor;
                                greeting.textShadow = `${shadowColor} 0px 1px 18px`;

                                break;
                            }
                            case "dashboard/tasks": {
                                const sortLabel = document.querySelector(".sort").style;
                                const filterLabel = document.querySelector(".filter_label")
                                    .style;

                                sortLabel.color = fontColor;
                                sortLabel.textShadow = `${shadowColor} 0px 1px 8px`;
                                filterLabel.color = fontColor;
                                filterLabel.textShadow = `${shadowColor} 0px 1px 8px`;

                                break;
                            }
                            case "dashboard/calendar": {
                                const filterLabel = document.querySelector(".filter_label")
                                    .style;

                                filterLabel.color = fontColor;
                                filterLabel.textShadow = `${shadowColor} 0px 1px 8px`;

                                break;
                            }
                            case "dashboard/widgets": {
                                document.querySelector(
                                    ".no_entries.no_widgets"
                                ).style.color = fontColor;

                                break;
                            }
                            case "dashboard/reports": {
                                const rtInterval = setInterval(function () {
                                    if (document.querySelector("#report_text")) {
                                        const reportText = document.querySelector("#report_text")
                                            .style;

                                        reportText.color = fontColor;
                                        reportText.textShadow = `${shadowColor} 0px 1px 18px`;

                                        clearInterval(rtInterval);
                                    }
                                }, 100);

                                const rndInterval = setInterval(function () {
                                    if (document.querySelector("#report_name_and_date")) {
                                        const reportNameDate = document.querySelector(
                                            "#report_name_and_date"
                                        ).style;

                                        reportNameDate.color = fontColor;
                                        reportNameDate.textShadow = `${shadowColor} 0px 1px 2px`;

                                        clearInterval(rndInterval);
                                    }
                                }, 100);

                                const fgsInterval = setInterval(function () {
                                    if (document.querySelector(".fg-slate")) {
                                        const fgSlate = document.querySelector(".fg-slate").style;

                                        fgSlate.color = fontColor;
                                        fgSlate.textShadow = `${shadowColor} 0px 1px 2px`;

                                        clearInterval(fgsInterval);
                                    }
                                }, 100);

                                const rcbInterval = setInterval(function () {
                                    if (document.querySelector("#report_created_by")) {
                                        const reportCreatedBy = document.querySelector(
                                            "#report_created_by"
                                        ).style;

                                        reportCreatedBy.color = fontColor;
                                        reportCreatedBy.textShadow = `${shadowColor} 0px 1px 2px`;

                                        clearInterval(rcbInterval);
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
