function IterativeXBlockStudio(runtime, element, settings) {
    let input_title = $(element).find("#input_title");
    let title = $(element).find("#title");
    let input_style = $(element).find("#input_style");
    let style = $(element).find("#style");
    let input_submit_message = $(element).find("#input_submit_message");
    let submit_message = $(element).find("#submit_message");
    let input_submitted_message = $(element).find("#input_submitted_message");
    let submitted_message = $(element).find("#submitted_message");
    let input_display_message = $(element).find("#input_display_message");
    let display_message = $(element).find("#display_message");
    let input_displayed_message = $(element).find("#input_displayed_message");
    let displayed_message = $(element).find("#displayed_message");
    let input_no_answer_message = $(element).find("#input_no_answer_message");
    let no_answer_message = $(element).find("#no_answer_message");
    let input_enable_downloads = $(element).find("#input_enable_downloads");
    let enable_downloads = $(element).find("#enable_downloads");
    
    var content_format =  settings.content_format;
    let original_questions = settings.original_questions;

    function validateContent() {
        let error_msg = "";
        for (let i = 0; i < content_format["n_rows"]; i++) {
            let input_content_row = $(element).find("#input_content_row_" + i);
            let input_content_cells = input_content_row.find(".iterative-content-studio-input");
            for (let j = 0; j < content_format[i.toString()]["n_cells"]; j++) {
                let cell = input_content_cells.eq(j);
                let cell_type = cell.find(".iterative-content-type").val();
                let cell_input = cell.find("input");
                if (cell_type === "text") {
                    if (cell_input.val().length > 1000) {
                        error_msg = "Text must be less than 1000 characters for the cell at row " + (i + 1) + " and cell " + (j + 1) + ".";
                        break;
                    }
                } else if (cell_type === "question") {
                    if (cell_input.val() === "") {
                        error_msg = "Please provide a question ID for the cell at row " + (i + 1) + " and cell " + (j + 1) + ".";
                        break;
                    }
                    if (cell_input.val().length > 30 || cell_input.val().length < 3 || !cell_input.val().match(/^[a-zA-Z0-9_]+$/)) {
                        error_msg = "Question ID must be between 3 and 30 characters and can only contain letters, numbers, and underscores for the cell at row " + (i + 1) + " and cell " + (j + 1) + ".";
                        break;
                    }
                } else if (cell_type === "answer") {
                    if (cell_input.val().length > 30 || cell_input.val().length < 3 || !cell_input.val().match(/^[a-zA-Z0-9_]+$/)) {
                        error_msg = "Question ID must be between 3 and 30 characters and can only contain letters, numbers, and underscores for the cell at row " + (i + 1) + " and cell " + (j + 1) + ".";
                        break;
                    }
                    let questionIds = [];
                    for (let k = 0; k < content_format["n_rows"]; k++) {
                        let questionCell = $(element).find("#input_content_row_" + k).find(".iterative-content-studio-input").eq(j);
                        if (questionCell.find(".iterative-content-type").val() === "question") {
                            questionIds.push(questionCell.find("input").val());
                        }
                    }
                    if (questionIds.includes(cell_input.val())) {
                        error_msg = "You cannot get the answer from a question defined at the same Iterative XBlock. Please provide a question ID for the cell at row " + (i + 1) + " and cell " + (j + 1) + " from a different Iterative XBlock.";
                        break;
                    }
                } else {
                    error_msg = "Please select a type for the cell at row " + (i + 1) + " and cell " + (j + 1) + ".";
                    break;
                }
            }
            if (error_msg !== "") {
                break;
            }
        }
        return error_msg;
    }

    function validate(data) {
        if (data["title"] === "") {
            return "Please provide a title for this XBlock."
        }
        if (data["title"].length > 100) {
            return "Title must be less than 100 characters."
        }
        if (data["style"] == null) {
            return "Please select a style."
        }
        if (data["submit_message"] === "") {
            return "Please provide a message for the submit button."
        }
        if (data["submit_message"].length > 100) {
            return "Submit message must be less than 100 characters."
        }
        if (data["submitted_message"] === "") {
            return "Please provide a message for the submit button when the answer is submitted."
        }
        if (data["submitted_message"].length > 100) {
            return "Submitted message must be less than 100 characters."
        }
        if (data["display_message"] === "") {
            return "Please provide a message for the display button."
        }
        if (data["display_message"].length > 100) {
            return "Display message must be less than 100 characters."
        }
        // if (data["displayed_message"] === "") {
        //     return "Please provide a message for the display button when the answer is displayed."
        // }
        // if (data["displayed_message"].length > 100) {
        //     return "Displayed message must be less than 100 characters."
        // }
        if (data["no_answer_message"] === "") {
            return "Please provide a message for when there is no answer."
        }
        if (data["no_answer_message"].length > 100) {
            return "No answer message must be less than 100 characters."
        }
        // if (data["enable_downloads"] == null) {
        //     return "Please select if you want to enable download of answers as a PDF file or not."
        // }
        return validateContent();
    }

    function applyContent() {

    }

    function getContentData() {
        let content = content_format;
        for (let i = 0; i < content["n_rows"]; i++) {
            let input_content_row = $(element).find("#input_content_row_" + i);
            let input_content_cells = input_content_row.find(".iterative-content-studio-input");
            for (let j = 0; j < content[i.toString()]["n_cells"]; j++) {
                let cell = input_content_cells.eq(j);
                content[i.toString()][j.toString()] = {
                    "type": cell.find("select").val(),
                    "content": cell.find("input").val()
                }
            }
        }
        return content;
    }

    function getQuestionIDs() {
        let questionIds = [];
        $(element).find(".iterative-content-studio-input").each(function() {
            let cellType = $(this).find(".iterative-content-type").val();
            if (cellType === "question") {
                let questionId = $(this).find("input").val();
                questionIds.push(questionId);
            }
        });
        return questionIds;
    }

    function setStudioErrorMessage(msg) {
        $(element).find('.studio-error-msg').html(msg);
    }

    function setStudioWarningMessage(msg) {
        $(element).find('.studio-warning-msg').html(msg);
    }

    function addNewCell(row) {
        if(content_format[row.toString()]["visible"] === true) {
            if(content_format[row.toString()]["n_cells"] < 4) {
                let input_content_row = $(element).find("#input_content_row_" + row);
                let input_content_cells = input_content_row.find(".iterative-content-studio-input");
                let nth_element = content_format[row.toString()]["n_cells"];
                input_content_cells.eq(nth_element).removeAttr("hidden");
                input_content_cells.eq(nth_element).find("input").val("");
                input_content_cells.eq(nth_element).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
                input_content_cells.eq(nth_element).find("select").val("none");
                content_format[row.toString()]["n_cells"] += 1;
            } else {
                setStudioWarningMessage("Maximum number of cells per row is 4.")
                setTimeout(function() {
                    setStudioWarningMessage("");
                }, 3000);
            }
        }
    }
    
    function removeCell(row) {
        if(content_format[row.toString()]["visible"] === true) {
            if(content_format[row.toString()]["n_cells"] > 1) {
                let input_content_row = $(element).find("#input_content_row_" + row);
                let input_content_cells = input_content_row.find(".iterative-content-studio-input");
                let nth_element = content_format[row.toString()]["n_cells"] - 1;
                input_content_cells.eq(nth_element).attr("hidden", true);
                input_content_cells.eq(nth_element).find("input").val("");
                input_content_cells.eq(nth_element).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
                input_content_cells.eq(nth_element).find("select").val("none");
                content_format[row.toString()]["n_cells"] -= 1;
            } else {
                setStudioWarningMessage("Minimum number of cells per row is 1.")
                setTimeout(function() {
                    setStudioWarningMessage("");
                }, 3000);
            }
        }
    }

    function addNewRow() {
        if(content_format["n_rows"] < 9) {
            let nth_element = content_format["n_rows"];
            let input_content_row = $(element).find("#input_content_row_" + nth_element);
            let input_content_cells = input_content_row.find(".iterative-content-studio-input");
            input_content_cells.eq(0).removeAttr("hidden");
            input_content_cells.eq(0).find("input").val("");
            input_content_cells.eq(0).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
            input_content_cells.eq(0).find("select").val("none");
            input_content_cells.eq(1).removeAttr("hidden");
            input_content_cells.eq(1).find("input").val("");
            input_content_cells.eq(1).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
            input_content_cells.eq(1).find("select").val("none");
            input_content_cells.eq(2).attr("hidden");
            input_content_cells.eq(2).find("input").val("");
            input_content_cells.eq(2).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
            input_content_cells.eq(2).find("select").val("none");
            input_content_cells.eq(3).attr("hidden");
            input_content_cells.eq(3).find("input").val("");
            input_content_cells.eq(3).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
            input_content_cells.eq(3).find("select").val("none");
            input_content_row.removeAttr("hidden");
            content_format["n_rows"] += 1;
        } else {
            setStudioWarningMessage("Maximum number of rows is 9.")
            setTimeout(function() {
                setStudioWarningMessage("");
            }, 3000);
        }
    }

    function removeRow(row) {
        if (content_format[row.toString()]["n_rows"] > 1) {
            if (row === content_format["n_rows"]) {
                let input_content_row = $(element).find("#input_content_row_" + row);
                let input_content_cells = input_content_row.find(".iterative-content-studio-input");
                input_content_cells.eq(0).find("input").val("");
                input_content_cells.eq(0).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
                input_content_cells.eq(0).find("select").val("none");
                input_content_cells.eq(0).attr("hidden", true);
                input_content_cells.eq(1).find("input").val("");
                input_content_cells.eq(1).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
                input_content_cells.eq(1).find("select").val("none");
                input_content_cells.eq(1).attr("hidden", true);
                input_content_cells.eq(2).find("input").val("");
                input_content_cells.eq(2).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
                input_content_cells.eq(2).find("select").val("none");
                input_content_cells.eq(2).attr("hidden", true);
                input_content_cells.eq(3).find("input").val("");
                input_content_cells.eq(3).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
                input_content_cells.eq(3).find("select").val("none");
                input_content_cells.eq(3).attr("hidden", true);
                input_content_row.attr("hidden", true);
                content_format["n_rows"] -= 1;
            } else {
                for (let i = row + 1; i <= content_format["n_rows"]; i++) {
                    let currentRow = $(element).find("#input_content_row_" + i);
                    let previousRow = $(element).find("#input_content_row_" + (i - 1));
                    let currentCells = currentRow.find(".iterative-content-studio-input");
                    let previousCells = previousRow.find(".iterative-content-studio-input");
                    previousCells.eq(0).find("input").val(currentCells.eq(0).find("input").val());
                    previousCells.eq(0).find("select").val(currentCells.eq(0).find("select").val());
                    previousCells.eq(1).find("input").val(currentCells.eq(1).find("input").val());
                    previousCells.eq(1).find("select").val(currentCells.eq(1).find("select").val());
                    previousCells.eq(2).find("input").val(currentCells.eq(2).find("input").val());
                    previousCells.eq(2).find("select").val(currentCells.eq(2).find("select").val());
                    previousCells.eq(3).find("input").val(currentCells.eq(3).find("input").val());
                    previousCells.eq(3).find("select").val(currentCells.eq(3).find("select").val());
                    if (i === content_format["n_rows"]) {
                        currentCells.eq(0).find("input").val("");
                        currentCells.eq(0).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
                        currentCells.eq(0).find("select").val("none");
                        currentCells.eq(0).attr("hidden", true);
                        currentCells.eq(1).find("input").val("");
                        currentCells.eq(1).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
                        currentCells.eq(1).find("select").val("none");
                        currentCells.eq(1).attr("hidden", true);
                        currentCells.eq(2).find("input").val("");
                        currentCells.eq(2).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
                        currentCells.eq(2).find("select").val("none");
                        currentCells.eq(2).attr("hidden", true);
                        currentCells.eq(3).find("input").val("");
                        currentCells.eq(3).find("input").attr("placeholder", "Please select an option...").attr("disabled", true);
                        currentCells.eq(3).find("select").val("none");
                        currentCells.eq(3).attr("hidden", true);
                        currentRow.attr("hidden", true);
                        content_format["n_rows"] -= 1;
                    }
                }
            }
        } else {
            setStudioWarningMessage("Minimum number of rows is 1.")
            setTimeout(function() {
                setStudioWarningMessage("");
            }, 3000);
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
        var handlerUrl = runtime.handlerUrl(element, 'studio_submit');
        var checkQuestionIDsUrl = runtime.handlerUrl(element, 'check_question_ids');
        var newQuestions = getQuestionIDs().filter(function(questionId) {
            return !original_questions.includes(questionId);
        });

        var removedQuestions = original_questions.filter(function(questionId) {
            return !getQuestionIDs().includes(questionId);
        });
        var data = {
            title: title.val(),
            style: style.val(),
            content: getContentData(),
            content_format: content_format,
            submit_message: submit_message.val(),
            submitted_message: submitted_message.val(),
            display_message: display_message.val(),
            //displayed_message: displayed_message.val(),
            no_answer_message: no_answer_message.val(),
            //enable_downloads: enable_downloads.val(),
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

    $(element).find('.cancel-button').bind('click', function (eventObject) {
        eventObject.preventDefault();
        runtime.notify('cancel', {});
    });

    function onLoad() {
        input_title.removeAttr("hidden");
        input_style.removeAttr("hidden");
        input_submit_message.removeAttr("hidden");
        input_submitted_message.removeAttr("hidden");
        input_display_message.removeAttr("hidden");
        //input_displayed_message.removeAttr("hidden");
        input_no_answer_message.removeAttr("hidden");
        //input_enable_downloads.removeAttr("hidden");
        title.val(settings.title);
        style.val(settings.style);
        submit_message.val(settings.submit_message);
        submitted_message.val(settings.submitted_message);
        display_message.val(settings.display_message);
        //displayed_message.val(settings.displayed_message);
        no_answer_message.val(settings.no_answer_message);
        //enable_downloads.val(settings.enable_downloads);
        applyContent(settings.content);
    }
    onLoad();
}