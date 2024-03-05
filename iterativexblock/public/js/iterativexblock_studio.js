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
        return "";
    }

    function getContentData() {

    }

    function showStudioErrorMessage(msg) {
        $(element).find('.studio-error-msg').html(msg);
    }

    function addNewCell(row) {
        if(content_format[row.toString()]["visible"] === true) {
            if(content_format[row.toString()]["n_cells"] < 4) {
                let input_content_row = $(element).find("#input_content_row_" + row);
                let input_content_cells = input_content_row.find(".iterative-content-studio-input");
                let nth_element = content_format[row.toString()]["n_cells"];
                input_content_cells.eq(nth_element).removeAttr("hidden");
                input_content_cells.eq(nth_element).find("input").val("");
                input_content_cells.eq(nth_element).find("select").val("none");
                content_format[row.toString()]["n_cells"] += 1;
            } else {
                console.log("Too many cells!")
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
                input_content_cells.eq(nth_element).find("select").val("none");
                content_format[row.toString()]["n_cells"] -= 1;
            } else {
                console.log("Too few cells!")
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
            input_content_cells.eq(0).find("select").val("none");
            input_content_cells.eq(1).removeAttr("hidden");
            input_content_cells.eq(1).find("input").val("");
            input_content_cells.eq(1).find("select").val("none");
            input_content_cells.eq(2).attr("hidden");
            input_content_cells.eq(2).find("input").val("");
            input_content_cells.eq(2).find("select").val("none");
            input_content_cells.eq(3).attr("hidden");
            input_content_cells.eq(3).find("input").val("");
            input_content_cells.eq(3).find("select").val("none");
            input_content_row.removeAttr("hidden");
            content_format["n_rows"] += 1;
        } else {
            console.log("Too many rows!")
        }
    }

    function removeRow(row) {
        if (content_format[row.toString()]["n_rows"] > 1) {
            if (row === content_format["n_rows"]) {
                let input_content_row = $(element).find("#input_content_row_" + row);
                let input_content_cells = input_content_row.find(".iterative-content-studio-input");
                input_content_cells.eq(0).find("input").val("");
                input_content_cells.eq(0).find("select").val("none");
                input_content_cells.eq(0).attr("hidden", true);
                input_content_cells.eq(1).find("input").val("");
                input_content_cells.eq(1).find("select").val("none");
                input_content_cells.eq(1).attr("hidden", true);
                input_content_cells.eq(2).find("input").val("");
                input_content_cells.eq(2).find("select").val("none");
                input_content_cells.eq(2).attr("hidden", true);
                input_content_cells.eq(3).find("input").val("");
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
                        currentCells.eq(0).find("select").val("none");
                        currentCells.eq(0).attr("hidden", true);
                        currentCells.eq(1).find("input").val("");
                        currentCells.eq(1).find("select").val("none");
                        currentCells.eq(1).attr("hidden", true);
                        currentCells.eq(2).find("input").val("");
                        currentCells.eq(2).find("select").val("none");
                        currentCells.eq(2).attr("hidden", true);
                        currentCells.eq(3).find("input").val("");
                        currentCells.eq(3).find("select").val("none");
                        currentCells.eq(3).attr("hidden", true);
                        currentRow.attr("hidden", true);
                        content_format["n_rows"] -= 1;
                    }
                }
            }
        } else {
            console.log("Too few rows!")
        }
    }

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
        showStudioErrorMessage("");
        var handlerUrl = runtime.handlerUrl(element, 'studio_submit');
        var data = {
            title: title.val(),
            style: style.val(),
            content: {
                "1.1": {
                    "id_question": "example",
                    "type": "question",
                }
            },
            submit_message: submit_message.val(),
            submitted_message: submitted_message.val(),
            display_message: display_message.val(),
            displayed_message: displayed_message.val(),
            no_answer_message: no_answer_message.val(),
            enable_downloads: enable_downloads.val()
        };
        var error_msg = validate(data);
        if (error_msg !== "") {
            showStudioErrorMessage(error_msg);
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
        input_displayed_message.removeAttr("hidden");
        input_no_answer_message.removeAttr("hidden");
        input_enable_downloads.removeAttr("hidden");
        title.val("Iterative XBlock");
    }
    onLoad();
}