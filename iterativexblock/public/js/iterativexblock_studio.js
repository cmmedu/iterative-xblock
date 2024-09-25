function IterativeXBlockStudio(runtime, element, settings) {
    let title = $(element).find("#title");
    let input_enable_download = $(element).find("#input_enable_download");
    let enable_download = $(element).find("#enable_download");
    let input_download_name = $(element).find("#input_download_name");
    let download_name = $(element).find("#download_name");
    // texto boton
    // texto boton ver respuesta
    // habilitar pdf
    // nombre pdf
    
    var content_ui;
    let content_backend  = settings.content

    function setStudioErrorMessage(msg) {
        $(element).find('.studio-error-msg').html(msg);
    }

    function makeGrid() {
        let grid = [];
        for (let i = 1; i <= 10; i++) {
            let row = [];
            for (let j = 1; j <= 10; j++) {
                let inputId = `content-${i}-${j}`;
                let input = $(`#${inputId}`);
                row.push(input.val());
            }
            grid.push(row);
        }
        return grid;
    }

    function validateGrid(grid) {
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[i].length; j++) {
                let cell = grid[i][j];
                if (!/^[a-z.]?$/.test(cell)) {
                    return null;
                }
            }
        }
        const visited = Array.from({ length: 10 }, () => Array(10).fill(false));
        const validatedLetters = new Set();
        function isRectangle(i, j, letter) {
            let minRow = i, maxRow = i, minCol = j, maxCol = j;
            for (let r = i; r < 10 && grid[r][j] === letter; r++) maxRow = r;
            for (let c = j; c < 10 && grid[i][c] === letter; c++) maxCol = c;
            for (let r = minRow; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                    if (grid[r][c] !== letter || visited[r][c]) {
                        return false;
                    }
                    visited[r][c] = true;
                }
            }
            return true;
        }
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                if (/[a-z]/.test(grid[i][j]) && !visited[i][j]) {
                    let letter = grid[i][j];
                    if (validatedLetters.has(letter)) {
                        return null;
                    }
                    if (!isRectangle(i, j, letter)) {
                        return null;
                    }
                    validatedLetters.add(letter);
                }
            }
        }
        for (let i = 0; i < 10; i++) {
            let usedInRow = grid[i].some(cell => cell !== '');
            let nextRowsUsed = grid.slice(i + 1).some(row => row.some(cell => cell !== ''));
            if (!usedInRow && nextRowsUsed) {
                return null;
            }
        }
        for (let j = 0; j < 10; j++) {
            let usedInColumn = grid.some(row => row[j] !== '');
            let nextColumnsUsed = grid.some(row => row.slice(j + 1).some(cell => cell !== ''));
            if (!usedInColumn && nextColumnsUsed) {
                return null;
            }
        }
        if (validatedLetters.size === 0) {
            return null;
        }
        return validatedLetters;
    }

    function makeContentUI() {
        return {
            "grid": Array.from({ length: 10 }, () => Array(10).fill("")),
            "content": {}
        }
    }

    function applyContent(content) {
        for (let i = 0; i < content.length; i++) {
            for (let j = 0; j < content[i].length; j++) {
                let inputId = `content-${i + 1}-${j + 1}`;
                $(`#${inputId}`).val(content[i][j]);
            }
        }
    }

    function displayCellsInputs(letters) {
        let container = $(element).find(`.settings-list`);
        container.find('.cell-content').remove();
        for (let letter of letters) {
            let letterContainer = $(`<li id="input_cell_${letter}" class="field comp-setting-entry is-set iterative-content-row cell-content"></li>`);
            let wrapper = $(`<div class="wrapper-comp-setting"></div>`);
            let label = $(`<label class="label setting-label" for="cell_${letter}">Celda ${letter}</label>`);
            wrapper.append(label);
            let inputsContainer = $(`<div class="inputs-container"></div>`);
            let typeInput = $(`<select id="cell_${letter}_type" class="cell-input-type setting-select-input cell_${letter}_type"></select>`);
            typeInput.append($(`<option selected disabled value="none">Seleccione una opción...</option>`));
            typeInput.append($(`<option value="text">Texto</option>`));
            typeInput.append($(`<option value="iframe">Iframe</option>`));
            typeInput.append($(`<option value="question">Pregunta</option>`));
            typeInput.append($(`<option value="answer">Respuesta</option>`));
            inputsContainer.append(typeInput);
            let textInput = $(`<input hidden id="cell_${letter}_text" class="setting-input cell_${letter}_text cell-input" type="text" placeholder="Texto">`);
            let urlInput = $(`<input hidden id="cell_${letter}_url" class="setting-input cell_${letter}_url cell-input" type="text" placeholder="URL">`);
            let questionInput = $(`<input hidden id="cell_${letter}_question" class="setting-input cell_${letter}_question cell-input" type="text" placeholder="ID de la pregunta">`);
            let answerInput = $(`<input hidden id="cell_${letter}_answer" class="setting-input cell_${letter}_answer cell-input" type="text" placeholder="ID de la pregunta">`);
            inputsContainer.append(textInput);
            inputsContainer.append(urlInput);
            inputsContainer.append(questionInput);
            inputsContainer.append(answerInput);
            let extraInputsContainer = $(`<div style="display:none;" class="iterative-xblock-extra-inputs iterative-xblock-extra-inputs-cell_${letter}"></div>`);
            let formattingInputs = $(`<div style="display:none;" class="iterative-xblock-formatting-inputs iterative-xblock-formatting-inputs-cell_${letter}"></div>`);
            let boldIcon = $(`<div style="display:none;" id="cell_${letter}_bold" class="iterative-xblock-formatting-icon"><i class="fa fa-bold"></i></div>`);
            let italicIcon = $(`<div style="display:none;" id="cell_${letter}_italic" class="iterative-xblock-formatting-icon"><i class="fa fa-italic"></i></div>`);
            let underlineIcon = $(`<div style="display:none;" id="cell_${letter}_underline" class="iterative-xblock-formatting-icon"><i class="fa fa-underline"></i></div>`);
            let strikeIcon = $(`<div style="display:none;" id="cell_${letter}_strike" class="iterative-xblock-formatting-icon"><i class="fa fa-strikethrough"></i></div>`);
            let leftIcon = $(`<div style="display:none;" id="cell_${letter}_left" class="iterative-xblock-formatting-icon"><i class="fa fa-align-left"></i></div>`);
            let centerIcon = $(`<div style="display:none;" id="cell_${letter}_center" class="iterative-xblock-formatting-icon"><i class="fa fa-align-center"></i></div>`);
            let rightIcon = $(`<div style="display:none;" id="cell_${letter}_right" class="iterative-xblock-formatting-icon"><i class="fa fa-align-right"></i></div>`);
            let justifyIcon = $(`<div style="display:none;" id="cell_${letter}_justify" class="iterative-xblock-formatting-icon"><i class="fa fa-align-justify"></i></div>`);
            let alignUpIcon = $(`<div style="display:none;" id="cell_${letter}_align-up" class="iterative-xblock-formatting-icon"><i class="fa fa-long-arrow-up"></i></div>`);
            let alignCenterIcon = $(`<div style="display:none;" id="cell_${letter}_align-center" class="iterative-xblock-formatting-icon"><i class="fa fa-long-arrow-right"></i></div>`);
            let alignDownIcon = $(`<div style="display:none;" id="cell_${letter}_align-down" class="iterative-xblock-formatting-icon"><i class="fa fa-long-arrow-down"></i></div>`);
            let borderLeftIcon = $(`<div style="display:none;" id="cell_${letter}_border-left" class="iterative-xblock-formatting-icon"><i class="fa fa-arrow-left"></i></div>`);
            let borderTopIcon = $(`<div style="display:none;" id="cell_${letter}_border-top" class="iterative-xblock-formatting-icon"><i class="fa fa-arrow-up"></i></div>`);
            let borderRightIcon = $(`<div style="display:none;" id="cell_${letter}_border-right" class="iterative-xblock-formatting-icon"><i class="fa fa-arrow-right"></i></div>`);
            let borderBottomIcon = $(`<div style="display:none;" id="cell_${letter}_border-bottom" class="iterative-xblock-formatting-icon"><i class="fa fa-arrow-down"></i></div>`);
            let borderBoldIcon = $(`<div style="display:none;" id="cell_${letter}_border-bold" class="iterative-xblock-formatting-icon"><i class="fa fa-bold"></i></div>`);
            formattingInputs.append(boldIcon);
            formattingInputs.append(italicIcon);
            formattingInputs.append(underlineIcon);
            formattingInputs.append(strikeIcon);
            formattingInputs.append(leftIcon);
            formattingInputs.append(centerIcon);
            formattingInputs.append(rightIcon);
            formattingInputs.append(justifyIcon);
            formattingInputs.append(alignUpIcon);
            formattingInputs.append(alignCenterIcon);
            formattingInputs.append(alignDownIcon);
            formattingInputs.append(borderLeftIcon);
            formattingInputs.append(borderTopIcon);
            formattingInputs.append(borderRightIcon);
            formattingInputs.append(borderBottomIcon);
            formattingInputs.append(borderBoldIcon);
            let placeholderInput = $(`<input style="display:none;" id="cell_${letter}_placeholder" class="setting-input cell_${letter}_placeholder cell-input-small" type="text" placeholder="Placeholder">`);
            let minCharsInput = $(`<input style="display:none;" id="cell_${letter}_min_chars" class="setting-input cell_${letter}_min_chars cell-input-small" type="number" placeholder="Mínimo de caracteres">`);
            let minWordsInput = $(`<input style="display:none;" id="cell_${letter}_min_words" class="setting-input cell_${letter}_min_words cell-input-small" type="number" placeholder="Mínimo de palabras">`);
            let requiredInput = $(`<select style="display:none;" id="cell_${letter}_required" class="setting-select-input cell_${letter}_required cell-input-small"></select>`);
            requiredInput.append($(`<option selected value="required">Obligatorio</option>`));
            requiredInput.append($(`<option value="optional">Opcional</option>`));
            extraInputsContainer.append(placeholderInput);
            extraInputsContainer.append(minCharsInput);
            extraInputsContainer.append(minWordsInput);
            extraInputsContainer.append(requiredInput);
            let seemore = $(`<div hidden class="iterative-xblock-seemore"><i class="fa fa-eye"></i></div>`);
            inputsContainer.append(seemore);
            inputsContainer.append(extraInputsContainer);
            inputsContainer.append(formattingInputs);
            wrapper.append(inputsContainer);
            letterContainer.append(wrapper);
            container.append(letterContainer);
        }
    }

    $(element).on('click', '.iterative-xblock-seemore', function (eventObject) {
        let cellId = $(this).parent().parent().parent().attr('id').replace('input_', '');
        let extraInputsContainer = $(element).find(`.iterative-xblock-extra-inputs-${cellId}`);
        let formattingInputs = $(element).find(`.iterative-xblock-formatting-inputs-${cellId}`);
        let boldIcon = $(element).find(`#${cellId}_bold`);
        let italicIcon = $(element).find(`#${cellId}_italic`);
        let underlineIcon = $(element).find(`#${cellId}_underline`);
        let strikeIcon = $(element).find(`#${cellId}_strike`);
        let leftIcon = $(element).find(`#${cellId}_left`);
        let centerIcon = $(element).find(`#${cellId}_center`);
        let rightIcon = $(element).find(`#${cellId}_right`);
        let justifyIcon = $(element).find(`#${cellId}_justify`);
        let alignUpIcon = $(element).find(`#${cellId}_align-up`);
        let alignCenterIcon = $(element).find(`#${cellId}_align-center`);
        let alignDownIcon = $(element).find(`#${cellId}_align-down`);
        let borderLeftIcon = $(element).find(`#${cellId}_border-left`);
        let borderTopIcon = $(element).find(`#${cellId}_border-top`);
        let borderRightIcon = $(element).find(`#${cellId}_border-right`);
        let borderBottomIcon = $(element).find(`#${cellId}_border-bottom`);
        let borderBoldIcon = $(element).find(`#${cellId}_border-bold`);
        let placeholderInput = $(element).find(`#${cellId}_placeholder`);
        let minCharsInput = $(element).find(`#${cellId}_min_chars`);
        let minWordsInput = $(element).find(`#${cellId}_min_words`);
        let requiredInput = $(element).find(`#${cellId}_required`);
        if (formattingInputs.css('display') === 'none') {
            if ($(this).hasClass('iterative-xblock-seemore-text')) {
                boldIcon.css('display', 'flex');
                italicIcon.css('display', 'flex');
                underlineIcon.css('display', 'flex');
                strikeIcon.css('display', 'flex');
                leftIcon.css('display', 'flex');
                centerIcon.css('display', 'flex');
                rightIcon.css('display', 'flex');
                justifyIcon.css('display', 'flex');
                alignUpIcon.css('display', 'flex');
                alignCenterIcon.css('display', 'flex');
                alignDownIcon.css('display', 'flex');
                borderLeftIcon.css('display', 'flex');
                borderTopIcon.css('display', 'flex');
                borderRightIcon.css('display', 'flex');
                borderBottomIcon.css('display', 'flex');
                borderBoldIcon.css('display', 'flex');
                formattingInputs.css('display', 'flex');
            } else if ($(this).hasClass('iterative-xblock-seemore-iframe')) {
                boldIcon.css('display', 'none');
                italicIcon.css('display', 'none');
                underlineIcon.css('display', 'none');
                strikeIcon.css('display', 'none');
                leftIcon.css('display', 'none');
                centerIcon.css('display', 'none');
                rightIcon.css('display', 'none');
                justifyIcon.css('display', 'none');
                alignUpIcon.css('display', 'none');
                alignCenterIcon.css('display', 'none');
                alignDownIcon.css('display', 'none');
                borderLeftIcon.css('display', 'flex');
                borderTopIcon.css('display', 'flex');
                borderRightIcon.css('display', 'flex');
                borderBottomIcon.css('display', 'flex');
                borderBoldIcon.css('display', 'flex');
                formattingInputs.css('display', 'flex');
            } else if ($(this).hasClass('iterative-xblock-seemore-question')) {
                boldIcon.css('display', 'flex');
                italicIcon.css('display', 'flex');
                underlineIcon.css('display', 'flex');
                strikeIcon.css('display', 'flex');
                leftIcon.css('display', 'flex');
                centerIcon.css('display', 'flex');
                rightIcon.css('display', 'flex');
                justifyIcon.css('display', 'flex');
                alignUpIcon.css('display', 'flex');
                alignCenterIcon.css('display', 'flex');
                alignDownIcon.css('display', 'flex');
                borderLeftIcon.css('display', 'flex');
                borderTopIcon.css('display', 'flex');
                borderRightIcon.css('display', 'flex');
                borderBottomIcon.css('display', 'flex');
                borderBoldIcon.css('display', 'flex');
                formattingInputs.css('display', 'flex');
            } else if ($(this).hasClass('iterative-xblock-seemore-answer')) {
                boldIcon.css('display', 'flex');
                italicIcon.css('display', 'flex');
                underlineIcon.css('display', 'flex');
                strikeIcon.css('display', 'flex');
                leftIcon.css('display', 'flex');
                centerIcon.css('display', 'flex');
                rightIcon.css('display', 'flex');
                justifyIcon.css('display', 'flex');
                alignUpIcon.css('display', 'flex');
                alignCenterIcon.css('display', 'flex');
                alignDownIcon.css('display', 'flex');
                borderLeftIcon.css('display', 'flex');
                borderTopIcon.css('display', 'flex');
                borderRightIcon.css('display', 'flex');
                borderBottomIcon.css('display', 'flex');
                borderBoldIcon.css('display', 'flex');
                formattingInputs.css('display', 'flex');
            } else {
                boldIcon.css('display', 'none');
                italicIcon.css('display', 'none');
                underlineIcon.css('display', 'none');
                strikeIcon.css('display', 'none');
                leftIcon.css('display', 'none');
                centerIcon.css('display', 'none');
                rightIcon.css('display', 'none');
                justifyIcon.css('display', 'none');
                alignUpIcon.css('display', 'none');
                alignCenterIcon.css('display', 'none');
                alignDownIcon.css('display', 'none');
                borderLeftIcon.css('display', 'none');
                borderTopIcon.css('display', 'none');
                borderRightIcon.css('display', 'none');
                borderBottomIcon.css('display', 'none');
                borderBoldIcon.css('display', 'none');
                formattingInputs.css('display', 'none');
            }
        } else {
            boldIcon.css('display', 'none');
            italicIcon.css('display', 'none');
            underlineIcon.css('display', 'none');
            strikeIcon.css('display', 'none');
            leftIcon.css('display', 'none');
            centerIcon.css('display', 'none');
            rightIcon.css('display', 'none');
            justifyIcon.css('display', 'none');
            alignUpIcon.css('display', 'none');
            alignCenterIcon.css('display', 'none');
            alignDownIcon.css('display', 'none');
            borderLeftIcon.css('display', 'none');
            borderTopIcon.css('display', 'none');
            borderRightIcon.css('display', 'none');
            borderBottomIcon.css('display', 'none');
            borderBoldIcon.css('display', 'none');
            formattingInputs.css('display', 'none');
        }
        if (extraInputsContainer.css('display') === 'none') {
            if ($(this).hasClass('iterative-xblock-seemore-text')) {
                placeholderInput.css('display', 'none');
                minCharsInput.css('display', 'none');
                minWordsInput.css('display', 'none');
                requiredInput.css('display', 'none');
                extraInputsContainer.css('display', 'none');
            } else if ($(this).hasClass('iterative-xblock-seemore-iframe')) {
                placeholderInput.css('display', 'none');
                minCharsInput.css('display', 'none');
                minWordsInput.css('display', 'none');
                requiredInput.css('display', 'none');
                extraInputsContainer.css('display', 'none');
            } else if ($(this).hasClass('iterative-xblock-seemore-question')) {
                placeholderInput.css('display', 'flex');
                minCharsInput.css('display', 'flex');
                minWordsInput.css('display', 'flex');
                requiredInput.css('display', 'flex');
                extraInputsContainer.css('display', 'flex');
            } else if ($(this).hasClass('iterative-xblock-seemore-answer')) {
                placeholderInput.css('display', 'flex');
                minCharsInput.css('display', 'none');
                minWordsInput.css('display', 'none');
                requiredInput.css('display', 'none');
                extraInputsContainer.css('display', 'flex');
            } else {
                placeholderInput.css('display', 'none');
                minCharsInput.css('display', 'none');
                minWordsInput.css('display', 'none');
                requiredInput.css('display', 'none');
                extraInputsContainer.css('display', 'none');
            }
        } else {
            placeholderInput.css('display', 'none');
            minCharsInput.css('display', 'none');
            minWordsInput.css('display', 'none');
            requiredInput.css('display', 'none');
            extraInputsContainer.css('display', 'none');
        }
    });

    $(element).on('change', '.cell-input-type', function (eventObject) {
        let cellId = $(this).attr('id').replace('_type', '');
        let cellType = $(this).val();
        let textInput = $(`#${cellId}_text`);
        let urlInput = $(`#${cellId}_url`);
        let questionInput = $(`#${cellId}_question`);
        let answerInput = $(`#${cellId}_answer`);
        seemore.removeClass('iterative-xblock-seemore-text');
        seemore.removeClass('iterative-xblock-seemore-iframe');
        seemore.removeClass('iterative-xblock-seemore-question');
        seemore.removeClass('iterative-xblock-seemore-answer');
        if (cellType === "text") {
            textInput.show();
            urlInput.hide();
            questionInput.hide();
            answerInput.hide();
            seemore.addClass('iterative-xblock-seemore-text');
            seemore.show();
        } else if (cellType === "iframe") {
            textInput.hide();
            urlInput.show();
            questionInput.hide();
            answerInput.hide();
            seemore.addClass('iterative-xblock-seemore-iframe');
            seemore.show();
        } else if (cellType === "question") {
            textInput.hide();
            urlInput.hide();
            questionInput.show();
            answerInput.hide();
            seemore.addClass('iterative-xblock-seemore-question');
            seemore.show();
        } else if (cellType === "answer") {
            textInput.hide();
            urlInput.hide();
            questionInput.hide();
            answerInput.show();
            seemore.addClass('iterative-xblock-seemore-answer');
            seemore.show();
        } else {
            textInput.hide();
            urlInput.hide();
            questionInput.hide();
            answerInput.hide();
            seemore.hide();
        }
    });

    $(element).find('.apply-button').bind('click', function (eventObject) {
        eventObject.preventDefault();
        setStudioErrorMessage("");
        let inputValues = {};
        $(element).find('.input-box').each(function () {
            let id = $(this).attr('id').replace('content-', '');
            let value = $(this).val();
            inputValues[id] = value;
        });
        let grid = makeGrid();
        let letters = validateGrid(grid);
        if (letters == null) {
            setStudioErrorMessage("Grilla inválida. Por favor, verifique que las letras estén en rectángulos y que no haya letras repetidas, ni filas o columnas vacías antes de filas o columnas con letras.");
        } else {
            displayCellsInputs(letters);
        }
        console.log(letters);
        console.log(grid)
    });

    $(element).find('.save-button').bind('click', function (eventObject) {
        eventObject.preventDefault();
        setStudioErrorMessage("");
        content_ui = makeContentUI();
        var handlerUrl = runtime.handlerUrl(element, 'studio_submit');
        var checkQuestionIDsUrl = runtime.handlerUrl(element, 'check_question_ids');
        var original_questions = getQuestionIDs(content_backend)
        var newQuestions = getQuestionIDs(content_ui).filter(function(questionId) {
            return !original_questions.includes(questionId);
        });
        var removedQuestions = original_questions.filter(function(questionId) {
            return !getQuestionIDs(content_ui).includes(questionId);
        });
        var data = {
            title: title.val(),
            enable_download: enable_download.val(),
            download_name: download_name.val(),
            new_questions: newQuestions,
            removed_questions: removedQuestions
        };
        var error_msg = validate(data);
        if (error_msg !== "") {
            setStudioErrorMessage(error_msg);
        } else {
            $.post(checkQuestionIDsUrl, JSON.stringify(newQuestions)).done(function (response) {
                if(response["result"] === "failed") {
                    setStudioErrorMessage("Las siguientes preguntas ya existen en otro Iterative XBlock: " + response["question_ids"].join(", "));
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
        }
    });

    $(element).find('.cancel-button').bind('click', function (eventObject) {
        eventObject.preventDefault();
        runtime.notify('cancel', {});
    });
    
    function onLoad() {
        title.val(settings.title);
        applyContent(content_backend);
    }
    onLoad();
}