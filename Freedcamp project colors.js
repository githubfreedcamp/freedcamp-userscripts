// ==UserScript==
// @name         Freedcamp project colors
// @namespace    http://freedcamp.com/
// @version      1.04
// @description  enable project cards background color
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

    let mtConfig, fpscConfig;

    const modeSelectConfig = new MonkeyConfig({
        title: "Select mode",
        menuCommand: true,
        params: {
            highlight: {
                type: "custom",
                html:
                "<input type='radio' name='mode' id='fppc'/>" +
                "<label for='fppc'> Favorite projects with a project color</label><br>" +
                "<input type='radio' name='mode' id='fpsc'/>" +
                "<label for='fpsc'> Favorite projects by a set color</label><br>" +
                "<input type='radio' name='mode' id='appc'/>" +
                "<label for='appc'> All projects with a project color</label><br>" +
                "<input type='radio' name='mode' id='mtp'/>" +
                "<label for='mtp'> Matching the text in a project </label>" +
                "<input type='checkbox' id='mtpn'>name </input>" +
                "<input type='checkbox' id='mtpd'>description</input>",
                set: function(value, parent) {
                    const modeSelected = `#${value[0]}`.toLowerCase();

                    parent.querySelector(modeSelected).checked = true;
                    parent.querySelector("#mtpn").checked = value[1];
                    parent.querySelector("#mtpd").checked = value[2];
                },
                get: function(parent) {
                    const modeSelected = parent
                    .querySelector('input[name="mode"]:checked')
                    .id.toUpperCase();
                    const mtpdChecked = parent.querySelector("#mtpd").checked;
                    let mtpnChecked = parent.querySelector("#mtpn").checked;

                    // reset to "name" if nothing selected
                    if (!mtpnChecked && !mtpdChecked) {
                        mtpnChecked = true;
                    }

                    return [modeSelected, mtpnChecked, mtpdChecked];
                },
                default: ["fppc", true, true]
            }
        },
        onSave: function(values) {
            location.reload();
        }
    });

    const colorOpacityConfig = new MonkeyConfig({
        title: "Color opacity",
        menuCommand: true,
        params: {
            opacity: {
                type: "custom",
                html: "<input type='range' min='10' max='100' value='100'/>",
                set: function(value, parent) {
                    parent.querySelector("input").value = value;
                },
                get: function(parent) {
                    return parent.querySelector("input").value;
                },
                default: "50"
            }
        },
        onSave: function(values) {
            location.reload();
        }
    });

    const MODE = modeSelectConfig.get("highlight")[0];
    const MTPN_CHECKED = modeSelectConfig.get("highlight")[1];
    const MTPD_CHECKED = modeSelectConfig.get("highlight")[2];

    const OPACITY = colorOpacityConfig.get("opacity") / 100;

    const HEX_REGEX = /^(\s+)?((#(0x){0,1}|#{0,1})([0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}))(\s+)?$/;

    function mtpGenerateKeyFields(keywords) {
        let html =
            "<input type='text' placeholder='keyword' style='width: 10em;'/>  " +
            "<input type='color' placeholder='HEX color' style='width: 5em;'/></br>";

        let kCount = 0;

        for (let key in keywords) {
            kCount++;
        }

        for (let i = 1; i < kCount; i++) {
            html +=
                "<input type='text' style='width: 10em;'/>  " +
                "<input type='color' style='width: 5em;'/></br>";
        }

        const buttonStyle =
              "display:inline-block;" +
              "border-radius: 2px;" +
              "background-color: #4CAF50;" +
              "color: white;" +
              "padding: 1em;" +
              "margin-top: 0.5em;" +
              "width: 15.5em;";

        html += `<button id='addButton' style='${buttonStyle}'>Add +1 keyword</button>`;

        return html;
    }

    function mtpSetCenter() {
        document.getElementsByClassName("__MonkeyConfig_layer")[0].style.top =
            "50%";
        document.getElementsByClassName("__MonkeyConfig_layer")[0].style.transform =
            "translate(0, -50%)";
    }

    if (MODE === "FPSC") {
        fpscConfig = new MonkeyConfig({
            title: "Set color",
            menuCommand: true,
            params: {
                custom_color: {
                    type: "custom",
                    html: "<input type='color' style='width: 5em;'/>",
                    set: function(value, parent) {
                        parent.querySelector("input").value = value;
                    },
                    get: function(parent) {
                        const value = parent.querySelector("input").value;
                        if (!value.match(HEX_REGEX)) {
                            alert("Wrong HEX color! Restored default.");
                            return "#00FF00";
                        } else {
                            return value.replace(HEX_REGEX, "$2");
                        }
                    },
                    default: "#00ff00"
                }
            },
            onSave: function(values) {
                location.reload();
            }
        });
    } else if (MODE === "MTP") {
        mtConfig = new MonkeyConfig({
            title: "Set keywords",
            menuCommand: true,
            params: {
                keywords: {
                    type: "custom",
                    html: "",
                    set: function(value, parent) {
                        parent.innerHTML = mtpGenerateKeyFields(value);

                        const iframe = document.getElementById("__MonkeyConfig_frame")
                        .contentWindow.document;
                        const configContainer = iframe.querySelector(
                            ".__MonkeyConfig_container"
                        );

                        document.getElementById(
                            "__MonkeyConfig_frame"
                        ).style.height = `${configContainer.offsetHeight}px`;

                        let isStyleSet = false;

                        parent.querySelector("#addButton").onclick = function() {
                            const button = parent.querySelector("#addButton");
                            parent.removeChild(button);
                            const newField =
                                  "<input type='text' style='width: 10em;'/>  " +
                                  "<input type='color' style='width: 5em;'/></br>";

                            parent.insertAdjacentHTML("beforeend", newField);

                            const oldHeight = document.getElementById("__MonkeyConfig_frame")
                            .offsetHeight;

                            const newHeight = oldHeight + 23;

                            document.getElementById(
                                "__MonkeyConfig_frame"
                            ).style.height = `${newHeight}px`;

                            if (!isStyleSet) {
                                mtpSetCenter();

                                isStyleSet = true;
                            }

                            parent.append(button);
                        };

                        let i = 0;

                        for (let key in value) {
                            parent.querySelectorAll("input")[i].value = key;
                            parent.querySelectorAll("input")[i + 1].value = value[key];

                            i += 2;
                        }
                        for (; i < parent.querySelectorAll("input").length; i++) {
                            parent.querySelectorAll("input")[i].value = "";
                        }
                    },
                    get: function(parent) {
                        let result = {};

                        const inputs = parent.querySelectorAll("input");

                        for (let i = 0; i < inputs.length; i += 2) {
                            const key = inputs[i].value;
                            const val = inputs[i + 1].value.toLowerCase();

                            if (key.length > 2 && val.match(HEX_REGEX)) {
                                result[key] = val.replace(HEX_REGEX, "$2");
                            }
                        }

                        return result;
                    },
                    default: {
                        keyword1: "#00ff00"
                    }
                }
            },
            onSave: function(values) {
                location.reload();
            }
        });
    }

    window.addEventListener("FC_ROUTE_CHANGED", function() {
        if (window.location.pathname === "/dashboard/home") {
            setTimeout(() => switchHomeDashboardColors(), 0);
        }
    });

    // on dashboard page
    if (window.location.pathname === "/dashboard") {
        switchDashboardColors();
    } else if (window.location.pathname === "/dashboard/home") {
        switchHomeDashboardColors();
    }

    function switchDashboardColors() {
        const pBlocks = document.querySelectorAll(".project");

        if (MODE === "FPPC" || MODE === "FPSC") {
            for (let i = 0; i < pBlocks.length; i++) {
                const pBlock = pBlocks[i];

                if (isDashboardFavorite(pBlock)) {
                    switchDashboardColor(pBlock);
                }

                pBlock.querySelector(
                    ".favorite_project_action"
                ).onclick = () => switchDashboardColor(pBlocks[i]);
            }
        } else {
            for (let i = 0; i < pBlocks.length; i++) {
                switchDashboardColor(pBlocks[i]);
            }
        }
    }

    function switchDashboardColor(pBlock) {
        let color, isColorLight, opColor;

        switch (MODE) {
            case "FPPC":
            case "APPC":
                color = pBlock.querySelector(".card_color").style.backgroundColor;
                break;
            case "FPSC":
                color = hexToRgb(fpscConfig.get("custom_color"));
                break;
            case "MTP": {
                const keywords = mtConfig.get("keywords");
                const name = pBlock
                .querySelector(".project_name")
                .textContent.toLowerCase();
                const description = pBlock
                .querySelector(".project_desc")
                .textContent.toLowerCase();

                for (let key in keywords) {
                    if (isKeyMatch(key, name, description)) {
                        const value = keywords[key];

                        color = hexToRgb(value);
                        break;
                    }
                }

                break;
            }
        }

        if (color) {
            isColorLight = isLight(color);
            opColor = `${color.substring(0, color.length - 1)}, ${OPACITY})`;

            const desc = pBlock.querySelector(".project_desc");
            const noDesc = pBlock.querySelector(".no_description");
            const cogImage = pBlock.querySelector(".cog_image");

            const name = pBlock.querySelector(".project_name");

            if (pBlock.style.background) {
                pBlock.removeAttribute("style");
            } else {
                pBlock.style.background = opColor;
            }

            invertColor(name, isColorLight);

            if (noDesc) {
                invertColor(noDesc, isColorLight);
            } else {
                invertColor(desc, isColorLight);
            }

            if (cogImage.style.color) {
                cogImage.removeAttribute("style");
            } else {
                cogImage.style.color = "black";
            }
        }
    }

    function isDashboardFavorite(pBlock) {
        return !!pBlock.querySelector(".favorited");
    }

    function switchHomeDashboardColors() {
        const pBlocks = document.querySelectorAll(".HomeProjectItem--fk-HomeProjectItem");

        for (let i = 0; i < pBlocks.length; i++) {
            const pBlock = pBlocks[i];

            if (MODE === "FPPC" || MODE === "FPSC") {
                if (isHomeDashboardFavorite(pBlock)) {
                    switchHomeDashboardColor(pBlock, true);
                }

                const favButton = pBlock.querySelector(".tooltip-trigger");

                favButton.onclick = () => switchHomeDashboardColor(pBlock);
            } else {
                switchHomeDashboardColor(pBlock, true);
            }
        }
    }

    function switchHomeDashboardColor(pBlock, isNotHover) {
        let color, isColorLight, opColor;

        switch (MODE) {
            case "FPPC":
            case "APPC":
                color = pBlock.querySelector(".ProjectIcon--project-Icon").style.backgroundColor;
                break;
            case "FPSC":
                color = hexToRgb(fpscConfig.get("custom_color"));
                break;
            case "MTP": {
                const keywords = mtConfig.get("keywords");
                const name = pBlock.querySelector(".HomeProjectItem--fk-Home-Project-Name").innerText.toLowerCase();

                for (let key in keywords) {
                    if (isKeyMatch(key, name, "")) {
                        const value = keywords[key];

                        color = hexToRgb(value);
                        break;
                    }
                }

                break;
            }
        }

        if (color) {
            isColorLight = isLight(color);
            opColor = `${color.substring(0, color.length - 1)}, ${OPACITY})`;

            const defaultColor = "rgb(235,237,243)";
            const isFavorite = isHomeDashboardFavorite(pBlock);

            const light = "white";
            const dark = "rgb(0,0,0,0.7)";

            if (pBlock.style.background) {
                pBlock.removeAttribute("style");
            } else {
                pBlock.style.background = opColor;
            }

            const apps = pBlock.querySelectorAll(".HomeProjectItem--fk-HomeProjectItem-App");

            for (let i = 0; i < apps.length; i++) {
                const appIcon = apps[i].querySelector("svg");

                invertColor(appIcon, isColorLight, light, dark, "rgb(160, 166, 199)");
            }

            const dropdownIcon = pBlock.querySelector(".fk-Dropdown-Trigger").querySelector("svg");
            invertColor(dropdownIcon, isColorLight, light, dark, "inherit");

            const name = pBlock.querySelector(".HomeProjectItem--fk-Home-Project-Name");
            invertColor(name, isColorLight, light, dark);

            const group = pBlock.querySelector(".HomeProjectItem--fk-Home-Project-Group-Name");
            invertColor(group, isColorLight, light, dark);
        }
    }

    function isHomeDashboardFavorite(pBlock) {
        try {
            return pBlock.querySelector(".tooltip-trigger")
                .querySelector("i").style.color === "rgb(230, 180, 31)";
        } catch(e) {
            return false;
        }
    }

    // sidebar
    let switcherNotOpened = true;
    const oldProjectSwitcher = document.querySelector(".fc_project_switcher");
    const newProjectSwitcher = document.querySelector(
        ".Header--fk-Header-Project"
    );
    const isNewUI = typeof react_cache_version !== "undefined";

    if (isNewUI) {
        window.addEventListener("FC_PROJECT_PICKER_OPENED", () =>
                                switchSideProjects(isNewUI)
                               );
    } else {
        oldProjectSwitcher.onclick = () => switchSideProjects(isNewUI);
    }

    function switchSideProjects(isNewUI) {
        const sideProjects = document.querySelectorAll(
            MODE === "FPPC" || MODE === "FPSC"
            ? isNewUI
            ? ".f_favorite"
            : ".f_favorite > .fc_project_item"
            : isNewUI
            ? ".ProjectPicker--fk-ProjectPicker-Project"
            : ".fc_project_item"
        );

        for (let z = 0; z < sideProjects.length; z++) {
            const sideProject = sideProjects[z];

            switchSidebarColor(sideProject, isNewUI);
        }
    }

    function isKeyMatch(key, name, description) {
        let matchBool;

        const matchNameBool = name.toLowerCase().indexOf(key.toLowerCase()) !== -1;
        const matchDescBool = description.toLowerCase().indexOf(key.toLowerCase()) !== -1;

        const matchNameDescBool = matchNameBool || matchDescBool;

        if (MTPN_CHECKED && MTPD_CHECKED) {
            matchBool = matchNameDescBool;
        } else if (MTPD_CHECKED) {
            matchBool = matchDescBool;
        } else {
            matchBool = matchNameBool;
        }

        return matchBool;
    }

    function switchSidebarColor(sideProject, isNewUI) {
        let color;

        switch (MODE) {
            case "APPC":
            case "FPPC":
                color = sideProject.querySelector(
                    isNewUI ? ".ProjectPicker--fk-ProjectPicker-ProjectColor" : ".color"
                ).style.backgroundColor;
                break;
            case "FPSC":
                color = hexToRgb(fpscConfig.get("custom_color"));
                break;
            case "MTP": {
                const keywords = mtConfig.get("keywords");

                const name = sideProject
                .querySelector(
                    isNewUI ? ".ProjectPicker--fk-ProjectPicker-ProjectName" : ".name"
                )
                .textContent.toLowerCase();
                const description = sideProject
                .querySelector(
                    isNewUI
                    ? ".ProjectPicker--fk-ProjectPicker-ProjectDescription"
                    : ".fc_description"
                )
                .textContent.toLowerCase();

                for (let key in keywords) {
                    if (isKeyMatch(key, name, description)) {
                        const value = keywords[key];

                        color = hexToRgb(value);
                        break;
                    }
                }

                break;
            }
        }

        if (color) {
            const isColorLight = isLight(color);

            const name = sideProject.querySelector(
                isNewUI ? ".ProjectPicker--fk-ProjectPicker-ProjectName" : ".name"
            );
            const desc = sideProject.querySelector(
                isNewUI
                ? ".ProjectPicker--fk-ProjectPicker-ProjectDescription"
                : ".fc_description"
            );

            const fcApps = sideProject.querySelectorAll(
                isNewUI
                ? ".ProjectPicker--fk-ProjectPicker-ProjectApplications"
                : ".fc_app"
            );

            invertColor(name, isColorLight);

            if (desc) {
                invertColor(desc, isColorLight);
            }

            // make buttons dark
            for (let x = 0; x < fcApps.length; x++) {
                const btns = fcApps[x].querySelectorAll(".btn");

                for (let y = 0; y < btns.length; y++) {
                    btns[y].style.color = "black";
                }
            }

            sideProject.style.backgroundColor = `${color.substring(
                0,
                color.length - 1
            )}, ${OPACITY})`;

            sideProject.style.borderColor = color;
        }
    }

    function isLight(color) {
        let r, g, b, hsp;

        color = color.match(
            /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
        );

        r = 255 - OPACITY * (255 - color[1]);
        g = 255 - OPACITY * (255 - color[2]);
        b = 255 - OPACITY * (255 - color[3]);

        hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));

        return hsp > 127.5;
    }

    function invertColor(element, isLight, light = "white", dark = "black", defaultColor) {
        if (defaultColor) {
            if (element.style.color !== defaultColor) {
                element.style.color = defaultColor;
            } else {
                element.style.color = isLight ? "black" : "white";
            }
        } else {
            if (element.style.color) {
                element.removeAttribute("style");
            } else {
                element.style.color = isLight ? "black" : "white";
            }
        }
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
            result[3],
            16
        )})`
        : null;
    }
})();
