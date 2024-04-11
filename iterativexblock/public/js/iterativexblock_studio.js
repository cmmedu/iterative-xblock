function IterativeXBlockStudio(runtime, element, settings) {
    let input_title = $(element).find("#input_title");
    let title = $(element).find("#title");
    let input_style = $(element).find("#input_style");
    let style = $(element).find("#style");
    let input_submit_message = $(element).find("#input_submit_message");
    let submit_message = $(element).find("#submit_message");
    let input_display_message = $(element).find("#input_display_message");
    let display_message = $(element).find("#display_message");
    let input_no_answer_message = $(element).find("#input_no_answer_message");
    let no_answer_message = $(element).find("#no_answer_message");
    let input_min_questions = $(element).find("#input_min_questions");
    let min_questions = $(element).find("#min_questions");
    let input_min_characters = $(element).find("#input_min_characters");
    let min_characters = $(element).find("#min_characters");
    let input_min_words = $(element).find("#input_min_words");
    let min_words = $(element).find("#min_words");
    let input_enable_download = $(element).find("#input_enable_download");
    let enable_download = $(element).find("#enable_download");
    
    var content_ui;
    let content_backend  = settings.content

    function validateContent(content) {
        let error_msg = "";
        let questions = [];
        let answers = [];
        for (let i = 1; i <= content["n_rows"]; i++) {
            let input_content_row = $(element).find("#input_content_row_" + i);
            let input_content_cells = input_content_row.find(".iterative-content-studio-input");
            for (let j = 0; j < content[i.toString()]["n_cells"]; j++) {
                let cell = input_content_cells.eq(j);
                let cell_type = cell.find(".iterative-content-type").val();
                let cell_input = cell.find("input");
                if (cell_type === "text") {
                    if (cell_input.val().length > 1000) {
                        error_msg = "Text must be less than 1000 characters for the cell at row " + i + " and cell " + (j + 1) + ".";
                        break;
                    }
                } else if (cell_type === "question") {
                    if (cell_input.val() === "") {
                        error_msg = "Please provide a question ID for the cell at row " + i + " and cell " + (j + 1) + ".";
                        break;
                    }
                    if (cell_input.val().length > 30 || cell_input.val().length < 3 || !cell_input.val().match(/^[a-zA-Z0-9_]+$/)) {
                        error_msg = "Question ID must be between 3 and 30 characters and can only contain letters, numbers, and underscores for the cell at row " + i + " and cell " + (j + 1) + ".";
                        break;
                    }
                    if (questions.includes(cell_input.val())) {
                        error_msg = "Question ID " + cell_input.val() + " is already used to define another question.";
                        break;
                    }
                    questions.push(cell_input.val());
                } else if (cell_type === "answer") {
                    if (cell_input.val().length > 30 || cell_input.val().length < 3 || !cell_input.val().match(/^[a-zA-Z0-9_]+$/)) {
                        error_msg = "Question ID must be between 3 and 30 characters and can only contain letters, numbers, and underscores for the cell at row " + i + " and cell " + (j + 1) + ".";
                        break;
                    }
                    answers.push(cell_input.val());
                } else {
                    error_msg = "Please select a type for the content at row " + i + " and cell " + (j + 1) + ".";
                    break;
                }
            }
            if (error_msg !== "") {
                break;
            }
        }
        for(let q of questions) {
            if (answers.includes(q)) {
                error_msg = "You cannot get the answer from a question defined at the same Iterative XBlock (" + q + ").";
                break;
            }
        }
        return error_msg;
    }

    function validate(data) {
        let questionIds = getQuestionIDs(data["content"]);
        let answerIds = getAnswerIDs(data["content"]);
        if (data["title"].length > 200) {
            return "Title must be less than 100 characters."
        }
        if (data["style"] == null) {
            return "Please select a style."
        }
        if (questionIds.length !== 0) {
            if (data["submit_message"] === "") {
                return "Please provide a message for the submit button."
            }
            if (data["submit_message"].length > 30) {
                return "Submit message must be less than 30 characters."
            }
            if (data["min_questions"] === "") {
                return "Please provide a minimum number of questions to be answered."
            }
            if (isNaN(data["min_questions"])) {
                return "Minimum number of questions must be a number."
            }
            if (data["min_questions"] > getQuestionIDs(data["content"]).length) {
                return "Minimum number of questions must be less than or equal to the number of questions defined."
            }
            if (parseInt(data["min_questions"]) < 0) {
                return "Minimum number of questions must be a positive number."
            }
            if (data["min_characters"] === "") {
                return "Please provide a minimum number of characters for the answer."
            }
            if (isNaN(data["min_characters"])) {
                return "Minimum number of characters must be a number."
            }
            if (parseInt(data["min_characters"]) < 0) {
                return "Minimum number of characters must be a positive number."
            }
            if (data["min_words"] === "") {
                return "Please provide a minimum number of words for the answer."
            }
            if (isNaN(data["min_words"])) {
                return "Minimum number of words must be a number."
            }
            if (parseInt(data["min_words"]) < 0) {
                return "Minimum number of words must be a positive number."
            }
        } else {
            if (data["enable_download"] == null) {
                return "Please select if you want to enable download of answers as a PDF file or not."
            }
        }
        if (answerIds.length !== 0) {
            if (data["display_message"] === "") {
                return "Please provide a message for the display button."
            }
            if (data["display_message"].length > 30) {
                return "Display message must be less than 30 characters."
            }
            if (data["no_answer_message"] === "") {
                return "Please provide a message for when there is no answer."
            }
            if (data["no_answer_message"].length > 100) {
                return "No answer message must be less than 100 characters."
            }
        }
        return validateContent(data["content"]);
    }

    function applyContent(content) {
        for (let i = 1; i <= content["n_rows"]; i++) {
            let input_content_row = $(element).find("#input_content_row_" + i);
            let input_content_cells = input_content_row.find(".iterative-content-studio-input");
            for (let j = 1; j <= content[i.toString()]["n_cells"]; j++) {
                let cell = input_content_cells.eq(j-1);
                let cell_type = cell.find(".iterative-content-type");
                let cell_input = cell.find("input");
                let cell_text_left = cell.find(".fa-align-left");
                let cell_text_center = cell.find(".fa-align-center");
                let cell_text_right = cell.find(".fa-align-right");
                let cell_text_justify = cell.find(".fa-align-justify");
                let cell_text_bold = cell.find(".fa-bold");
                let cell_text_italic = cell.find(".fa-italic");
                let cell_text_underline = cell.find(".fa-underline");
                let cell_text_strikethrough = cell.find(".fa-strikethrough");                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                cell_type.val(content[i.toString()][j.toString()]["type"]);
                cell_input.val(content[i.toString()][j.toString()]["content"]);
                if(content[i.toString()][j.toString()]["alignment"] === "left") {
                    cell_text_left.addClass("icon-chosen");
                    cell_text_center.removeClass("icon-chosen");
                    cell_text_right.removeClass("icon-chosen");
                    cell_text_justify.removeClass("icon-chosen");
                } else if(content[i.toString()][j.toString()]["alignment"] === "center") {
                    cell_text_left.removeClass("icon-chosen");
                    cell_text_center.addClass("icon-chosen");
                    cell_text_right.removeClass("icon-chosen");
                    cell_text_justify.removeClass("icon-chosen");
                } else if(content[i.toString()][j.toString()]["alignment"] === "right") {
                    cell_text_left.removeClass("icon-chosen");
                    cell_text_center.removeClass("icon-chosen");
                    cell_text_right.addClass("icon-chosen");
                    cell_text_justify.removeClass("icon-chosen");
                } else {
                    cell_text_left.removeClass("icon-chosen");
                    cell_text_center.removeClass("icon-chosen");
                    cell_text_right.removeClass("icon-chosen");
                    cell_text_justify.addClass("icon-chosen");
                }
                if(content[i.toString()][j.toString()]["bold"]) {
                    cell_text_bold.addClass("icon-chosen");
                } else {
                    cell_text_bold.removeClass("icon-chosen");
                }
                if(content[i.toString()][j.toString()]["italic"]) {
                    cell_text_italic.addClass("icon-chosen");
                } else {
                    cell_text_italic.removeClass("icon-chosen");
                }
                if(content[i.toString()][j.toString()]["underline"]) {
                    cell_text_underline.addClass("icon-chosen");
                } else {
                    cell_text_underline.removeClass("icon-chosen");
                }
                if(content[i.toString()][j.toString()]["strikethrough"]) {
                    cell_text_strikethrough.addClass("icon-chosen");
                } else {
                    cell_text_strikethrough.removeClass("icon-chosen");
                }
                if (content[i.toString()][j.toString()]["type"] === "text") {
                    cell_input.attr("placeholder", "Enter text here").removeAttr("disabled");
                } else if (content[i.toString()][j.toString()]["type"] === "question") {
                    cell_input.attr("placeholder", "Question ID").removeAttr("disabled");
                } else if (content[i.toString()][j.toString()]["type"] === "answer") {
                    cell_input.attr("placeholder", "Question ID").removeAttr("disabled");
                } else {
                    cell_input.attr("placeholder", "Please select an option...").attr("disabled", true);
                }
                cell.removeAttr("hidden");
            }
            input_content_row.removeAttr("hidden");
        }
        content_ui = JSON.parse(JSON.stringify(content));
        handleConditionalInputs();
    }

    function handleIcons(row, cell, icon) {
        let container = $(element).find(".content_" + row + "_" + cell);
        console.log(row)
        console.log(cell)
        console.log(icon)
        if (icon === "align-left") {
            $(container).find(".fa-align-left").addClass("icon-chosen");
            $(container).find(".fa-align-center").removeClass("icon-chosen");
            $(container).find(".fa-align-right").removeClass("icon-chosen");
            $(container).find(".fa-align-justify").removeClass("icon-chosen");
        } else if (icon === "align-center") {
            $(container).find(".fa-align-left").removeClass("icon-chosen");
            $(container).find(".fa-align-center").addClass("icon-chosen");
            $(container).find(".fa-align-right").removeClass("icon-chosen");
            $(container).find(".fa-align-justify").removeClass("icon-chosen");
        } else if (icon === "align-right") {
            $(container).find(".fa-align-left").removeClass("icon-chosen");
            $(container).find(".fa-align-center").removeClass("icon-chosen");
            $(container).find(".fa-align-right").addClass("icon-chosen");
            $(container).find(".fa-align-justify").removeClass("icon-chosen");
        } else if (icon === "align-justify") {
            $(container).find(".fa-align-left").removeClass("icon-chosen");
            $(container).find(".fa-align-center").removeClass("icon-chosen");
            $(container).find(".fa-align-right").removeClass("icon-chosen");
            $(container).find(".fa-align-justify").addClass("icon-chosen");
        } else {
            if ($(container).find(".fa-" + icon).hasClass("icon-chosen")) {
                $(container).find(".fa-" + icon).removeClass("icon-chosen");
            } else {
                $(container).find(".fa-" + icon).addClass("icon-chosen");
            
            }
        }
    }

    function getAnswerIDs(content) {
        let answerIds = [];
        for (let i = 1; i <= content["n_rows"]; i++) {
            for (let j = 1; j <= content[i.toString()]["n_cells"]; j++) {
                let cell = content[i.toString()][j.toString()];
                if (cell["type"] === "answer") {
                    answerIds.push(cell["content"]);
                }
            }
        }
        return answerIds;
    }

    function getQuestionIDs(content) {
        let questionIds = [];
        for (let i = 1; i <= content["n_rows"]; i++) {
            for (let j = 1; j <= content[i.toString()]["n_cells"]; j++) {
                let cell = content[i.toString()][j.toString()];
                if (cell["type"] === "question") {
                    questionIds.push(cell["content"]);
                }
            }
        }
        return questionIds;
    }

    function addNewCell(row) {
        if(content_ui[row]["n_cells"] < 4) {
            let input_content_row = $(element).find("#input_content_row_" + row);
            let input_content_cells = input_content_row.find(".iterative-content-studio-input");
            let nth_element = content_ui[row]["n_cells"];
            input_content_cells.eq(nth_element).removeAttr("hidden");
            input_content_cells.eq(nth_element).find("input").val("");
            input_content_cells.eq(nth_element).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
            input_content_cells.eq(nth_element).find("select").val("none");
            let justifyIcon = input_content_cells.eq(nth_element).find(".fa-align-justify");
            justifyIcon.addClass("icon-chosen");
            content_ui[row]["n_cells"] += 1;
            content_ui[row][content_ui[row]["n_cells"].toString()] = {
                "type": "none",
                "content": "",
                "alignment": "justify",
                "bold": false,
                "italic": false,
                "underline": false,
                "strikethrough": false
            }
        } else {
            setStudioWarningMessage("Maximum number of cells per row is 4.")
            setTimeout(function() {
                setStudioWarningMessage("");
            }, 3000);
        }
    }
    
    function removeCell(row) {
        if(content_ui[row]["n_cells"] > 1) {
            let input_content_row = $(element).find("#input_content_row_" + row);
            let input_content_cells = input_content_row.find(".iterative-content-studio-input");
            let nth_element = content_ui[row]["n_cells"] - 1;
            input_content_cells.eq(nth_element).attr("hidden", true);
            input_content_cells.eq(nth_element).find("input").val("");
            input_content_cells.eq(nth_element).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
            input_content_cells.eq(nth_element).find("select").val("none");
            content_ui[row]["n_cells"] -= 1;
            delete content_ui[row][content_ui[row]["n_cells"].toString()];
        } else {
            removeRow(row);
        }
    }

    function addNewRow() {
        if(content_ui["n_rows"] < 9) {
            let nth_element = content_ui["n_rows"] + 1;
            let input_content_row = $(element).find("#input_content_row_" + nth_element);
            let input_content_cells = input_content_row.find(".iterative-content-studio-input");
            input_content_cells.eq(0).removeAttr("hidden");
            input_content_cells.eq(0).find("input").val("");
            input_content_cells.eq(0).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
            input_content_cells.eq(0).find("select").val("none");
            input_content_cells.eq(0).find(".fa-align-justify").addClass("icon-chosen");
            input_content_cells.eq(1).removeAttr("hidden");
            input_content_cells.eq(1).find("input").val("");
            input_content_cells.eq(1).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
            input_content_cells.eq(1).find("select").val("none");
            input_content_cells.eq(1).find(".fa-align-justify").addClass("icon-chosen");
            input_content_cells.eq(2).attr("hidden");
            input_content_cells.eq(2).find("input").val("");
            input_content_cells.eq(2).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
            input_content_cells.eq(2).find("select").val("none");
            input_content_cells.eq(2).find(".fa-align-justify").addClass("icon-chosen");
            input_content_cells.eq(3).attr("hidden");
            input_content_cells.eq(3).find("input").val("");
            input_content_cells.eq(3).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
            input_content_cells.eq(3).find("select").val("none");
            input_content_cells.eq(3).find(".fa-align-justify").addClass("icon-chosen");
            input_content_row.removeAttr("hidden");
            content_ui["n_rows"] += 1;
            content_ui[nth_element] = {
                "n_cells": 2,
                "1": {
                    "type": "none",
                    "content": "",
                    "alignment": "justify",
                    "bold": false,
                    "italic": false,
                    "underline": false,
                    "strikethrough": false
                },
                "2": {
                    "type": "none",
                    "content": "",
                    "alignment": "justify",
                    "bold": false,
                    "italic": false,
                    "underline": false,
                    "strikethrough": false
                },
            }
        } else {
            setStudioWarningMessage("Maximum number of rows is 9.")
            setTimeout(function() {
                setStudioWarningMessage("");
            }, 3000);
        }
    }

    function removeRow(row) {
        if (content_ui["n_rows"] > 1) {
            if (parseInt(row) === content_ui["n_rows"]) {
                let input_content_row = $(element).find("#input_content_row_" + row);
                let input_content_cells = input_content_row.find(".iterative-content-studio-input");
                for (let i = 0; i < 4; i++) {
                    input_content_cells.eq(i).find("input").val("");
                    input_content_cells.eq(i).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
                    input_content_cells.eq(i).find("select").val("none");
                    input_content_cells.eq(i).attr("hidden", true);
                }
                input_content_row.attr("hidden", true);
                delete content_ui[content_ui["n_rows"].toString()];
                content_ui["n_rows"] -= 1;
            } else {
                for (let i = parseInt(row)+1; i <= content_ui["n_rows"]; i++) {
                    let currentRow = $(element).find("#input_content_row_" + i);
                    let previousRow = $(element).find("#input_content_row_" + (i - 1));
                    let currentCells = currentRow.find(".iterative-content-studio-input");
                    let previousCells = previousRow.find(".iterative-content-studio-input");
                    for(let q = 0; q < 4; q++) {
                        var cellType = currentCells.eq(q).find("select").val()
                        if (cellType == null) {
                            cellType = "none";
                        }
                        if (cellType === "") {
                            cellType = "none";
                        }
                        previousCells.eq(q).find("select").val(cellType);
                        if (cellType === "text") {
                            previousCells.eq(q).find("input").attr("placeholder", "Enter text here").removeAttr("disabled");
                        } else if (cellType === "question") {
                            previousCells.eq(q).find("input").attr("placeholder", "Question ID").removeAttr("disabled");
                        } else if (cellType === "answer") {
                            previousCells.eq(q).find("input").attr("placeholder", "Question ID").removeAttr("disabled");
                        } else {
                            previousCells.eq(q).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
                        }
                        let cellValue = currentCells.eq(q).find("input").val();
                        previousCells.eq(q).find("input").val(cellValue);
                        let cellIcons = currentCells.eq(q).find("i");
                        let previousIcons = previousCells.eq(q).find("i");
                        var alignment = "justify";
                        var bold = false;
                        var italic = false;
                        var underline = false;
                        var strikethrough = false;
                        for (let k = 0; k < 8; k++) {
                            let icon = $(cellIcons[k]);
                            if (icon.hasClass("icon-chosen")) {
                                if (icon.hasClass("fa-align-left")) {
                                    alignment = "left";
                                } else if (icon.hasClass("fa-align-center")) {
                                    alignment = "center";
                                } else if (icon.hasClass("fa-align-right")) {
                                    alignment = "right";
                                } else if (icon.hasClass("fa-align-justify")) {
                                    alignment = "justify";
                                } else if (icon.hasClass("fa-bold")) {
                                    bold = true;
                                } else if (icon.hasClass("fa-italic")) {
                                    italic = true;
                                } else if (icon.hasClass("fa-underline")) {
                                    underline = true;
                                } else if (icon.hasClass("fa-strikethrough")) {
                                    strikethrough = true;
                                }
                            }
                        }
                        for (let k = 0; k < 8; k++) {
                            let icon = $(previousIcons[k]);
                            if (icon.hasClass("fa-align-left")) {
                                if (alignment === "left") {
                                    icon.addClass("icon-chosen");
                                } else {
                                    icon.removeClass("icon-chosen");
                                }
                            } else if (icon.hasClass("fa-align-center")) {
                                if (alignment === "center") {
                                    icon.addClass("icon-chosen");
                                } else {
                                    icon.removeClass("icon-chosen");
                                }
                            } else if (icon.hasClass("fa-align-right")) {
                                if (alignment === "right") {
                                    icon.addClass("icon-chosen");
                                } else {
                                    icon.removeClass("icon-chosen");
                                }
                            } else if (icon.hasClass("fa-align-justify")) {
                                if (alignment === "justify") {
                                    icon.addClass("icon-chosen");
                                } else {
                                    icon.removeClass("icon-chosen");
                                }
                            } else if (icon.hasClass("fa-bold")) {
                                if (bold) {
                                    icon.addClass("icon-chosen");
                                } else {
                                    icon.removeClass("icon-chosen");
                                }
                            } else if (icon.hasClass("fa-italic")) {
                                if (italic) {
                                    icon.addClass("icon-chosen");
                                } else {
                                    icon.removeClass("icon-chosen");
                                }
                            } else if (icon.hasClass("fa-underline")) {
                                if (underline) {
                                    icon.addClass("icon-chosen");
                                } else {
                                    icon.removeClass("icon-chosen");
                                }
                            } else if (icon.hasClass("fa-strikethrough")) {
                                if (strikethrough) {
                                    icon.addClass("icon-chosen");
                                } else {
                                    icon.removeClass("icon-chosen");
                                }
                            }
                        }
                        content_ui[(i-1).toString()][(q+1).toString()] = {
                            "type": cellType,
                            "content": cellValue,
                            "alignment": alignment,
                            "bold": bold,
                            "italic": italic,
                            "underline": underline,
                            "strikethrough": strikethrough
                        }
                        if (q < content_ui[i.toString()]["n_cells"]) {
                            previousCells.eq(q).removeAttr("hidden", true);
                        } else {
                            previousCells.eq(q).attr("hidden", true);
                        }
                    }
                    content_ui[(i-1).toString()]["n_cells"] = content_ui[i.toString()]["n_cells"];
                    if (i === content_ui["n_rows"]) {
                        for (let j = 0; j < 4; j++) {
                            currentCells.eq(j).find("input").val("");
                            currentCells.eq(j).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
                            currentCells.eq(j).find("select").val("none");
                            currentCells.eq(j).attr("hidden", true);
                        }
                        currentRow.attr("hidden", true);
                    }
                }
                delete content_ui[content_ui["n_rows"].toString()];
                content_ui["n_rows"] -= 1;
            }
        } else {
            setStudioWarningMessage("Minimum number of rows is 1.")
            setTimeout(function() {
                setStudioWarningMessage("");
            }, 3000);
        }
    }

    function makeContentUI() {
        let content = {
            "n_rows": content_ui["n_rows"]
        }
        for (let i = 1; i <= content_ui["n_rows"]; i++) {
            content[i.toString()] = {
                "n_cells": content_ui[i.toString()]["n_cells"]
            }
            for (let j = 1; j <= content_ui[i.toString()]["n_cells"]; j++) {
                let icons = $(element).find(".content_" + i + "_" + j).find("i");
                var alignment = "justify";
                var bold = false;
                var italic = false;
                var underline = false;
                var strikethrough = false;
                for (let k = 0; k < 8; k++) {
                    let icon = $(icons[k]);
                    if (icon.hasClass("icon-chosen")) {
                        if (icon.hasClass("fa-align-left")) {
                            alignment = "left";
                        } else if (icon.hasClass("fa-align-center")) {
                            alignment = "center";
                        } else if (icon.hasClass("fa-align-right")) {
                            alignment = "right";
                        } else if (icon.hasClass("fa-align-justify")) {
                            alignment = "justify";
                        } else if (icon.hasClass("fa-bold")) {
                            bold = true;
                        } else if (icon.hasClass("fa-italic")) {
                            italic = true;
                        } else if (icon.hasClass("fa-underline")) {
                            underline = true;
                        } else if (icon.hasClass("fa-strikethrough")) {
                            strikethrough = true;
                        }
                    }
                }
                content[i.toString()][j.toString()] = {
                    "type": $(element).find("#content_type_" + i + "_" + j).val(),
                    "content": $(element).find("#content_row_" + i + "_" + j).val(),
                    "alignment": alignment,
                    "bold": bold,
                    "italic": italic,
                    "underline": underline,
                    "strikethrough": strikethrough
                }
            }
        }
        return content;
    }

    function setStudioErrorMessage(msg) {
        $(element).find('.studio-error-msg').html(msg);
    }

    function setStudioWarningMessage(msg) {
        $(element).find('.studio-warning-msg').html(msg);
    }

    function handleConditionalInputs() {
        let content_ui = makeContentUI();
        let questionIds = getQuestionIDs(content_ui);
        if (questionIds.length > 0) {
            enable_download.val("no");
            input_enable_download.slideUp();
            min_questions.val(settings.min_questions);
            input_min_questions.slideDown();
            min_characters.val(settings.min_characters);
            input_min_characters.slideDown();
            min_words.val(settings.min_words);
            input_min_words.slideDown();
            no_answer_message.val(settings.no_answer_message);
            input_no_answer_message.slideDown();
            submit_message.val(settings.submit_message);
            input_submit_message.slideDown();
        } else {
            enable_download.val(settings.enable_download ? "yes" : "no");
            input_enable_download.slideDown();
            min_questions.val(0);
            min_questions.attr("min", '0');
            min_questions.attr("max", questionIds.length.toString());
            input_min_questions.slideUp();
            min_characters.val(0);
            input_min_characters.slideUp();
            min_words.val(0);
            input_min_words.slideUp();
            input_no_answer_message.slideUp();
            input_submit_message.slideUp();
        }
        let answerIds = getAnswerIDs(content_ui);
        if (answerIds.length > 0) {
            display_message.val(settings.display_message);
            input_display_message.slideDown();
            no_answer_message.val(settings.no_answer_message);
            input_no_answer_message.slideDown();
        } else {
            display_message.val("");
            input_display_message.slideUp();
            no_answer_message.val("");
            input_no_answer_message.slideUp();
        }
    }

    $(element).find(".iterative-content-type").bind('change', function (eventObject) {
        eventObject.preventDefault();
        let row = $(this).attr("id").split("_")[2];
        let cell = $(this).attr("id").split("_")[3];
        let value = $(this).val();
        let input = $(element).find("#content_row_" + row + "_" + cell);
        if (value === "text") {
            input.attr("placeholder", "Enter text here").removeAttr("disabled");
        } else if (value === "question") {
            input.attr("placeholder", "Question ID").removeAttr("disabled");
        } else if (value === "answer") {
            input.attr("placeholder", "Question ID").removeAttr("disabled");
        } else {
            input.attr("placeholder", "Please select an option...").attr("disabled", true);
        }
        handleConditionalInputs();
    });

    $(element).find(".content-cell-new").bind('click', function (eventObject) {
        eventObject.preventDefault();
        let row = $(this).attr("id").split("_")[2];
        addNewCell(row);
    });

    $(element).find(".content-cell-delete").bind('click', function (eventObject) {
        eventObject.preventDefault();
        let row = $(this).attr("id").split("_")[2];
        removeCell(row);
    });

    $(element).find(".new-row-button").bind('click', function (eventObject) {
        eventObject.preventDefault();
        addNewRow();
    });

    $(element).find(".content-row-delete").bind('click', function (eventObject) {
        eventObject.preventDefault();
        let row = $(this).attr("id").split("_")[2];
        removeRow(row);
    });


    $(element).find('.save-button').bind('click', function (eventObject) {
        eventObject.preventDefault();
        setStudioErrorMessage("");
        content_ui = makeContentUI();
        var handlerUrl = runtime.handlerUrl(element, 'studio_submit');
        var checkQuestionIDsUrl = runtime.handlerUrl(element, 'check_question_ids');
        var original_questions = getQuestionIDs(content_backend)
        var newQuestions = getQuestionIDs(content_ui).filter(function(questionId) {
            return !original_questions.includes(questionId);
        });
        var removedQuestions = original_questions.filter(function(questionId) {
            return !getQuestionIDs(content_ui).includes(questionId);
        });
        var data = {
            title: title.val(),
            style: style.val(),
            content: content_ui,
            submit_message: submit_message.val(),
            display_message: display_message.val(),
            no_answer_message: no_answer_message.val(),
            min_questions: min_questions.val(),
            min_characters: min_characters.val(),
            min_words: min_words.val(),
            enable_download: enable_download.val(),
            new_questions: newQuestions,
            removed_questions: removedQuestions
        };
        var error_msg = validate(data);
        if (error_msg !== "") {
            setStudioErrorMessage(error_msg);
        } else {
            $.post(checkQuestionIDsUrl, JSON.stringify(newQuestions)).done(function (response) {
                if(response["result"] === "failed") {
                    setStudioErrorMessage("The following new questions IDs already exist at another Iterative XBlock: " + response["question_ids"].join(", "));
                } else {
                    if ($.isFunction(runtime.notify)) {
                        runtime.notify('save', { state: 'start' });
                    }
                    $.post(handlerUrl, JSON.stringify(data)).done(function (response) {
                        if ($.isFunction(runtime.notify)) {
                            runtime.notify('save', { state: 'end' });
                        }
                    });
                }
            });
        }
    });

    $(element).find('i').bind('click', function (eventObject) {
        eventObject.preventDefault();
        let icon = $(this).attr("class").split(" ")[1].split("fa-")[1];
        let row = $(this).parent().parent().attr("class").split(" ")[1].split("_")[1];
        let cell = $(this).parent().parent().attr("class").split(" ")[1].split("_")[2];
        handleIcons(row, cell, icon);
    });

    $(element).find('.cancel-button').bind('click', function (eventObject) {
        eventObject.preventDefault();
        runtime.notify('cancel', {});
    });
    
    function onLoad() {
        input_title.removeAttr("hidden");
        input_style.removeAttr("hidden");
        input_submit_message.removeAttr("hidden");
        input_display_message.removeAttr("hidden");
        input_no_answer_message.removeAttr("hidden");
        input_min_questions.removeAttr("hidden");
        input_min_characters.removeAttr("hidden");
        input_min_words.removeAttr("hidden");
        title.val(settings.title);
        style.val(settings.style);
        submit_message.val(settings.submit_message);
        display_message.val(settings.display_message);
        no_answer_message.val(settings.no_answer_message);
        min_questions.val(settings.min_questions);
        min_characters.val(settings.min_characters);
        min_words.val(settings.min_words);

        applyContent(content_backend);
    }
    onLoad();
}