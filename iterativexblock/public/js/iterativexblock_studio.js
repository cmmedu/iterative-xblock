function IterativeAssessedActivityStudio(runtime, element) {

    let context = $("#context-iaa").data()["context"];
    let activities = JSON.parse(context["activities"]);
    let input_title = $(element).find("#input_title");
    let title = $(element).find("#title");
    let input_activity_name = $(element).find('#input_activity_name');
    let activity_name = $(element).find("#activity_name");
    let input_new_activity_name = $(element).find("#input_new_activity_name");
    let new_activity_name = $(element).find("#new_activity_name");
    let input_block_type = $(element).find("#input_block_type");
    let block_type = $(element).find("#block_type");
    let input_activity_stage = $(element).find("#input_activity_stage");
    let activity_stage = $(element).find("#activity_stage");
    let input_stage_label = $(element).find("#input_stage_label");
    let stage_label = $(element).find("#stage_label");
    let input_activity_previous = $(element).find("#input_activity_previous");
    let activity_previous = $(element).find("#activity_previous");
    let input_display_title = $(element).find("#input_display_title");
    let display_title = $(element).find("#display_title");
    let input_activity_name_previous = $(element).find("#input_activity_name_previous");
    let activity_name_previous = $(element).find("#activity_name_previous");
    let input_activity_stage_previous = $(element).find("#input_activity_stage_previous");
    let activity_stage_previous = $(element).find("#activity_stage_previous");
    let input_question = $(element).find("#input_question");
    let question = $(element).find("#question");
    let input_min_length = $(element).find("#input_min_length");
    let min_length = $(element).find("#min_length");
    let input_summary_type = $(element).find("#input_summary_type");
    let summary_type = $(element).find("#summary_type");
    let input_summary_visibility = $(element).find("#input_summary_visibility");
    let summary_visibility = $(element).find("#summary_visibility");
    let input_summary_section = $(element).find("#input_summary_section");
    let summary_section = $(element).find("#summary_section");
    let input_summary_text = $(element).find("#input_summary_text");
    let summary_text = $(element).find("#summary_text");
    let input_summary_list = $(element).find("#input_summary_list");
    let summary_list = $(element).find("#summary_list");


    function checkSummaryStages(activity_name, stages, type, section){
        for(let activity of activities){
            if(activity[1] == activity_name){
                let splitted = activity[2].split(",");
                let splitted_l = activity[3].split("###");
                let splitted_chosen = stages.split(",");
                for(let i=0; i<splitted_chosen.length; i++){
                    if(!splitted.includes(splitted_chosen[i])){
                        return false;
                    }
                    var index;
                    for(let j=0; j<splitted.length; j++){
                        if(splitted[j] === splitted_chosen[i]){
                            index = j;
                        }
                    }
                    if (type === "section"){
                        if (splitted_l[index] !== section){
                            return false;
                        }
                    }
                }
                return true;
            }
        }
        if(activity_name == "empty"){
            return true;
        }
        return false;
    }

    function checkMinLength(number){
        if (/^(0|[1-9]\d*)$/.test(number)){
            return parseInt(number) > 9 && parseInt(number) < 1001
        }
    }

    function checkStageNumber(number){
        return /^\d+(\.\d{0,2})?$/.test(number);
    }

    function repeatedStageNumber(activity_name, number){
        if(number !== context["activity_stage"]){
            for(let activity of activities){
                if(activity[1] === activity_name){
                    if(activity[2].split(",").includes(number)){
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function validate(data) {
        if (data["title"] === "") {
            return "Por favor indique el título del bloque."
        }
        if (data["block_type"] === null) {
            return "Por favor indique el tipo de bloque."
        } else if (data["block_type"] === "full") {
            if (data["activity_name"] === "none" || data["activity_name"] === "") {
                return "Por favor indique el nombre de la actividad."
            }
            if (activity_name.val() === "new") {
                if (data["activity_name"] === context["activity_name"]) {
                    return "El nombre es igual a la actividad actual."
                }
                for (let activity of activities) {
                    if (data["activity_name"] === activity["activity_name"]) {
                        return "Ya existe en este curso una actividad con ese nombre."
                    }
                }
                if (data["activity_name"] === "new" || data["activity_name"] === "empty" || data["activity_name"] === "TestActivity") {
                    return "Los nombres de actividad 'new', 'empty' y 'TestActivity' son inválidos."
                }
            }
            if (data["activity_stage"] === "") {
                return "Por favor seleccione un ID."
            }
            if (!checkStageNumber(data["activity_stage"])){
                return "ID inválido, debe ser un número con hasta 2 decimales. Ejemplos: 1, 2.1, 1.12"
            }
            if (repeatedStageNumber(data["activity_name"], data["activity_stage"])){
                return `Ya existe el ID "${data["activity_stage"]}" en la actividad "${data["activity_name"]}".`
            }
            if (data["stage_label"] === "") {
                return "Por favor proporcione una sección."
            }
            if (data["question"] === "") {
                return "Por favor proporcione un enunciado."
            }
            if (data["min_length"] === "") {
                return "Por favor proporcione un largo mínimo."
            }
            if(!checkMinLength(data["min_length"])){
                return "Por favor proporcione un largo mínimo numérico entre 10 y 1000."
            }
            if (data["activity_previous"] === "yes") {
                if (data["activity_name_previous"] === "none" || data["activity_name_previous"] == null) {
                    return "Por favor indique el nombre de la actividad de la cual se mostrará una respuesta anterior."
                }
                if (data["activity_stage_previous"] === "") {
                    return "Por favor seleccione un ID."
                }
                if (!checkStageNumber(data["activity_stage_previous"])){
                    return "ID inválido, debe ser un número con hasta 2 decimales. Ejemplos: 1, 2.1, 1.12"
                }
                if (!repeatedStageNumber(data["activity_name_previous"], data["activity_stage_previous"])){
                    return `No existe el ID "${data["activity_stage_previous"]}" en la actividad "${data["activity_name_previous"]}".`
                }
                if (data["activity_stage_previous"] === data["activity_stage"] && data["activity_name_previous"] === "activity_name"){
                    return "No se puede mostrar como respuesta anterior aquella correspondiente a este mismo bloque."
                }
            }
        } else if (data["block_type"] === "display") {
            if (data["activity_name_previous"] === "none" || data["activity_name_previous"] == null) {
                return "Por favor indique el nombre de la actividad de la cual se mostrará una respuesta anterior."
            }
            if (data["activity_stage_previous"] === "") {
                return "Por favor seleccione un ID."
            }
            if (!checkStageNumber(data["activity_stage_previous"])){
                return "ID inválido, debe ser un número con hasta 2 decimales. Ejemplos: 1, 2.1, 1.12"
            }
            if (!repeatedStageNumber(data["activity_name_previous"], data["activity_stage_previous"])){
                return `No existe el ID "${data["activity_stage_previous"]}" en la actividad "${data["activity_name_previous"]}".`
            }
        } else {
            if (data["activity_name"] === "none") {
                return "Por favor indique el nombre de la actividad."
            }
            if (data["summary_type"] !== "full" && data["summary_type"] !== "section"){
                return "Por favor indique un tipo de resumen."
            }
            if (data["summary_visibility"] !== "instructors" && data["summary_visibility"] !== "all"){
                return "Por favor indique una visibilidad para el resumen."
            }
            if (data["summary_type"] === "section"){
                if (data["summary_section"] == null){
                    return "Por favor indique una sección para el resumen."
                }
            }
            if (data["summary_list"] === "") {
                return "Por favor indique las etapas a mostrar."
            }
            if(!checkSummaryStages(data["activity_name"], data["summary_list"], data["summary_type"], data["summary_section"])){
                return "Formato inválido de fases a mostrar. Use números separados por comas que correspondan a fases existentes."
            }
        }
        return "";
    }

    function showMessage(msg) {
        $(element).find('.iaa-studio-error-msg').html(msg);
    }


    $(element).find('.save-button').bind('click', function (eventObject) {
        eventObject.preventDefault();
        var handlerUrl = runtime.handlerUrl(element, 'studio_submit');

        if (block_type.val() === null) {
            var data = {
                title: title.val(),
                block_type: null
            };
        } else if (block_type.val() === "full") {
            var data = {
                title: title.val(),
                activity_name: (activity_name.val() === "new" ? new_activity_name.val() : (activity_name.val() === null ? "" : activity_name.val())),
                block_type: block_type.val(),
                activity_stage: activity_stage.val(),
                stage_label: stage_label.val(),
                question: question.val(),
                min_length: parseInt(min_length.val()),
                activity_previous: activity_previous.val(),
                activity_name_previous: activity_name_previous.val(),
                activity_stage_previous: activity_stage_previous.val(),
                display_title: display_title.val()
            };
        } else if (block_type.val() === "display") {
            var data = {
                title: title.val(),
                block_type: block_type.val(),
                activity_name_previous: activity_name_previous.val(),
                activity_stage_previous: activity_stage_previous.val(),
                display_title: display_title.val()
            };
        } else if (block_type.val() === "summary") {
            var data = {
                title: title.val(),
                activity_name: activity_name.val(),
                block_type: block_type.val(),
                summary_type: summary_type.val(),
                summary_visibility: summary_visibility.val(),
                summary_section: summary_section.val(),
                summary_text: summary_text.val(),
                summary_list: summary_list.val()
            };
        }

        var error_msg = validate(data);
        if (error_msg !== "") {
            showMessage(error_msg);
        } else {
            if ($.isFunction(runtime.notify)) {
                runtime.notify('save', { state: 'start' });
            }
            $.post(handlerUrl, JSON.stringify(data)).done(function (response) {
                if ($.isFunction(runtime.notify)) {
                    runtime.notify('save', { state: 'end' });
                }
            });
        }
    });

    $(element).find('.cancel-button').bind('click', function (eventObject) {
        eventObject.preventDefault();
        runtime.notify('cancel', {});
    });

    function getSummary(section, summary_type){
        if (summary_type === "full"){
            for(let activity of activities){
                if(activity[1] === activity_name.val()){
                    return [activity[2], activity[3]];
                }
            }
        } else {
            for(let activity of activities){
                if(activity[1] === activity_name.val()){
                    var list = "";
                    var splitted_list = activity[2].split(",");
                    var splitted_labels = activity[3].split("###");
                    for(let i=0; i< splitted_list.length; i++){
                        if (splitted_labels[i] === section){
                            list += splitted_list[i];
                            list += ",";
                        }
                    }
                    list = list.replace(/,$/, "");
                    return [list, null];
                }
            }
        }
    }
    
    function getSummarySections(){
        var sections = [];
        for(let activity of activities){
            if(activity[1] === activity_name.val()){
                var sections_comma = activity[3].split("###");
                for (let sect of sections_comma){
                    if(!sections.includes(sect)){
                        sections.push(sect);
                    }
                }
            }
        }
        return sections;
    }

    function onLoad() {

        // XBlock is being created for the first time
        if (context["block_type"] === "none") {

            input_title.removeAttr("hidden");
            title.val("Documento iterativo");
            input_block_type.removeAttr("hidden");
            input_block_type.removeAttr("disabled");
            let block_type_options = [["full", "Completo"], ["display", "Sólo respuesta anterior"], ["summary", "Resumen"], ["none", "Por favor seleccione una opción..."]];
            for (let option of block_type_options) {
                let opt = document.createElement("option");
                opt.value = option[0];
                opt.text = option[1];
                block_type.append(opt);
                if (option[0] === "none") {
                    opt.setAttribute("disabled", true);
                    opt.setAttribute("selected", true);
                }
                if ((option[0] === "display" || option[0] === "summary") && activities.length === 0) {
                    opt.setAttribute("disabled", true);
                }
            }

            block_type.on("change", function () {

                // All inputs are hidden
                input_activity_name.attr("hidden", true);
                activity_name.empty();
                input_new_activity_name.attr("hidden", true);
                input_activity_stage.attr("hidden", true);
                input_stage_label.attr("hidden", true);
                input_activity_name_previous.attr("hidden", true);
                input_activity_stage_previous.attr("hidden", true);
                input_display_title.attr("hidden", true);
                input_question.attr("hidden", true);
                input_min_length.attr("hidden", true);
                input_summary_type.attr("hidden", true);
                input_summary_visibility.attr("hidden", true);
                input_summary_section.attr("hidden", true);
                input_summary_text.attr("hidden", true);
                input_summary_list.attr("hidden", true);
                activity_previous.val("no").change();
                input_activity_previous.attr("hidden", true);

                // Load activity_name input
                if (block_type.val() !== "display") {
                    input_activity_name.removeAttr("hidden");
                    activity_name.removeAttr("disabled");
                    for (let activity of activities) {
                        let opt = document.createElement("option");
                        opt.value = activity[1];
                        opt.text = activity[1];
                        activity_name.append(opt);
                    }
                    if (block_type.val() === "full") {
                        let opt00 = document.createElement("option");
                        opt00.value = "new";
                        opt00.text = "Crear nueva actividad...";
                        activity_name.append(opt00);
                    }
                    let opt0 = document.createElement("option");
                    opt0.value = "none";
                    opt0.text = "Por favor seleccione una opción...";
                    opt0.setAttribute("selected", true);
                    opt0.setAttribute("disabled", true);
                    activity_name.append(opt0);
                }

                // After an activity is chosen, the rest of the inputs are shown
                activity_name.on("change", function () {
                    // The new activity name input is shown if a new activity is going to be created
                    if (activity_name.val() == "new") {
                        input_new_activity_name.removeAttr("hidden");
                    } else {
                        input_new_activity_name.attr("hidden", true);
                    }

                    if (block_type.val() === "full") {

                        input_activity_stage.removeAttr("hidden");
                        input_stage_label.removeAttr("hidden");
                        input_question.removeAttr("hidden");
                        input_min_length.removeAttr("hidden");
                        input_activity_previous.removeAttr("hidden");

                        activity_previous.on("change", function () {
                            activity_name_previous.empty();
                            if (activity_previous.val() === "yes") {
                                input_activity_name_previous.removeAttr("hidden");
                                input_activity_stage_previous.removeAttr("hidden");
                                input_display_title.removeAttr("hidden");
                                for (let activity of activities) {
                                    let opt = document.createElement("option");
                                    opt.value = activity[1];
                                    opt.text = activity[1];
                                    if (context["activity_name_previous"] == activity[1]) {
                                        activity_exists = true;
                                    }
                                    activity_name_previous.append(opt);
                                }
                                let opt0 = document.createElement("option");
                                opt0.value = "none";
                                opt0.text = "Por favor seleccione una opción...";
                                opt0.setAttribute("disabled", true);
                                activity_name_previous.append(opt0);
                                if (context["activity_name_previous"] !== "") {
                                    activity_name_previous.val(context["activity_name_previous"]).change();
                                    if (context["activity_stage_previous"] !== "") {
                                        activity_stage_previous.val(context["activity_stage_previous"]);
                                    } else {
                                        activity_stage_previous.val("");
                                    }
                                } else {
                                    activity_name_previous.val("none").change();
                                    activity_stage_previous.val("");
                                }

                            } else {
                                input_activity_name_previous.attr("hidden", true);
                                input_activity_stage_previous.attr("hidden", true);
                                input_display_title.attr("hidden", true);
                            }
                        });
                        activity_previous.val("no").change();
                        activity_name.on("change", function () {
                            if (activity_previous.val() === "yes") {
                                activity_name_previous.val("none").change();
                                activity_stage_previous.val("");
                            }
                        });
                    }
                    if (block_type.val() === "summary") {
                        input_summary_type.removeAttr("hidden");
                        input_summary_visibility.removeAttr("hidden");
                        input_summary_text.removeAttr("hidden");
                        input_summary_list.removeAttr("hidden");
                        summary_type.on("change", function () {
                            if (summary_type.val() === "section"){
                                input_summary_section.removeAttr("hidden");
                                let options = getSummarySections();
                                summary_section.empty();
                                for (let option of options){
                                    let opt = document.createElement("option");
                                    opt.value = option;
                                    opt.text = option;
                                    summary_section.append(opt);
                                }
                                let opt0 = document.createElement("option");
                                opt0.value = "";
                                opt0.text = "Por favor seleccione una opción...";
                                summary_section.append(opt0);
                                opt0.setAttribute("selected", true);
                                opt0.setAttribute("disabled", true);
                                summary_section.on("change", function () {
                                    if (summary_section.val() !== ""){
                                        let summary = getSummary(summary_section.val(), "section");
                                        summary_list.val(summary[0]);
                                    }
                                });
                                summary_section.val("").change();
                                summary_list.val("");
                            } else {
                                input_summary_section.attr("hidden", true);
                                summary_list.val(getSummary(null, "full")[0]);
                            }
                        })
                        summary_type.val("full").change();
                        summary_visibility.val("instructors").change();
                        summary_text.val("");
                    }
                });

                if (block_type.val() === "display") {
                    input_display_title.removeAttr("hidden");
                    input_activity_name_previous.removeAttr("hidden");
                    input_activity_stage_previous.removeAttr("hidden");
                    activity_name_previous.empty();
                    for (let activity of activities) {
                        let opt = document.createElement("option");
                        opt.value = activity[1];
                        opt.text = activity[1];
                        activity_name_previous.append(opt);
                    }
                    let opt0 = document.createElement("option");
                    opt0.value = "none";
                    opt0.text = "Por favor seleccione una opción...";
                    opt0.setAttribute("disabled", true);
                    activity_name_previous.append(opt0);
                    activity_name_previous.val("none").change();
                    activity_stage_previous.val("");
                }
            });


            // XBlock is being edited
        } else {
            input_title.removeAttr("hidden");
            title.val(context["title"])
            input_block_type.removeAttr("hidden");
            block_type.empty();
            let opt000 = document.createElement("option");
            opt000.value = context["block_type"]
            opt000.text = (context["block_type"] === "full" ? "Completo" : (context["block_type"] === "display" ? "Solo respuesta anterior" : "Resumen"));
            block_type.append(opt000);
            block_type.val(context["block_type"]).change();
            // seleccionar todo
            if (block_type.val() === "full") {
                input_activity_name.removeAttr("hidden");
                input_activity_stage.removeAttr("hidden");

                activity_name.empty();

                for (let activity of activities) {
                    let opt = document.createElement('option');
                    opt.value = activity[1];
                    opt.text = activity[1];
                    activity_name.append(opt);
                }
                let opt00 = document.createElement("option");
                opt00.value = "new";
                opt00.text = "Crear nueva actividad...";
                activity_name.append(opt00);
                activity_name.val(context["activity_name"]).change();
                activity_stage.val(context["activity_stage"]);
                input_stage_label.removeAttr("hidden");
                stage_label.val(context["stage_label"]);
                input_question.removeAttr("hidden");
                question.val(context["question"]);
                input_min_length.removeAttr("hidden");
                min_length.val(context["min_length"]);
            } else if (block_type.val() === "summary") {

                input_activity_name.removeAttr("hidden");
                activity_name.empty();
                if(activities.length === 0){
                    let opt0 = document.createElement("option");
                    opt0.value = "empty";
                    opt0.text = "No hay actividades.";
                    activity_name.append(opt0);
                    activity_name.val("empty").change();
                    activity_name.attr("disabled", true);
                }
                else {
                    for (let activity of activities) {
                        let opt = document.createElement("option");
                        opt.value = activity[1];
                        opt.text = activity[1];
                        activity_name.append(opt);
                        activity_name.val(context["activity_name"]).change();
                    }
                    activity_name.on("change", function() {

                        input_summary_type.removeAttr("hidden");
                        input_summary_text.removeAttr("hidden");
                        input_summary_list.removeAttr("hidden");
                        input_summary_visibility.removeAttr("hidden");

                        summary_type.on("change", function() {
                            if (summary_type.val() === "section"){
                                input_summary_section.removeAttr("hidden");
                                let options = getSummarySections();
                                summary_section.empty();
                                for (let option of options){
                                    let opt = document.createElement("option");
                                    opt.value = option;
                                    opt.text = option;
                                    summary_section.append(opt);
                                }
                                let opt0 = document.createElement("option");
                                opt0.value = "";
                                opt0.text = "Por favor seleccione una opción...";
                                summary_section.append(opt0);
                                opt0.setAttribute("selected", true);
                                opt0.setAttribute("disabled", true);
                                summary_section.on("change", function () {
                                    if (summary_section.val() !== ""){
                                        let summary = getSummary(summary_section.val(), "section");
                                        summary_list.val(summary[0]);
                                    }
                                });
                                summary_section.val("").change();
                                summary_list.val("");
                            } else {
                                input_summary_section.attr("hidden", true);
                                summary_list.val(getSummary(null, "full")[0]);
                            }
                        });

                        if (activity_name.val() === context["activity_name"]){
                            summary_type.val(context["summary_type"]).change();
                            if (summary_type.val() === "section"){
                                summary_section.val(context["summary_section"]).change();
                            }
                            summary_visibility.val(context["summary_visibility"]).change();
                            summary_text.val(context["summary_text"]);
                            summary_list.val(context["summary_list"]);
                        } else {
                            summary_type.val("full").change();
                            summary_visibility.val("instructors").change();
                            summary_text.val("");
                            summary_list.val("");
                        }
                    });
                    activity_name.val(context["activity_name"]).change();
                }
            }
            if (block_type.val() !== "summary") {
                if (block_type.val() === "full") {
                    input_activity_previous.removeAttr("hidden");
                    var activity_exists;
                    for (let activity of activities) {
                        if (activity[1] === context["activity_name_previous"]) {
                            activity_exists = true;
                            break;
                        }
                    }
                    activity_previous.on("change", function () {
                        activity_name_previous.empty();
                        if (activity_previous.val() === "yes") {
                            input_activity_name_previous.removeAttr("hidden");
                            input_activity_stage_previous.removeAttr("hidden");
                            input_display_title.removeAttr("hidden");
                            for (let activity of activities) {
                                let opt = document.createElement("option");
                                opt.value = activity[1];
                                opt.text = activity[1];
                                if (context["activity_name_previous"] == activity[1]) {
                                    activity_exists = true;
                                }
                                activity_name_previous.append(opt);
                            }
                            let opt0 = document.createElement("option");
                            opt0.value = "none";
                            opt0.text = "Por favor seleccione una opción...";
                            opt0.setAttribute("disabled", true);
                            activity_name_previous.append(opt0);
                            if (context["activity_name_previous"] !== "") {
                                activity_name_previous.val(context["activity_name_previous"]).change();
                            } else {
                                activity_name_previous.val("none").change();
                            }
                            activity_stage_previous.val(context["activity_stage_previous"]);
                            display_title.val(context["display_title"]);

                        } else {
                            input_activity_name_previous.attr("hidden", true);
                            input_activity_stage_previous.attr("hidden", true);
                            input_display_title.attr("hidden", true);
                        }
                    });
                    activity_previous.val(context["activity_name_previous"] !== "" ? "yes" : "no").change();
                    activity_name.on("change", function () {
                        if (activity_previous.val() === "yes") {
                            activity_name_previous.val("none").change();
                        }
                    });
                } else {
                    var activity_exists = false;
                    input_display_title.removeAttr("hidden");
                    display_title.val(context["display_title"]).change();
                    input_activity_name_previous.removeAttr("hidden");
                    input_activity_stage_previous.removeAttr("hidden");
                    activity_name_previous.empty();
                    for (let activity of activities) {
                        let opt = document.createElement("option");
                        opt.value = activity[1];
                        opt.text = activity[1];
                        if (context["activity_name_previous"] == activity[1]) {
                            opt.setAttribute("selected", true);
                            activity_exists = true;
                        }
                        activity_name_previous.append(opt);
                    }
                    let opt0 = document.createElement("option");
                    opt0.value = "none";
                    opt0.text = "Por favor seleccione una opción...";
                    opt0.setAttribute("disabled", true);
                    activity_name_previous.append(opt0);
                    if (!activity_exists) {
                        // reset por borrado externo
                        // y si no hay ninguna? forzar a borrar xblock... como?
                        activity_name_previous.val("none").change();
                        activity_stage_previous.val("");
                    } else {
                        activity_name_previous.val(context["activity_name_previous"]).change();
                        activity_stage_previous.val(context["activity_stage_previous"]);
                    }
                }
            }
        }
    }
    onLoad();
}