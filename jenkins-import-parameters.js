// ==UserScript==
// @name           Jenkins Build Parameters Importer
// @name:zh        Jenkins 构建参数导入助手
// @namespace      https://github.com/soleil0-0/userscripts
// @version        1.0.0
// @description    copy build parameters from another jenkins
// @description:zh 从指定链接复制构建参数
// @author         soleil
// @grant          GM_xmlhttpRequest
// @include        http*://*/jenkins/job/*/build*
// ==/UserScript==

"use strict";

function decodeEntities(encodedString) {
    let textArea = document.createElement('textarea');
    textArea.innerHTML = encodedString;
    return textArea.value;
}

function applyJson(data) {
    [...document.querySelectorAll("input[type=hidden][name=name]")].forEach(function(e) {
        if (!(e.value in data)) return;
        let n = e.nextSibling;
        if (n.name != "value") n = n.nextSibling;
        if (n.name != "value") return;

        if (n instanceof HTMLInputElement || n instanceof HTMLTextAreaElement) {
            console.log("set " + e.value + " to " + data[e.value]);
            if (n.type == "checkbox")
                n.checked = data[e.value];
            else
                n.value = data[e.value];
        }
    });
}

function loadJson(url) {
    console.log("fetch data from " + url);
    GM_xmlhttpRequest({
        method: "GET",
        url: url,
        onload: (response) => {
            if (response.status != "200") {
                alert("request BUILD_URL failed !");
                return;
            }
            let data = JSON.parse(response.responseText);
            console.log("raw data", data);

            let form = {};
            data["actions"].forEach(action => {
                if ("_class" in action && action["_class"] == "hudson.model.ParametersAction") {
                    action["parameters"].forEach(p => {
                        if ("value" in p)
                            form[p["name"]] = p["value"];
                    })
                };
            });
            console.log("parsed data", form);

            applyJson(form);
        }
    });
}

function rewriteUrl(url) {
    return url.replace(/(.*)$/, "$1/api/json?tree=actions[parameters[name,value]]");
}

let importRow = document.createElement("tr");

let textColumn = document.createElement("td");
let text = document.createTextNode("Import（其他 BUILD_URL）:")
textColumn.append(text);
textColumn.classList.add("label");
importRow.append(textColumn);

let input = document.createElement("input");
let inputColumn = document.createElement("td");
let importButton = document.createElement("input");
input.setAttribute("id", "import_input");
input.setAttribute("type", "text");
input.setAttribute("size", "40");
importButton.setAttribute("type", "button");
importButton.setAttribute("value", "Import（导入）!");
inputColumn.append(input);
importRow.append(inputColumn);
inputColumn.append(importButton);

let breadcrumbRow = document.querySelector("#breadcrumbs");
breadcrumbRow.parentNode.insertBefore(importRow, breadcrumbRow.nextSibling);

importButton.addEventListener("click", (e) => {
    loadJson(rewriteUrl(input.value));
})
