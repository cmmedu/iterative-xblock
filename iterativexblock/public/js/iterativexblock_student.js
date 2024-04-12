function IterativeXBlockStudent(runtime, element, settings) {

    let statusDiv = $(element).find('.status');
    let buttonSubmit = $(element).find(".iterative-xblock-submit");
    let submitUrl = runtime.handlerUrl(element, 'student_submit');
    let displayUrl = runtime.handlerUrl(element, 'fetch_previous_submission');
    let pdfDisplayUrl = runtime.handlerUrl(element, 'fetch_pdf_submissions');
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
            if (data[key].length > 0){ 
                count++;
                if (data[key].length > 10000) {
                    error_msg = "La respuesta es muy larga. Por favor, utilice menos de 10000 caracteres (usados: " + data[key].length + ").";
                    break;
                }
                if (settings.min_characters !== 0){
                    if (data[key].length < settings.min_characters) {
                        error_msg = "La respuesta es muy corta. Por favor, utilice al menos " + settings.min_characters + " caracteres (usados: " + data[key].length + ").";
                        break;
                    }
                }
                if (settings.min_words !== 0) {
                    if (data[key].split(" ").length < settings.min_words) {
                        error_msg = "La respuesta es muy corta. Por favor, utilice al menos " + settings.min_words + " palabras (usadas: " + data[key].split(" ").length + ").";
                        break;
                    }
                } 
            }
        }
        if (min_questions === 0){
            if (count < data.length){
                error_msg = "Por favor, responda todas las preguntas.";
            }
        } else if (count < min_questions) {
            error_msg = "Por favor, responda al menos " + min_questions + " preguntas.";
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
        area.css('height', 'auto');
        area.css('height', area.scrollHeight + 'px');
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

    $(element).find(".iterative-xblock-student-download-pdf").on('click', function (eventObject) {
        $.post(pdfDisplayUrl, JSON.stringify({"id_user": ""})).done(function (response) {
            generatePDF(response["answers"]);
        });
    });

    function generatePDF(answers) {
        const { jsPDF } = jspdf;
        var doc = new jsPDF();
        let pageWidth = doc.internal.pageSize.getWidth();
        let margin = 20;
        let totalWidth = pageWidth - (2 * margin);
        let lineHeight = 10;
        let cellMargin = 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        let title = settings.title;
        let titleWidth = doc.getStringUnitWidth(title) * 16 / doc.internal.scaleFactor;
        let titleX = (pageWidth - titleWidth) / 2; 
        doc.text(title, titleX, margin);
        let startY = margin;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        var line;
        var processParagraph = function(paragraph, x, y, width) {
            var lines = doc.splitTextToSize(paragraph, width);
            var blockHeight = lines.length * lineHeight;
            doc.text(lines, x, y + (lineHeight / 2), {maxWidth: width, align: "justify"});
        };
        for (var i = 1; i <= settings.content["n_rows"]; i++) {
            line = startY + (i - 1) * lineHeight + margin;
            let n_cells = settings.content[i.toString()]["n_cells"];
            var x = margin;
            var widths = [];
            for (var j = 1; j <= n_cells; j++) {
                var paragraph;
                var cellContent = settings.content[i.toString()][j.toString()];
                if (cellContent["type"] === "text") {
                    paragraph = cellContent["content"];
                } else if (cellContent["type"] === "answer") {
                    paragraph = answers[cellContent["content"]];
                }
                let cellObject = document.querySelector("#iterative-xblock-student-cell-" + i + "-" + j);
                cellWidth = cellObject.offsetWidth*0.75;
                processParagraph(paragraph, x, line, cellWidth);
                x += cellWidth;
                x += cellMargin;
            }
        }
        doc.save(settings.download_name + '.pdf');
    }

    $(".iterative-xblock-student-question").each(function(index, e) {
        $(e).on('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
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