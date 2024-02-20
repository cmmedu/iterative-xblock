function IterativeXBlockStudent(runtime, element, settings) {

    let buttonSubmit = $(element).find(".iterative-xblock-submit");
    var submitUrl = runtime.handlerUrl(element, 'student_submit');
    var displayUrl = runtime.handlerUrl(element, 'fetch_previous_submission');

    function showErrorMessage(msg) {
        $(element).find('#iaa-student-error-msg').html(msg);
    }

    function showWarningMessage(msg) {
        $(element).find('#iaa-student-warning-msg').html(msg);
    }

    function showSuccessMessage(msg) {
        $(element).find('#iaa-student-success-msg').html(msg);
    }

    function validate(data) {

    }


    function afterSubmission(result) {
        buttonSubmit.attr("disabled", true);
        if (result["result"] === "repeated"){
            showWarningMessage("Ya se encuentra registrada una respuesta. Por favor, actualice la página.");
            buttonSubmit.removeAttr("disabled");
        } else if (result["result"] === "success") {
            showSuccessMessage("¡Respuesta enviada exitosamente!");
            submission.attr("disabled", true);
            buttonSubmit.attr("disabled", true);
        } else {
            showErrorMessage("Algo salió mal.");
            buttonSubmit.removeAttr("disabled");
        }
        buttonSubmit.html("<span>" + buttonSubmit[0].dataset.value + "</span>");
    }

    buttonSubmit.click(function (e) {
        e.preventDefault();
        showErrorMessage("");
        showWarningMessage("");
        showSuccessMessage("");
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

    function lockDisplayButtons(lock) {
        let buttons = $(element).find(`#${settings.location}-display-button`);
        for (let button of buttons) {
            if (lock) {
                button.setAttribute("disabled", true);
            } else {
                button.removeAttribute("disabled");
            }
        }
    }

    
    function afterDisplay(result) {
        let displayButton = $(element).find(`#${settings.location}-display-button`).eq(0);
        displayButton.remove();
        let displayButtonArea = $(element).find(`#${settings.location}-display-button-div`).eq(0);
        displayButtonArea.attr("hidden", true);
        let area = $(element).find(`#${settings.location}-submission-previous`).eq(0);
        var submission_previous;
        var submission_previous_time;
        if (result.submission_previous === "EMPTY"){
            submission_previous = "Aún no proporcionas una respuesta.";
            submission_previous_time = "";
        } else if (result.submission_previous === "ERROR"){
            submission_previous = "Ha ocurrido un error, por favor contacte al administrador.";
            submission_previous_time = "";
        } else {
            submission_previous = result.submission_previous
            submission_previous_time = result.submission_previous_time;
        }
        let copy_button = (settings.block_type === "full" && !submission.prop("disabled") && (result.submission_previous !== "EMPTY" && result.submission_previous !== "ERROR")) ? `<span id="${settings.location}-copy-button" class="iaa-copy-button">Copiar</span>`  : "";
        area.html(`<figure class='submission-previous'><blockquote>${submission_previous}</blockquote><figcaption style='text-align:right;'>${submission_previous_time}</figcaption><div style="text-align: center">${copy_button}</div></figure>`);
        $(element).find(`#${settings.location}-copy-button`).on('click', function (eventObject) {
            submission.val(submission_previous);
        });
        area.removeClass(".iaa-display-area-hidden");
        lockDisplayButtons(false);
    }


    $(element).find(`#${settings.location}-display-button`).on('click', function (eventObject) {
        lockDisplayButtons(true);
        var data = {}
        $.post(displayUrl, JSON.stringify(data)).done(function (response) {
            afterDisplay(response)
        });
    });


    $(function ($) {
        if (submission.val() !== "") {
            submission.attr("disabled", true);
            buttonSubmit.attr("disabled", true);
        }
    });
}