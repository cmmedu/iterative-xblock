function IterativeXBlockInstructor(runtime, element, settings) {

    let displayUrl = runtime.handlerUrl(element, 'fetch_previous_submission');
    let pdfDisplayUrl = runtime.handlerUrl(element, 'fetch_pdf_submissions');
    let answers = settings.answers;
    var selectedUser = "none";

    $(element).find("#iterative-xblock-instructor-select-student").on("change", function() {
        selectedUser = $(this).val();
        $(element).find(".iterative-xblock-student-question").val("");
        $(element).find(".iterative-xblock-student-get-answer").show();
        $(element).find(".iterative-xblock-student-answer").val("");
        if (selectedUser !== "none") {
            let selectedUserAnswers = answers.find(obj => obj.id_student === parseInt(selectedUser));
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
            "id_user": parseInt(selectedUser)
        }
        if (selectedUser !== "none") {
            $.post(displayUrl, JSON.stringify(data)).done(function (response) {
                afterDisplay(data["id_question"], response)
            });
        }
    });

    $(element).find(".iterative-xblock-student-download-pdf").on('click', function (eventObject) {
        if (selectedUser !== "none") {
            $.post(pdfDisplayUrl, JSON.stringify({"id_user": parseInt(selectedUser)})).done(function (response) {
                generatePDF(response["answers"]);
            });
        }
    });

    $(".iterative-xblock-student-answer").each(function(index, e) {
        $(e).on('load', function() {
            this.style.height = this.scrollHeight + 'px';
        });
    });

    function generatePDF(answers) {
        const { jsPDF } = jspdf;
        var doc = new jsPDF();
        let pageWidth = doc.internal.pageSize.getWidth();
        let margin = 20;
        let totalWidth = pageWidth - (2 * margin);
        let lineHeight = 5;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        let title = settings.title;
        let titleWidth = doc.getStringUnitWidth(title) * 16 / doc.internal.scaleFactor;
        let titleX = (pageWidth - titleWidth) / 2; 
        doc.text(title, titleX, margin);
        let startY = margin;
        doc.setFontSize(10);
        var y = startY + margin;
        var processParagraph = function(paragraph, x, y, width, alignment) {
            var lines = doc.splitTextToSize(paragraph, width);
            var blockHeight = lines.length * lineHeight;
            doc.text(lines, x, y + (lineHeight / 2), {maxWidth: width, align: alignment});
            return blockHeight;
        };
        for (var i = 1; i <= settings.content["n_rows"]; i++) {
            let n_cells = settings.content[i.toString()]["n_cells"];
            var widths = [];
            var totalOffsetWidth = 0;
            for (var j = 1; j <= n_cells; j++) {
                var cellObject = document.querySelector("#iterative-xblock-student-cell-" + i + "-" + j);
                widths.push(cellObject.offsetWidth);
                totalOffsetWidth += cellObject.offsetWidth;
            }
            var proportionalWidths = widths.map(function(width) {
                return Math.floor(width*totalWidth / totalOffsetWidth);
            });
            var x = margin;
            var next_y = 0;
            for (var j = 1; j <= n_cells; j++) {
                var paragraph;
                var cellContent = settings.content[i.toString()][j.toString()];
                var stylestring = ""
                if (cellContent["bold"]) {
                    stylestring += "bold";
                }
                if (cellContent["italic"]) {
                    stylestring += "italic";
                }
                if (stylestring === "") {
                    stylestring = "normal";
                }
                doc.setFont("helvetica", stylestring);
                if (cellContent["type"] === "text") {
                    paragraph = cellContent["content"];
                } else if (cellContent["type"] === "answer") {
                    paragraph = answers[cellContent["content"]];
                }
                cellWidth = proportionalWidths[j-1]-4;
                this_y = processParagraph(paragraph, x+2, y, cellWidth, cellContent["alignment"] !== "right" ? cellContent["alignment"] : "center");
                console.log(y)
                console.log(this_y)
                next_y = Math.max(next_y, this_y);
                x += proportionalWidths[j-1];
            }
            y += next_y;
        }
        doc.save(settings.download_name + '.pdf');
    }

    $(function ($) {
        MathJax.Hub.Queue(["Typeset", MathJax.Hub]); 
    });
}
