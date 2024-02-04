function IterativeAssessedActivityInstructor(runtime, element, settings) {

    var summaryUrl = runtime.handlerUrl(element, 'fetch_summary');

    function showErrorMessage(msg) {
        $(element).find('.iaa-istructor-error-msg').html(msg);
    }

    function showWarningMessage(msg) {
        $(element).find('#iaa-instructor-warning-msg').html(msg);
    }

    function showSuccessMessage(msg) {
        $(element).find('#iaa-instructor-success-msg').html(msg);
    }

    function generateDocument(summary, summary_text, summary_list, name) {
        const { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun, UnderlineType } = docx;
        let last_children = [];
        last_children.push(new Paragraph({
            text: settings.activity_name,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER
        }))
        last_children.push(new Paragraph({
            text: name,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER
        }))
        last_children.push(new Paragraph({
            text: summary_text,
            alignment: AlignmentType.LEFT
        }))
        let labels = [];
        for (let stage of summary) {
            if (summary_list.split(",").includes(stage[0])){
                if (!labels.includes(stage[1])){
                    labels.push(stage[1]);
                    last_children.push(
                    new Paragraph({
                        text: stage[1],
                        heading: HeadingLevel.HEADING_2,
                        size: 18
                    }))
                }
                last_children.push(
                    new Paragraph({
                        text: stage[2],
                        alignment: AlignmentType.LEFT
                    }))
                last_children.push(
                    new Paragraph({
                        text: "",
                    }))
                last_children.push(
                    new Paragraph({
                        text: stage[3],
                        italic: true,
                        alignment: AlignmentType.RIGHT,
                }));
            }
        }
        const doc = new Document({
            creator: "REDFID",
            title: "Resumen",
            description: "IAA Summary",
            styles: {
                paragraphStyles: [
                    {
                        id: "Heading1",
                        name: "Heading 1",
                        basedOn: "Normal",
                        next: "Normal",
                        quickFormat: true,
                        run: {
                            color: "000000",
                            size: 28,
                            bold: true
                        },
                        paragraph: {
                            spacing: {
                                after: 400,
                            },
                        },
                    },
                    {
                        id: "Heading2",
                        name: "Heading 2",
                        basedOn: "Normal",
                        next: "Normal",
                        quickFormat: true,
                        run: {
                            color: "000000",
                            size: 24,
                            bold: true,
                        },
                        paragraph: {
                            spacing: {
                                before: 240,
                                after: 600,
                            },
                        },
                    },
                    {
                        id: "wellSpaced",
                        name: "Well Spaced",
                        basedOn: "Normal",
                        quickFormat: true,
                        paragraph: {
                            spacing: { line: 276, before: 20 * 72 * 0.1, after: 20 * 72 * 0.05 },
                        },
                    },
                    {
                        id: "ListParagraph",
                        name: "List Paragraph",
                        basedOn: "Normal",
                        quickFormat: true,
                    },
                ],
            },
            numbering: {
                config: [
                    {
                        reference: "my-crazy-numbering",
                        levels: [
                            {
                                level: 0,
                                format: "lowerLetter",
                                text: "%1)",
                                alignment: AlignmentType.LEFT,
                            },
                        ],
                    },
                ],
            },
            sections: [{
                children: last_children
            }],
        });
    
        docx.Packer.toBlob(doc).then(blob => {
            saveAs(blob, "documento_iterativo.docx");
        });
    }

    function lockButtons(lock) {
        let buttons = $(element).find('.iaa-feedback-button');
        for (let button of buttons) {
            if (lock) {
                button.setAttribute("disabled", true);
            } else {
                button.removeAttribute("disabled");
            }
        }
    }

    function validate(data) {
        if (data.feedback.length < 10) {
            return "El feedback debe tener como mínimo un largo de 10 caracteres."
        }
        return "";
    }


    function afterSubmission(result) {
        if (result["msg"] !== "error") {
            showSuccessMessage("Feedback enviado.");
        } else {
            showErrorMessage("Algo salió mal.");
        }
        lockButtons(false);
    }

    $(element).find('.iaa-feedback-button').on('click', function (eventObject) {
        lockButtons(true);
        var handlerUrl = runtime.handlerUrl(element, 'instructor_submit');
        let student_id = eventObject.target.parentNode.parentNode.querySelector('th').innerHTML;
        let feedback = eventObject.target.parentNode.parentNode.querySelectorAll('td')[3].querySelector("textarea").value;
        let previous_datetime = eventObject.target.parentNode.parentNode.querySelectorAll('td')[4].innerText;
        var data = {
            "id_student": student_id,
            "feedback": feedback
        }
        var error_msg = validate(data);
        if (error_msg !== "") {
            showErrorMessage(error_msg);
        } else {
            $.post(handlerUrl, JSON.stringify(data)).done(function (response) {
                afterSubmission(response)
            });
        }
    });

    $(element).find("#iaa-select-student").on("change", function() {
        let selected = $(element).find("#iaa-select-student").val();
        var data = {user_id: selected}
        $.post(summaryUrl, JSON.stringify(data)).done(function (response) {
            afterSummary(response)
        });
    });


    function generateDoc(eventObject, result){
        eventObject.preventDefault()
        eventObject.target.setAttribute("disabled", true);
        generateDocument(result.summary, settings.summary_text, settings.summary_list, result.name);
        eventObject.target.removeAttribute("disabled");
    }

    function afterSummary(result) {
        let area = $(element).find(`#iaa-summary`).eq(0);
        if (result.result === "failed"){
            area.html(`<div class="centered">Ha ocurrido un error, por favor contacte al administrador.</div>`);
            area.removeClass(".iaa-summary-area-hidden");
        } else {
            let summaryButton = $(element).find(`#iaa-summary-button`).eq(0);
            summaryButton.remove();     
            var summary = "";
            let sections = [];
            for(let activity of result.summary){
                if (!sections.includes(activity[1])){
                    summary = summary + `<p class="summary-element-header summary-section"><b>${activity[1]}</b></p>`;
                    sections.push(activity[1])
                }
                summary = summary + `<p class="summary-element summary-submission">`;
                summary = summary + `${activity[2]}`;
                summary = summary + `</p>`
                summary = summary + `<p class="summary-element-footer summary-submission-time">`;
                summary = summary + `${activity[3]}`;
                summary = summary + `</p><hr>`  
            }
            if(result.is_summary){
                summary = summary + `<div class="centered report-button-area"><span id="report-button" class="iaa-report-button">Descargar reporte (.docx)</span></div>`
            }
            area.html(summary);
            $(element).find(`#report-button`).on('click', function (eventObject) {
                generateDoc(eventObject, result);
            });
            area.removeClass(".iaa-summary-area-hidden");
        }
    }

}
