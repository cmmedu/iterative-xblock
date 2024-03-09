function IterativeXBlockStudent(runtime, element, settings) {

    let buttonSubmit = $(element).find(".iterative-xblock-submit");
    let submitUrl = runtime.handlerUrl(element, 'student_submit');
    let displayUrl = runtime.handlerUrl(element, 'fetch_previous_submission');
    let min_questions = settings.min_questions;

    function showErrorMessage(msg) {
        $(element).find('#iterative-xblock-student-error-msg').html(msg);
    }

    function makeSubmissionData() {
        let data = {};
        $(element).find(".iterative-xblock-student-question").each(function (index, element) {
            let key = $(this).attr("id").split("iterative-xblock-student-question-")[1];
            let value = $(this).val();
            data[key] = value;
        });
        return data;
    }

    function validate(data) {
        let error_msg = "";
        let count = 0;
        for (let key in data) {
            if (data[key].length > 10000) {
                error_msg = "The answer is too long. Please keep it under 10000 characters.";
                break;
            }
            if (data[key].length > 0){ 
                count++;
            }
        }
        if (count < min_questions) {
            error_msg = "Please answer at least " + min_questions + " questions.";
        }
        return error_msg;
    }

    function afterSubmission(result) {
        buttonSubmit.attr("disabled", true);
        if (result["result"] === "repeated"){
            showErrorMessage("Ya se encuentra registrada una respuesta. Por favor, actualice la página.");
            buttonSubmit.removeAttr("disabled");
        } else if (result["result"] === "success") {
            $(element).find(".iterative-xblock-student-question").attr("disabled", true);
            buttonSubmit.html("<span>" + settings.submitted_message + "</span>");
            buttonSubmit.attr("disabled", true);
        } else {
            showErrorMessage("Algo salió mal.");
            buttonSubmit.removeAttr("disabled");
        }
    }

    buttonSubmit.click(function (e) {
        e.preventDefault();
        showErrorMessage("");
        if (!busyValidating){
            if ($.isFunction(runtime.notify)) {
                runtime.notify('submit', {
                    message: 'Submitting...',
                    state: 'start'
                });
            }
        }
        var busyValidating = true;
        var data = makeSubmissionData();
        let error_msg = validate(data);
        if (error_msg !== "") {
            showErrorMessage(error_msg);
        } else {
            $.ajax({
                type: "POST",
                url: submitUrl,
                data: JSON.stringify(data),
                success: afterSubmission
            });
            if ($.isFunction(runtime.notify)) {
                runtime.notify('submit', {
                    state: 'end'
                });
            }
        }
    });


    // function afterDisplay(result) {
    //     let displayButton = $(element).find(`#${settings.location}-display-button`).eq(0);
    //     displayButton.remove();
    //     let displayButtonArea = $(element).find(`#${settings.location}-display-button-div`).eq(0);
    //     displayButtonArea.attr("hidden", true);
    //     let area = $(element).find(`#${settings.location}-submission-previous`).eq(0);
    //     var submission_previous;
    //     var submission_previous_time;
    //     if (result.submission_previous === "EMPTY"){
    //         submission_previous = "Aún no proporcionas una respuesta.";
    //         submission_previous_time = "";
    //     } else if (result.submission_previous === "ERROR"){
    //         submission_previous = "Ha ocurrido un error, por favor contacte al administrador.";
    //         submission_previous_time = "";
    //     } else {
    //         submission_previous = result.submission_previous
    //         submission_previous_time = result.submission_previous_time;
    //     }
    //     let copy_button = (settings.block_type === "full" && !submission.prop("disabled") && (result.submission_previous !== "EMPTY" && result.submission_previous !== "ERROR")) ? `<span id="${settings.location}-copy-button" class="iaa-copy-button">Copiar</span>`  : "";
    //     area.html(`<figure class='submission-previous'><blockquote>${submission_previous}</blockquote><figcaption style='text-align:right;'>${submission_previous_time}</figcaption><div style="text-align: center">${copy_button}</div></figure>`);
    //     $(element).find(`#${settings.location}-copy-button`).on('click', function (eventObject) {
    //         submission.val(submission_previous);
    //     });
    //     area.removeClass(".iaa-display-area-hidden");
    // }


    $(element).find("iterative-xblock-student-get-answer").on('click', function (eventObject) {
        var data = {}
        $.post(displayUrl, JSON.stringify(data)).done(function (response) {
            afterDisplay(response)
        });
    });

    $(function ($) {
        if (settings.answered) {
            submission.attr("disabled", true);
            buttonSubmit.attr("disabled", true);
        }
    });
}