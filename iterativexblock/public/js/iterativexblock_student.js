function IterativeAssessedActivityStudent(runtime, element, settings) {

    let statusDiv = $(element).find('.status');

    let buttonSubmit = $(element).find(".iaa-submit");
    let submission = $(element).find(".iaa-submission");
    var handlerUrl = runtime.handlerUrl(element, 'student_submit');
    var displayUrl = runtime.handlerUrl(element, 'fetch_previous_submission');
    var summaryUrl = runtime.handlerUrl(element, 'fetch_summary');

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
        if (data.submission.length < settings.min_length) {
            buttonSubmit.removeAttr("disabled");
            buttonSubmit.html("<span>Enviar</span>")
            return `¡Respuesta muy corta! Por favor escriba al menos ${settings.min_length} caracteres.`
        }
        if (data.submission.length > 10000) {
            buttonSubmit.removeAttr("disabled");
            buttonSubmit.html("<span>Enviar</span>")
            return `¡Respuesta muy larga! Por favor escriba máximo 10000 caracteres.`
        }
        return "";
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

    function afterSubmission(result) {
        statusDiv.removeClass("unanswered");
        statusDiv.removeClass('correct');
        buttonSubmit.attr("disabled", true);
        statusDiv.addClass(result.indicator_class);
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
        buttonSubmit.html("<span>" + buttonSubmit[0].dataset.checking + "</span>");
        if (!busyValidating){
            if ($.isFunction(runtime.notify)) {
                runtime.notify('submit', {
                    message: 'Submitting...',
                    state: 'start'
                });
            }
        }
        var busyValidating = true;
        var data = { "submission": submission.val() }
        let error_msg = validate(data);
        if (error_msg !== "") {
            showErrorMessage(error_msg);
        } else {
            $.ajax({
                type: "POST",
                url: handlerUrl,
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

    function lockSummaryButtons(lock) {
        let buttons = $(element).find(`#${settings.location}-summary-button`);
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


    $(element).find(`#iaa-summary-button`).on('click', function (eventObject) {
        lockSummaryButtons(true);
        var data = {user_id: "self"}
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
            summary = summary + `<div class="centered report-button-area"><span id="report-button" class="iaa-report-button">Descargar reporte (.docx)</span></div>`
            area.html(summary);
            $(element).find(`#report-button`).on('click', function (eventObject) {
                generateDoc(eventObject, result);
            });
            area.removeClass(".iaa-summary-area-hidden");
            lockDisplayButtons(false);
        }
    }


    $(function ($) {
        if (submission.val() !== "") {
            submission.attr("disabled", true);
            buttonSubmit.attr("disabled", true);
        }
    });
}