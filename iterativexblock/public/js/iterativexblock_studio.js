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
        if (data["displayed_message"] === "") {
            return "Please provide a message for the display button when the answer is displayed."
        }
        if (data["displayed_message"].length > 100) {
            return "Displayed message must be less than 100 characters."
        }
        if (data["no_answer_message"] === "") {
            return "Please provide a message for when there is no answer."
        }
        if (data["no_answer_message"].length > 100) {
            return "No answer message must be less than 100 characters."
        }
        if (data["enable_downloads"] == null) {
            return "Please select if you want to enable download of answers as a PDF file or not."
        }
        return "";
    }

    function showStudioErrorMessage(msg) {
        $(element).find('.studio-error-msg').html(msg);
    }


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