function IterativeXBlockStudent(runtime, element, settings) {

    let statusDiv = $(element).find('.status');
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
        statusDiv.removeClass("unanswered");
        statusDiv.removeClass('correct');
        buttonSubmit.attr("disabled", true);
        statusDiv.addClass(result.indicator_class);
        if (result["result"] === "repeated"){
            showErrorMessage("Ya se encuentra registrada una respuesta. Por favor, actualice la página.");
            buttonSubmit.removeAttr("disabled");
        } else if (result["result"] === "success") {
            $(element).find(".iterative-xblock-student-question").attr("disabled", true);
            //buttonSubmit.html("<span>" + settings.submitted_message + "</span>");
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

    function afterDisplay(id_question, result) {
        let displayButton = $(element).find("#iterative-xblock-student-get-answer-" + id_question);
        displayButton.hide();
        let area = $(element).find("#iterative-xblock-student-answer-" + id_question);
        if(result["result"] === "success"){
            let answer = result["answer"] === "" ? settings.no_answer_message : result["answer"];
            let answer_time = result["answer_time"];
            area.val(answer);
        } else if (result["result"] === "no_answer"){
            area.val(settings.no_answer_message);
        } else {
            area.val(result["error"]);
        }
    }

    $(element).find(".iterative-xblock-student-get-answer").on('click', function (eventObject) {
        var data = {
            "id_question": $(this).attr("id").split("iterative-xblock-student-get-answer-")[1],
            "id_user": ""
        }
        $.post(displayUrl, JSON.stringify(data)).done(function (response) {
            afterDisplay(data["id_question"], response)
        });
    });

    $(function ($) {
        if (settings.completed) {
            var answers = settings.answers;
            for (var key in answers) {
                $(element).find("#iterative-xblock-student-question-" + key).val(answers[key]);
            }
            $(element).find(".iterative-xblock-student-question").attr("disabled", true);
            buttonSubmit.attr("disabled", true);
        }
        statusDiv.removeClass("unanswered");
        statusDiv.addClass("correct");
        statusDiv.addClass(settings.indicator_class);
    });
}