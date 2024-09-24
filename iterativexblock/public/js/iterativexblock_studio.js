function IterativeXBlockStudio(runtime, element, settings) {
    let title = $(element).find("#title");
    let input_enable_download = $(element).find("#input_enable_download");
    let enable_download = $(element).find("#enable_download");
    let input_download_name = $(element).find("#input_download_name");
    let download_name = $(element).find("#download_name");
    
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
        for (let letter of letters) {
            let letterContainer = $(`<li id="input_cell_${letter}" class="field comp-setting-entry is-set iterative-content-row"></li>`);
            let wrapper = $(`<div class="wrapper-comp-setting"></div>`);
            let label = $(`<label class="label setting-label" for="cell_${letter}">Celda ${letter}</label>`);
            wrapper.append(label);
            let inputsContainer = $(`<div class="inputs-container"></div>`);
            let typeInput = $(`<select id="cell_${letter}_type" class="setting-select-input cell_${letter}_type"></select>`);
            typeInput.append($(`<option value="none">Seleccione una opción...</option>`));
            typeInput.append($(`<option value="text">Texto</option>`));
            typeInput.append($(`<option value="iframe">Iframe</option>`));
            typeInput.append($(`<option value="question">Pregunta</option>`));
            typeInput.append($(`<option value="answer">Respuesta</option>`));
            inputsContainer.append(typeInput);
            wrapper.append(inputsContainer);
            letterContainer.append(wrapper);
            container.append(letterContainer);
        }
    }

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