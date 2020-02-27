// ==UserScript==
// @name         Freedcamp project colors
// @namespace    http://freedcamp.com/
// @version      0.8
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
(function () {
    "use strict";

    const MTPN = "Matching the text in a project name";
    const MTPD = "Matching the text in a project description";
    const MTPND = "Matching the text in a project name and description";
    const FPPC = "Favorite projects with a project color";
    const FPSC = "Favorite projects by a set color";
    const APPC = "All projects with a project color";

    let matchTextConfig, favProjSetColorConfig;

    const modeSelectConfig = new MonkeyConfig({
        title: "Select mode",
        menuCommand: true,
        params: {
            highlight: {
                type: "select",
                choices: [FPPC, FPSC, APPC, MTPN, MTPD, MTPND],
                default: FPPC,
                variant: "radio column"
            }
        },
        onSave: function (values) {
            location.reload();
        }
    });

    const colorOpacityConfig = new MonkeyConfig({
        title: "Color opacity",
        menuCommand: true,
        params: {
            opacity: {
                type: "custom",
                html:
                    '<input type="range" min="30" max="100" value="100" class="slider"',
                set: function (value, parent) {
                    parent.querySelectorAll("input")[0].value = value;
                },
                get: function (parent) {
                    return parent.querySelectorAll("input")[0].value;
                },
                default: "50"
            }
        },
        onSave: function (values) {
            location.reload();
        }
    });
    const MODE = modeSelectConfig.get("highlight");

    const OPACITY = colorOpacityConfig.get("opacity") / 100;

    const HEX_REGEX = /^(\s+)?((#(0x){0,1}|#{0,1})([0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}))(\s+)?$/;

    function generateKeyFields(count) {
        let html =
            '<input type="text" placeholder="keyword" style="width: 10em;" />  ' +
            '<input type="color" placeholder="HEX color" style="width: 5em;" /></br>';

        for (let i = 0; i < count - 1; i++) {
            html +=
                '<input type="text" style="width: 10em;" />  ' +
                '<input type="color" style="width: 5em;" /></br>';
        }
        return html;
    }

    if (MODE === FPSC) {
        favProjSetColorConfig = new MonkeyConfig({
            title: "Set color",
            menuCommand: true,
            params: {
                custom_color: {
                    type: "custom",
                    html: '<input type="color" style="width: 5em;"/>',
                    set: function (value, parent) {
                        parent.querySelectorAll("input")[0].value = value;
                    },
                    get: function (parent) {
                        let value = parent.querySelectorAll("input")[0].value;
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
            onSave: function (values) {
                location.reload();
            }
        });
    } else if (MODE === MTPN || MODE === MTPD || MODE === MTPND) {
        matchTextConfig = new MonkeyConfig({
            title: "Set keywords",
            menuCommand: true,
            params: {
                keywords: {
                    type: "custom",
                    html: generateKeyFields(10),
                    set: function (value, parent) {
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
                    get: function (parent) {
                        let result = {};

                        let inputs = parent.querySelectorAll("input");

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
            onSave: function (values) {
                location.reload();
            }
        });
    }

    // on dashboard page
    if (window.location.href.match(/.+(\/dashboard)$/)) {
        let projects = document.querySelectorAll(".project");

        if (MODE === FPPC || MODE === FPSC) {
            for (let i = 0; i < projects.length; i++) {
                if (projects[i].querySelectorAll(".favorited")[0]) {
                    switchDashboardColor(projects[i]);
                }

                projects[i].querySelectorAll(
                    ".favorite_project_action"
                )[0].onclick = function () {
                    switchDashboardColor(projects[i]);
                };
            }
        } else {
            for (let i = 0; i < projects.length; i++) {
                switchDashboardColor(projects[i]);
            }
        }
    }

    // sidebar
    let switcherNotOpened = true;
    document.querySelectorAll(".fc_project_switcher")[0].onclick = function () {
        if (switcherNotOpened) {
            // check if switcher is opened to prevent color re-setting
            if (MODE === FPPC || MODE === FPSC) {
                let sideProjects = document.querySelectorAll(".f_favorite");

                for (let z = 0; z < sideProjects.length; z++) {
                    let sideProject = sideProjects[z].querySelectorAll(
                        ".fc_project_item"
                    )[0];

                    switchSidebarColor(sideProject);
                }
            } else {
                let sideProjects = document.querySelectorAll(".fc_project_item");

                for (let z = 0; z < sideProjects.length; z++) {
                    let sideProject = sideProjects[z];

                    switchSidebarColor(sideProject);
                }
            }
        }

        switcherNotOpened = false;
    };

    function switchSidebarColor(sideProject) {
        let color;

        switch (MODE) {
            case APPC:
                color = sideProject.querySelectorAll(".color")[0].style.backgroundColor;
                break;
            case FPPC:
                color = hexToRgb(favProjSetColorConfig.get("custom_color"));
                break;
            case MTPN:
            case MTPD:
            case MTPND: {
                let keywords = matchTextConfig.get("keywords");

                let name = sideProject
                    .querySelectorAll(".name")[0]
                    .textContent.toLowerCase();
                let description = sideProject
                    .querySelectorAll(".fc_description")[0]
                    .textContent.toLowerCase();

                for (let key in keywords) {
                    let value = keywords[key];

                    let matchBool;

                    let matchNameBool = name.indexOf(key.toLowerCase()) != -1;
                    let matchDescBool = description.indexOf(key.toLowerCase()) != -1;
                    let matchNameDescBool = matchNameBool || matchDescBool;

                    if (MODE === MTPN) {
                        matchBool = matchNameBool;
                    } else if (MODE === MTPD) {
                        matchBool = matchDescBool;
                    } else {
                        matchBool = matchNameDescBool;
                    }

                    if (matchBool) {
                        color = hexToRgb(value);
                        break;
                    }
                }

                break;
            }
        }

        if (color) {
            let colorIsLight = isLight(color);

            let name = sideProject.querySelectorAll(".name")[0];
            let desc = sideProject.querySelectorAll(".fc_description")[0];

            let fcApps = sideProject.querySelectorAll(".fc_app");

            inverseColor(name, colorIsLight);

            if (desc) {
                inverseColor(desc, colorIsLight);
            }

            // make buttons dark
            for (let x = 0; x < fcApps.length; x++) {
                let btns = fcApps[x].querySelectorAll(".btn");

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

    function switchDashboardColor(pBlock) {
        let color, colorIsLight, opColor;

        switch (MODE) {
            case FPPC:
            case APPC:
                color = pBlock.querySelectorAll(".card_color")[0].style.backgroundColor;
                break;
            case FPSC:
                color = hexToRgb(favProjSetColorConfig.get("custom_color"));
                break;
            case MTPN:
            case MTPD:
            case MTPND: {
                let keywords = matchTextConfig.get("keywords");
                let name = pBlock
                    .querySelectorAll(".project_name")[0]
                    .textContent.toLowerCase();
                let description = pBlock
                    .querySelectorAll(".project_desc")[0]
                    .textContent.toLowerCase();

                for (let key in keywords) {
                    let value = keywords[key];

                    let matchBool;

                    let matchNameBool = name.indexOf(key.toLowerCase()) != -1;
                    let matchDescBool = description.indexOf(key.toLowerCase()) != -1;
                    let matchNameDescBool = matchNameBool || matchDescBool;

                    if (MODE === MTPN) {
                        matchBool = matchNameBool;
                    } else if (MODE === MTPD) {
                        matchBool = matchDescBool;
                    } else {
                        matchBool = matchNameDescBool;
                    }

                    if (matchBool) {
                        color = hexToRgb(value);
                    }
                }

                break;
            }
        }

        if (color) {
            colorIsLight = isLight(color);
            opColor = `${color.substring(0, color.length - 1)}, ${OPACITY})`;

            let desc = pBlock.querySelectorAll(".project_desc")[0];
            let noDesc = pBlock.querySelectorAll(".no_description")[0];
            const cogImage = pBlock.querySelectorAll(".cog_image")[0];

            let name = pBlock.querySelectorAll(".project_name")[0];

            if (pBlock.style.background) {
                pBlock.removeAttribute("style");
            } else {
                pBlock.style.background = opColor;
            }

            inverseColor(name, colorIsLight);

            if (noDesc) {
                inverseColor(noDesc, colorIsLight);
            } else {
                inverseColor(desc, colorIsLight);
            }

            if (cogImage.style.color) {
                cogImage.removeAttribute("style");
            } else {
                cogImage.style.color = "black";
            }
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

    function inverseColor(element, light) {
        if (element.style.color) {
            element.removeAttribute("style");
        } else {
            element.style.color = light ? "black" : "white";
        }
    }

    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
                result[3],
                16
            )})`
            : null;
    }
})();
