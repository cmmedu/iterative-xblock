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

    $(function ($) {
        $.post(ensureUrl, JSON.stringify({})).done(function (response) {
            if (response["result"] !== "success") {
                showErrorMessage("Algo salió mal.");
            }
        });
        MathJax.Hub.Queue(["Typeset", MathJax.Hub]); 
    });
}
