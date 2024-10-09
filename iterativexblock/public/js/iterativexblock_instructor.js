function IterativeXBlockInstructor(runtime, element, settings) {

    let displayUrl = runtime.handlerUrl(element, 'fetch_previous_submission');
    let ensureUrl = runtime.handlerUrl(element, 'ensure_db_integrity');
    let answers = settings.answers;
    var selectedUser = "none";

    $(element).find("#iterative-xblock-instructor-select-student").on("change", function() {
        selectedUser = $(this).val();
        $(element).find(".iterative-xblock-question").val("");
        $(element).find(".iterative-xblock-student-get-answer").show();
        $(element).find(".iterative-xblock-student-answer").val("");
        if (selectedUser !== "none") {
            let selectedUserAnswers = answers.find(obj => obj.id_student === parseInt(selectedUser));
            for (var key in selectedUserAnswers.answers) {
                let question = $(element).find("#iterative-xblock-question-" + key);
                question.val(selectedUserAnswers.answers[key]);
                question.css("height", question.prop('scrollHeight') + 'px');
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
            "id_user": parseInt(selectedUser)
        }
        if (selectedUser !== "none") {
            $.post(displayUrl, JSON.stringify(data)).done(function (response) {
                afterDisplay(data["id_question"], response)
            });
        }
    });

    $(element).find(".iterative-xblock-student-download-pdf").on('click', function (eventObject) {
        $(this).prop('disabled', true);
        generatePDF($(this));
    });

    function generatePDF(buttonElement) {
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
            });
        });
    }

    $(function ($) {
        $.post(ensureUrl, JSON.stringify({})).done(function (response) {
            if (response["result"] !== "success") {
                showErrorMessage("Algo salió mal.");
            }
        });
        
        var iteraid = "iterative_" + settings.location;
        //console.log(iteraid);
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
