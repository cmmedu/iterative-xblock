function IterativeAssessedActivityInstructor(runtime, element, settings) {

    let displayUrl = runtime.handlerUrl(element, 'fetch_previous_submission');
    let answers = settings.answers;
    var selectedUser = "none";

    $(element).find("#iterative-xblock-instructor-select-student").on("change", function() {
        selectedUser = $(this).val();
        $(element).find(".iterative-xblock-student-question").val("");
        $(element).find(".iterative-xblock-student-get-answer").show();
        $(element).find(".iterative-xblock-student-answer").val("");
        if (selectedUser !== "none") {
            let selectedUserAnswers = answers.find(obj => obj.id_student === selectedUser);
            for (var key in selectedUserAnswers.answers) {
                $(element).find("#iterative-xblock-student-question-" + key).val(selectedUserAnswers.answers[key]);
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
            "id_user": selectedUser
        }
        $.post(displayUrl, JSON.stringify(data)).done(function (response) {
            afterDisplay(data["id_question"], response)
        });
    });

    $(function ($) {
        /* Here's where you'd do things on page load. */
    });
}
