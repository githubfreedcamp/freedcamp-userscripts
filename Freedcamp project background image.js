// ==UserScript==
// @name         Freedcamp custom image background
// @namespace    http://freedcamp.com/
// @version      1.05
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

(function() {
    "use strict";

    let cbKeys = {};

    function testImage(url, name) {
        return new Promise(function(resolve, reject) {
            const timeout = 5000;
            let timer,
                img = new Image();
            img.onerror = img.onabort = function() {
                clearTimeout(timer);
                viewUrlError(name);
                reject(false);
            };
            img.onload = function() {
                clearTimeout(timer);
                resolve(true);
            };
            timer = setTimeout(function() {
                // reset .src to invalid URL so it stops previous
                // loading, but doens't trigger new load
                img.src = "//!!!!/notexist.jpg";
                viewUrlError(name);
                reject(false);
            }, timeout);
            img.src = url;
        });
    }

    function viewUrlError(text) {
        setTimeout(function() {
            alert(
                `${text} background image error:\nIncorrect background url! Please change it.`
            );
        }, 2000);
    }

    function setProjectBackground(url, fontColor) {
        const shadowColor = fontColor === "white" ? "black" : "white";

        tryToSetNewButtonsColor(fontColor, shadowColor);

        const s = document.body.style;

        s.background = `url(${url})`;
        s.backgroundSize = "cover";
        s.backgroundRepeat = "no-repeat";
        s.backgroundPosition = "50% 50%";
        s.backgroundAttachment = "fixed";
    }

    function tryToSetNewButtonsColor(fontColor, shadowColor) {
        const buttons = document.querySelectorAll(".Button--fk-Intent-primary");
        const shadow = `${fontColor} 0px 1px 8px`;

        for (let x = 0; x < buttons.length; x++) {
            const button = buttons[x];

            const svg = button.querySelector("svg");
            const i = button.querySelector("i");
            const text = button.querySelector(".Button--fk-Button-Text");

            if (svg) {
                svg.style.color = fontColor;
            }

            if (i) {
                i.style.color = fontColor;
            }

            if (text) {
                text.style.color = fontColor;
                text.style.textShadow = `${shadowColor} 0px 1px 8px`;
            }
        }
    }

    function setProjectCardBackground(pBlock, backgroundUrl, fontInverted) {
        pBlock.style =
            `background:url(${backgroundUrl});` +
            "background-size: cover;" +
            "background-repeat: no-repeat;" +
            "background-position: 50% 50%;" +
            "transition-property: none !important;";

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

    function setProjectCardFontColor(
     element,
     fontInverted,
     marginLeftPx,
     shadowPx
    ) {
        element.color = fontInverted ? "black" : "white";
        element.marginLeft = `${marginLeftPx}px`;
        element.textShadow = `${
        fontInverted ? "white" : "black"
    } 0px 1px ${shadowPx}px`;
    }

    let imageSelectConfig;
    let lastPath;
    let lastProjectId;
    let lastAppName;

    run();

    window.addEventListener("PROJECT_PICKER_ROUTE_CHANGE", function() {
        const paths = window.location.pathname.split("/");

        const isChanged =
              lastPath === "dashboard"
        ? paths[2] !== lastAppName
        : lastPath === "view"
        ? paths[2] !== lastProjectId || paths[3] !== lastAppName
        : false;

        if (isChanged) {
            run();
        }
    });

    function createMonkeyConfig(projectName, isOldUI) {
        return new MonkeyConfig({
            title: "Config",
            menuCommand: true,
            params: {
                custom_project_background: {
                    type: "custom",
                    html: projectName
                    ? "<input type='text' placeholder='url' style='width: 30em;'/>" +
                    "</br><input type='checkbox' id='enable_cpb'/>" +
                    "<label for='enable_cpb'> Enable </label>" +
                    "<input type='checkbox' id='invert_cpb'/>" +
                    "<label for='invert_cpb'> Invert font color</label>" +
                    "<div><div id='delete_background' hidden><input type='checkbox' id='db_check'/>" +
                    "<label for='db_check'> Delete background from previous version</label></div></div>" +
                    "<a href='javascript:void(0);' id='download_old_config' style='margin-left:3px' hidden>Restore background(s) from previous version</a>"
                    : "",
                    set: function(value, parent) {
                        cbKeys = Object.keys(value).length !== 0 ? value : cbKeys;

                        if (projectName) {
                            let oldConfig = "";

                            for (let key in cbKeys) {
                                if (isNaN(key)) {
                                    const val = cbKeys[key];
                                    if ("url" in val && val.url) {
                                        oldConfig += `</br><a href="${val.url}" target="_blank">${key}</a>`;
                                    }
                                }
                            }

                            const link = parent.querySelector("#download_old_config");

                            if (isOldUI) {
                                if (project_unique_name in cbKeys) {
                                    parent
                                        .querySelector("#delete_background")
                                        .removeAttribute("hidden");
                                }
                            }

                            const openText = () => {
                                let newWindow = window.open();
                                newWindow.document.write(
                                    "IMAGES FROM PREVIOUS VERSION" + oldConfig
                                );
                            };

                            if (oldConfig) {
                                link.addEventListener("click", function() {
                                    if (isOldUI) {
                                        if (project_unique_name in cbKeys) {
                                            const oldProject = cbKeys[project_unique_name];
                                            input[0].value = oldProject.url;
                                            input[1].checked = oldProject.enabled || false;
                                            input[2].checked = oldProject.font_inverted || false;
                                        } else {
                                            openText();
                                        }
                                    } else {
                                        openText();
                                    }
                                });

                                link.removeAttribute("hidden");
                            }

                            const input = parent.querySelectorAll("input");

                            if (Object.keys(value).length === 0) {
                                // "Set defaults"
                                input[0].value = "";
                                input[1].checked = false;
                                input[2].checked = false;
                            } else if (projectName in value) {
                                input[0].value = value[projectName].url || "";
                                input[1].checked = value[projectName].enabled || false;
                                input[2].checked = value[projectName].font_inverted || false;
                            }
                        } else {
                            try {
                                const grandParent = parent.parentNode;
                                const grandGrandParent = grandParent.parentNode;
                                grandParent.parentNode.removeChild(grandParent);
                                grandGrandParent.insertAdjacentHTML(
                                    "afterbegin",
                                    "<tr><td style='display:block; width:0;'><div style=" +
                                    "'font-size:14px; color:red;'>" +
                                    "Open a project page to select a custom background.</div></td></tr>"
                                );
                            } catch (e) {}
                        }
                    },
                    get: function(parent) {
                        if (projectName) {
                            const input = parent.querySelectorAll("input");

                            if (input[3].checked) {
                                delete cbKeys[project_unique_name];
                            }

                            cbKeys[projectName] = {
                                url: input[0].value,
                                enabled: input[1].checked,
                                font_inverted: input[2].checked
                            };
                        }

                        return cbKeys;
                    },
                    default: {}
                },
                default_project_background: {
                    type: "custom",
                    html:
                    "<input type='text' placeholder='url' style='width: 30em;'/>" +
                    "</br><input type='checkbox' id='enable_dpb'/>" +
                    "<label for='enable_dpb'> Enable </label>" +
                    "<input type='checkbox' id='invert_dpf'/>" +
                    "<label for='invert_dpf'> Invert font color</label>",
                    set: function(value, parent) {
                        const elements = parent.querySelectorAll("input");
                        elements[0].value = value.url;
                        elements[1].checked = value.enabled;
                        elements[2].checked = value.font_inverted;
                    },
                    get: function(parent) {
                        const elements = parent.querySelectorAll("input");
                        const url = elements[0].value;
                        const enabled = elements[1].checked;
                        const fontInverted = elements[2].checked;

                        return { url: url, enabled: enabled, font_inverted: fontInverted };
                    },
                    default: { url: "", enabled: false, font_inverted: false }
                },
                display_backgrounds_on_project_cards: {
                    type: "checkbox",
                    default: false
                },
                dashboards_background: {
                    type: "custom",
                    html:
                    "<input type='text' placeholder='url' style='width: 30em;'/>" +
                    "</br><input type='checkbox' id='enable_db'/>" +
                    "<label for='enable_db'> Enable </label>" +
                    "<input type='checkbox' id='invert_df'/>" +
                    "<label for='invert_df'> Invert font color</label>",
                    set: function(value, parent) {
                        const elements = parent.querySelectorAll("input");
                        elements[0].value = value.url;
                        elements[1].checked = value.enabled;
                        elements[2].checked = value.font_inverted;
                    },
                    get: function(parent) {
                        const elements = parent.querySelectorAll("input");
                        const url = elements[0].value;
                        const enabled = elements[1].checked;
                        const fontInverted = elements[2].checked;

                        return { url: url, enabled: enabled, font_inverted: fontInverted };
                    },
                    default: { url: "", enabled: false, font_inverted: false }
                }
            },
            onSave: function(values) {
                location.reload();
            }
        });
    }

    function run() {
        const isNewUI = typeof project_unique_name === "undefined";

        let projectName;
        let projectHeader = isNewUI
        ? document.querySelector(".Header--fk-Header-ProjectName")
        : document.querySelector("#project_name");

        if (isNewUI) {
            const paths = window.location.pathname.split("/");
            lastPath = paths[1];

            if (lastPath === "dashboard") {
                lastAppName = paths[2];
            } else if (lastPath === "view") {
                lastProjectId = paths[2];
                lastAppName = paths[3];

                projectName = lastProjectId;
            }
        } else {
            try {
                const projectId = fc.project_id.toString();
                if (projectId !== "0") {
                    projectName = projectId;
                }
            } catch (e) {}
        }

        imageSelectConfig = createMonkeyConfig(projectName, !isNewUI);

        if (projectName) {
            setProject(projectName, isNewUI);
        } else {
            switchDashboardPages();
        }
    }

    function setProject(projectName, isNewUI) {
        const cbConfig = imageSelectConfig.get("custom_project_background")[
            projectName
        ];

        if (cbConfig && cbConfig.enabled) {
            const cbUrl = cbConfig.url;
            const cbFontColor = cbConfig.font_inverted ? "black" : "white";
            const cbpShadowColor = cbConfig.font_inverted ? "white" : "black";

            tryToSetFolderIcon(cbFontColor);

            testImage(cbUrl, "Custom project").then(success => {
                if (success) {
                    setProjectBackground(cbUrl, cbFontColor);
                }
            });

            if (!isNewUI) {
                tryToSetSpans(cbFontColor, cbpShadowColor);
            }
        } else {
            const dpbConfig = imageSelectConfig.get("default_project_background");
            const dbpEnabled = dpbConfig.enabled;
            const dbpFontColor = dpbConfig.font_inverted ? "black" : "white";
            const dbpShadowColor = dpbConfig.font_inverted ? "white" : "black";

            if (dbpEnabled) {
                const dpbUrl = dpbConfig.url;

                testImage(dpbUrl, "Default project").then(success => {
                    if (success) {
                        setProjectBackground(dpbUrl, dbpFontColor);
                    }
                });

                tryToSetFolderIcon(dbpFontColor);

                if (!isNewUI) {
                    tryToSetSpans(dbpFontColor, dbpShadowColor);
                }
            }
        }
    }

    function tryToSetFolderIcon(fontColor) {
        const folderIcon = document.querySelector('[name="folder-search"]');

        if (folderIcon) {
            folderIcon.style.color = fontColor;
        }
    }

    function tryToSetSpans(fontColor, shadowColor) {
        const spans = document.querySelectorAll("span.sort");

        for (let i = 0; i < spans.length; i++) {
            let span = spans[i];
            span.style.color = fontColor;
            span.style.textShadow = `${shadowColor} 0px 1px 8px`;
        }
    }

    function switchDashboardPages() {
        let match = window.location.href.match(
            /.+\/(dashboard|dashboard\/home|dashboard\/tasks|dashboard\/calendar|dashboard\/widgets|dashboard\/reports)\/?$/
        );
        if (match) {
            const page = match[match.length - 1];

            const dbpEnabled = imageSelectConfig.get(
                "display_backgrounds_on_project_cards"
            );

            // switch project cards backgrounds
            if (dbpEnabled && page === "dashboard") {
                switchDashboardProjectCards();
            }

            const dbParams = imageSelectConfig.get("dashboards_background");
            const dbUrl = dbParams.url;
            const dbEnabled = dbParams.enabled;
            const dbFontColor = dbParams.font_inverted ? "black" : "white";
            const dbShadowColor = dbParams.font_inverted ? "white" : "black";

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
                            case "dashboard/home":
                                switchDashboardHome(dbFontColor, dbShadowColor);
                                break;
                            case "dashboard":
                                switchDashboard(dbFontColor, dbShadowColor);
                                break;
                            case "dashboard/tasks":
                                switchDashboardTasks(dbFontColor, dbShadowColor);
                                break;
                            case "dashboard/calendar":
                                switchDashBoardCalendar(dbFontColor, dbShadowColor);
                                break;
                            case "dashboard/widgets":
                                switchDashboardWidgets(dbFontColor);
                                break;
                            case "dashboard/reports":
                                switchDashboardReports(dbFontColor, dbShadowColor);
                                break;
                        }
                    }
                });
            }
        }
    }

    function switchDashboardProjectCards() {
        const cpbUrls = imageSelectConfig.get("custom_project_background");

        const dpbConfig = imageSelectConfig.get("default_project_background");

        let dpbUrlChecked = false;
        let dpbUrlVerified = false;

        const dpbUrl = dpbConfig.url;
        const dpbFontInverted = dpbConfig.font_inverted;
        const dpbEnabled = dpbConfig.enabled;

        const pBlocks = document.querySelectorAll(".project");

        pBlocks.forEach(pBlock => {
            const pName = pBlock
            .querySelector(".favorite_project_action")
            .getAttribute("data-id");

            if (pName in cpbUrls && cpbUrls[pName].enabled) {
                switchDashboardCPBProjectCard(pBlock, pName, cpbUrls);
            } else if (dpbEnabled) {
                // check default background url only once
                if (!dpbUrlChecked) {
                    testImage(dpbUrl, "Default project").then(success => {
                        dpbUrlChecked = true;

                        if (success) {
                            dpbUrlVerified = true;

                            setProjectCardBackground(pBlock, dpbUrl, dpbFontInverted);
                        }
                    });
                } else if (dpbUrlVerified) {
                    setProjectCardBackground(pBlock, dpbUrl, dpbFontInverted);
                }
            }
        });
    }

    function switchDashboardCPBProjectCard(pBlock, pName, cpbUrls) {
        const cpbUrl = cpbUrls[pName].url;

        testImage(cpbUrl, `Project ${pName}`).then(success => {
            if (success) {
                // set background image and disable animation
                const fontInverted = cpbUrls[pName].font_inverted;

                setProjectCardBackground(pBlock, cpbUrl, fontInverted);
            }
        });
    }

    function switchDashboardHome(dbFontColor, dbShadowColor) {
        switchDashboardHomeTitles(dbFontColor, dbShadowColor);

        switchDashboardHomeHeaders(dbFontColor, dbShadowColor);

        switchDashboardHomeDropdownIcon(dbFontColor, dbShadowColor);
    }

    function switchDashboardHomeTitles(dbFontColor, dbShadowColor) {
        const titles = document.querySelectorAll('[class$="-Title"]');

        const titleChilds = titles[0].childNodes;

        for (let x = 0; x < titleChilds.length; x++) {
            try {
                const titleChild = titleChilds[x];
                titleChild.style.color = dbFontColor;
                titleChild.style.textShadow = `${dbShadowColor} 0px 1px 8px`;
            } catch (e) {}
        }

        for (let i = 0; i < titles.length; i++) {
            const title = titles[i];
            title.style.color = dbFontColor;
            title.style.textShadow = `${dbShadowColor} 0px 1px 8px`;
        }
    }

    function switchDashboardHomeHeaders(dbFontColor, dbShadowColor) {
        const headers = document.querySelectorAll(
            ".HomeBoard--fk-Home-Card-Header"
        );
        for (let i = 0; i < headers.length; i++) {
            const header = headers[i];
            const svgs = header.querySelectorAll("svg");
            const texts = header.querySelectorAll(".Button--fk-Button-Text");

            for (let x = 0; x < svgs.length; x++) {
                svgs[x].style.color = dbFontColor;
            }

            for (let x = 0; x < texts.length; x++) {
                texts[x].style.color = dbFontColor;
                texts[x].style.textShadow = `${dbShadowColor} 0px 1px 8px`;
            }
        }
    }

    function switchDashboardHomeDropdownIcon(dbFontColor, dbShadowColor) {
        try {
            document
                .querySelector("#fk-Home-Projects-Dropdown")
                .querySelector("svg").style.color = dbFontColor;
        } catch (e) {}
    }

    function switchDashboard(dbFontColor, dbShadowColor) {
        const subheaders = document.querySelectorAll(".subheader");
        subheaders.forEach(subheader => {
            subheader.style.color = dbFontColor;
            subheader.style.textShadow = `${dbShadowColor} 0px 1px 14px`;
        });

        const greeting = document.querySelector(".greeting.left").style;
        greeting.color = dbFontColor;
        greeting.textShadow = `${dbShadowColor} 0px 1px 18px`;
    }

    function switchDashboardTasks(dbFontColor, dbShadowColor) {
        const header = document.querySelector(".AppHeader--fk-AppHeader.noprint");

        if (header) {
            const svgs = header.querySelectorAll("svg");
            const is = header.querySelectorAll("i");
            const texts = header.querySelectorAll(".Button--fk-Button-Text");

            for (let x = 0; x < svgs.length; x++) {
                svgs[x].style.color = dbFontColor;
            }

            for (let x = 0; x < is.length; x++) {
                is[x].style.color = dbFontColor;
            }

            for (let x = 0; x < texts.length; x++) {
                texts[x].style.color = dbFontColor;
                texts[x].style.textShadow = `${dbShadowColor} 0px 1px 8px`;
            }
        }
    }

    function switchDashBoardCalendar(dbFontColor, dbShadowColor) {
        const filterLabel = document.querySelector(".filter_label").style;

        filterLabel.color = dbFontColor;
        filterLabel.textShadow = `${dbShadowColor} 0px 1px 8px`;
    }

    function switchDashboardWidgets(dbFontColor) {
        document.querySelector(".no_entries.no_widgets").style.color = dbFontColor;
    }

    function switchDashboardReports(dbFontColor, dbShadowColor) {
        createReportsInterval("#report_text", dbFontColor, dbShadowColor, 18);
        createReportsInterval("#report_name_and_date", dbFontColor, dbShadowColor);
        createReportsInterval(".fg-slate", dbFontColor, dbShadowColor);
        createReportsInterval("#report_created_by", dbFontColor, dbShadowColor);
    }

    function createReportsInterval(
     selector,
     dbFontColor,
     dbShadowColor,
     customRadius = 3
    ) {
        const interval = setInterval(function() {
            const el = document.querySelector(selector);
            if (el) {
                const reportText = el.style;

                reportText.color = dbFontColor;
                reportText.textShadow = `${dbShadowColor} 0px 1px ${customRadius}px`;

                clearInterval(interval);
            }
        }, 100);
    }
})();
