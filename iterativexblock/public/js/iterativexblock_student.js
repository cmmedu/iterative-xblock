function IterativeXBlockStudent(runtime, element, settings) {


    let statusDiv = $(element).find('.status');
    let buttonSubmit = $(element).find(".iterative-xblock-submit");
    let submitUrl = runtime.handlerUrl(element, 'student_submit');
    let displayUrl = runtime.handlerUrl(element, 'fetch_previous_submission');
    let ensureUrl = runtime.handlerUrl(element, 'ensure_db_integrity');

    function showErrorMessage(msg) {
        $(element).find('#iterative-xblock-student-error-msg').html(msg);
    }

    function makeSubmissionData() {
        let data = {};
        $(element).find(".iterative-xblock-question").each(function (index, element) {
            let key = $(this).attr("id").split("iterative-xblock-question-")[1];
            let value = $(this).val();
            data[key] = value;
        });
        return data;
    }

    function validate(data) {
        let error_msg = "";
        for (let key of Object.keys(data)) {
            if (data[key].length > 0){ 
                var cell_id = null;
                for (let cellKey of Object.keys(settings.content.content)) {
                    if (settings.content.content[cellKey].content === key) {
                        cell_id = cellKey;
                        break;
                    }
                }
                if (data[key].length > 10000) {
                    error_msg = "La respuesta es muy larga. Por favor, utilice menos de 10000 caracteres (usados: " + data[key].length + ").";
                    $(element).find("#iterative-xblock-question-" + key).addClass("iterative-xblock-question-error")
                    break;
                }
                if (settings.content.content[cell_id].metadata.required === "required") {
                    if (data[key].trim().length === 0) {
                        error_msg = "Por favor, responda esta pregunta.";
                        $(element).find("#iterative-xblock-question-" + key).addClass("iterative-xblock-question-error")
                        break;
                    }
                    if (data[key].trim().length < parseInt(settings.content.content[cell_id].metadata.min_chars)) {
                        error_msg = "La respuesta es muy corta. Por favor, utilice al menos " + settings.content.content[cell_id].metadata.min_chars + " caracteres.";
                        $(element).find("#iterative-xblock-question-" + key).addClass("iterative-xblock-question-error")
                        break;
                    }
                    if (data[key].trim().split(" ").length < parseInt(settings.content.content[cell_id].metadata.min_words)) {
                        error_msg = "La respuesta es muy corta. Por favor, utilice al menos " + settings.content.content[cell_id].metadata.min_words + " palabras.";
                        $(element).find("#iterative-xblock-question-" + key).addClass("iterative-xblock-question-error")
                        break;
                    }
                } else if (data[key].trim().length > 0) {
                    if (data[key].trim().length < parseInt(settings.content.content[cell_id].metadata.min_chars)) {
                        error_msg = "La respuesta es muy corta. Por favor, utilice al menos " + settings.content.content[cell_id].metadata.min_chars + " caracteres.";
                        $(element).find("#iterative-xblock-question-" + key).addClass("iterative-xblock-question-error")
                        break;
                    }
                    if (data[key].trim().split(" ").length < parseInt(settings.content.content[key].min_words)) {
                        error_msg = "La respuesta es muy corta. Por favor, utilice al menos " + settings.content.content[cell_id].metadata.min_words + " palabras.";
                        $(element).find("#iterative-xblock-question-" + key).addClass("iterative-xblock-question-error")
                        break;
                    }
                }
            }
        }
        return error_msg;
    }

    function afterSubmission(result) {
        statusDiv.removeClass("unanswered");
        statusDiv.removeClass('correct');
        buttonSubmit.attr("disabled", true);
        statusDiv.addClass(result.indicator_class);
        if (result["result"] === "repeated"){
            showErrorMessage("Ya has respondido a esta pregunta. Por favor, actualice la página.");
            buttonSubmit.removeAttr("disabled");
        } else if (result["result"] === "success") {
            $(element).find(".iterative-xblock-student-question").attr("disabled", true);
            buttonSubmit.attr("disabled", true);
        } else {
            showErrorMessage("Algo salió mal.");
            buttonSubmit.removeAttr("disabled");
        }
    }

    buttonSubmit.click(function (e) {
        e.preventDefault();
        $(element).find(".iterative-xblock-question").removeClass("iterative-xblock-question-error");
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
        area.show();
        if(result["result"] === "success"){
            let answer = result["answer"] === "" ? "Aún no has respondido a esta pregunta." : result["answer"];
            area.val(answer);
        } else if (result["result"] === "no_question"){
            area.val("Esta pregunta no existe.");
        } else if (result["result"] === "no_answer"){
            area.val("Aún no has respondido a esta pregunta.");
        } else {
            area.val(result["error"]);
        }
        area.css('height', area.prop('scrollHeight') + 'px');
    }

    $(element).find(".iterative-xblock-student-get-answer").on('click', function (eventObject) {
        var data = {
            "id_question": $(this).attr("id").split("iterative-xblock-student-get-answer-")[1],
            "id_user": ""
        }
        $.post(displayUrl, JSON.stringify(data)).done(function (response) {
            $(this).hide();
            afterDisplay(data["id_question"], response)
        });
    });

    $(element).find(".iterative-xblock-student-download-pdf").on('click', function (eventObject) {
        $(this).prop('disabled', true);
        generatePDF($(this));
    });

    function generatePDF(buttonElement) {
        let { html2pdf } = html2pdf;
        let promises = [];
        $(element).find(".iterative-xblock-student-get-answer").each(function () {
            promises.push(new Promise((resolve) => {
                $(this).on('click', function () {
                    resolve();
                });
                $(this).click();
            }));
        });
        Promise.all(promises).then(() => {
            var pdfElement = $(element).find("#" + settings.location + " .iterative-xblock-gridarea");
            html2pdf().from(pdfElement[0]).set({
                margin: 1,
                filename: settings.location + '.pdf',
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            }).save().then(() => {
                buttonElement.prop('disabled', false);
            }).catch((error) => {
                console.log(error);
                buttonElement.prop('disabled', false);
            });
        });
    }

    $(function ($) {
        $.post(ensureUrl, JSON.stringify({})).done(function (response) {
            if (response["result"] !== "success") {
                showErrorMessage("Algo salió mal.");
            }
        });
        if (settings.completed) {
            var answers = settings.answers;
            for (var key in answers) {
                let question = $(element).find("#iterative-xblock-question-" + key);
                question.val(answers[key]);
                question.css('height', question.prop('scrollHeight') + 'px');
            }
            $(element).find(".iterative-xblock-question").attr("disabled", true);
            buttonSubmit.attr("disabled", true);
        }
        statusDiv.removeClass("unanswered");
        statusDiv.addClass("correct");
        statusDiv.addClass(settings.indicator_class);
        var iteraid = "iterative_" + settings.location;
		renderMathForSpecificElements(iteraid);
    });

    function renderMathForSpecificElements(id) {
        //console.log("Render Mathjax in " + id);
        if (typeof MathJax !== "undefined") {
            var $container = $('#' + id);
            if ($container.length) {
                $container.find('.exptop, .expmid, .expbot').each(function (index, contaelem) {
                    MathJax.Hub.Queue(["Typeset", MathJax.Hub, contaelem]);
                });
            }
        } else {
            console.warn("MathJax no está cargado.");
        }
    }
}