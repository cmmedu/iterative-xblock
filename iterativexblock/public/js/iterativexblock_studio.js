function IterativeXBlockStudio(runtime, element, settings) {
    let title = $(element).find("#title");
    let input_enable_download = $(element).find("#input_enable_download");
    let enable_download = $(element).find("#enable_download");
    let input_download_name = $(element).find("#input_download_name");
    let download_name = $(element).find("#download_name");
    let input_submit_message = $(element).find("#input_submit_message");
    let submit_message = $(element).find("#submit_message");
    
    var content_ui;
    let content_backend  = settings.content

    function setStudioErrorMessage(msg) {
        $(element).find('.studio-error-msg').html(msg);
    }

    function validate(data) {
        if (data["title"].length > 200) {
            return "El título debe tener un máximo de 200 caracteres."
        }
        if (input_enable_download.is(":visible") && enable_download.val() === "true" && download_name.val().length === 0) {
            return "Debe ingresar un nombre para el archivo descargable."
        }
        if (input_enable_download.is(":visible") && enable_download.val() === "true" && download_name.val().length > 200) {
            return "El nombre del archivo descargable debe tener un máximo de 200 caracteres."
        }
        if (input_enable_download.is(":visible") && enable_download.val() === "true" && !download_name.val().length.endsWith(".pdf")) {
            return "El nombre del archivo descargable debe terminar en '.pdf'."
        }
        if (input_submit_message.is(":visible") && submit_message.val().length === 0) {
            return "Debe ingresar un mensaje para el botón de envío."
        }
        if (input_submit_message.is(":visible") && submit_message.val().length > 200) {
            return "El mensaje para el botón de envío debe tener un máximo de 200 caracteres."
        }
        // validar contenido
    }

    function getQuestionIDs(content) {
        let questionIds = [];
        for (let cell of Object.values(content)) {
            if (cell.type === "question") {
                questionIds.push(cell.content);
            }
        }
        return questionIds;
    }

    function toggleHiddenInputs(content) {
        let questionIds = getQuestionIDs(content["content"]);
        if (questionIds.length > 0) {
            input_enable_download.hide();
            input_download_name.hide();
            input_submit_message.show();
            submit_message.val(settings["submit_message"] !== "Enviar" ? settings["submit_message"] : "Enviar");
        } else {
            input_enable_download.show();
            enable_download.val(settings["enable_download"] ? "true" : "false");
            input_download_name.show();
            download_name.val(settings["download_name"] !== "respuestas.pdf" ? settings["download_name"] : "respuestas.pdf");
            input_submit_message.hide();
        }
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
        let content = {};
        $(element).find('.cell-content').each(function () {
            let cellId = $(this).attr('id').replace('input_', '');
            let cellType = $(`#${cellId}_type`).val();
            let cellContent = "";
            if (cellType === "text") {
                cellContent = $(`#${cellId}_text`).val();
            } else if (cellType === "iframe") {
                cellContent = $(`#${cellId}_url`).val();
            } else if (cellType === "question") {
                cellContent = $(`#${cellId}_question`).val();
            } else if (cellType === "answer") {
                cellContent = $(`#${cellId}_answer`).val();
            }
            let metadata = {};
            let format = {};
            if (cellType === "question") {
                let placeholder = $(`#${cellId}_placeholder`).val();
                let minChars = $(`#${cellId}_min_chars`).val();
                let minWords = $(`#${cellId}_min_words`).val();
                let required = $(`#${cellId}_required`).val();
                metadata["placeholder"] = placeholder;
                metadata["min_chars"] = minChars;
                metadata["min_words"] = minWords;
                metadata["required"] = required;
                let bold = $(`#${cellId}_bold`).hasClass('iterative-icon-chosen');
                let italic = $(`#${cellId}_italic`).hasClass('iterative-icon-chosen');
                let underline = $(`#${cellId}_underline`).hasClass('iterative-icon-chosen');
                let strike = $(`#${cellId}_strike`).hasClass('iterative-icon-chosen');
                let horizontalAlign = $(`#${cellId}_left`).hasClass('iterative-icon-chosen') ? "left" : $(`#${cellId}_center`).hasClass('iterative-icon-chosen') ? "center" : $(`#${cellId}_right`).hasClass('iterative-icon-chosen') ? "right" : "justify";
                let verticalAlign = $(`#${cellId}_align-up`).hasClass('iterative-icon-chosen') ? "top" : $(`#${cellId}_align-center`).hasClass('iterative-icon-chosen') ? "middle" : $(`#${cellId}_align-down`).hasClass('iterative-icon-chosen') ? "bottom" : "middle";
                let borderLeft = $(`#${cellId}_border-left`).hasClass('iterative-icon-chosen');
                let borderTop = $(`#${cellId}_border-top`).hasClass('iterative-icon-chosen');
                let borderRight = $(`#${cellId}_border-right`).hasClass('iterative-icon-chosen');
                let borderBottom = $(`#${cellId}_border-bottom`).hasClass('iterative-icon-chosen');
                let borderBold = $(`#${cellId}_border-bold`).hasClass('iterative-icon-chosen');
                format["bold"] = bold;
                format["italic"] = italic;
                format["underline"] = underline;
                format["strike"] = strike;
                format["horizontal_align"] = horizontalAlign;
                format["vertical_align"] = verticalAlign;
                format["border_left"] = borderLeft;
                format["border_top"] = borderTop;
                format["border_right"] = borderRight;
                format["border_bottom"] = borderBottom;
                format["border_bold"] = borderBold;
            } else if (cellType === "answer") {
                let placeholder = $(`#${cellId}_placeholder`).val();
                metadata["placeholder"] = placeholder;
                metadata["min_chars"] = "0";
                metadata["min_words"] = "0";
                metadata["required"] = "required";
                let bold = $(`#${cellId}_bold`).hasClass('iterative-icon-chosen');
                let italic = $(`#${cellId}_italic`).hasClass('iterative-icon-chosen');
                let underline = $(`#${cellId}_underline`).hasClass('iterative-icon-chosen');
                let strike = $(`#${cellId}_strike`).hasClass('iterative-icon-chosen');
                let horizontalAlign = $(`#${cellId}_left`).hasClass('iterative-icon-chosen') ? "left" : $(`#${cellId}_center`).hasClass('iterative-icon-chosen') ? "center" : $(`#${cellId}_right`).hasClass('iterative-icon-chosen') ? "right" : "justify";
                let verticalAlign = $(`#${cellId}_align-up`).hasClass('iterative-icon-chosen') ? "top" : $(`#${cellId}_align-center`).hasClass('iterative-icon-chosen') ? "middle" : $(`#${cellId}_align-down`).hasClass('iterative-icon-chosen') ? "bottom" : "middle";
                let borderLeft = $(`#${cellId}_border-left`).hasClass('iterative-icon-chosen');
                let borderTop = $(`#${cellId}_border-top`).hasClass('iterative-icon-chosen');
                let borderRight = $(`#${cellId}_border-right`).hasClass('iterative-icon-chosen');
                let borderBottom = $(`#${cellId}_border-bottom`).hasClass('iterative-icon-chosen');
                let borderBold = $(`#${cellId}_border-bold`).hasClass('iterative-icon-chosen');
                format["bold"] = bold;
                format["italic"] = italic;
                format["underline"] = underline;
                format["strike"] = strike;
                format["horizontal_align"] = horizontalAlign;
                format["vertical_align"] = verticalAlign;
                format["border_left"] = borderLeft;
                format["border_top"] = borderTop;
                format["border_right"] = borderRight;
                format["border_bottom"] = borderBottom;
                format["border_bold"] = borderBold;
            } else if (cellType === "text") {
                metadata["placeholder"] = "";
                metadata["min_chars"] = "0";
                metadata["min_words"] = "0";
                metadata["required"] = "required";
                let bold = $(`#${cellId}_bold`).hasClass('iterative-icon-chosen');
                let italic = $(`#${cellId}_italic`).hasClass('iterative-icon-chosen');
                let underline = $(`#${cellId}_underline`).hasClass('iterative-icon-chosen');
                let strike = $(`#${cellId}_strike`).hasClass('iterative-icon-chosen');
                let horizontalAlign = $(`#${cellId}_left`).hasClass('iterative-icon-chosen') ? "left" : $(`#${cellId}_center`).hasClass('iterative-icon-chosen') ? "center" : $(`#${cellId}_right`).hasClass('iterative-icon-chosen') ? "right" : "justify";
                let verticalAlign = $(`#${cellId}_align-up`).hasClass('iterative-icon-chosen') ? "top" : $(`#${cellId}_align-center`).hasClass('iterative-icon-chosen') ? "middle" : $(`#${cellId}_align-down`).hasClass('iterative-icon-chosen') ? "bottom" : "middle";
                let borderLeft = $(`#${cellId}_border-left`).hasClass('iterative-icon-chosen');
                let borderTop = $(`#${cellId}_border-top`).hasClass('iterative-icon-chosen');
                let borderRight = $(`#${cellId}_border-right`).hasClass('iterative-icon-chosen');
                let borderBottom = $(`#${cellId}_border-bottom`).hasClass('iterative-icon-chosen');
                let borderBold = $(`#${cellId}_border-bold`).hasClass('iterative-icon-chosen');
                format["bold"] = bold;
                format["italic"] = italic;
                format["underline"] = underline;
                format["strike"] = strike;
                format["horizontal_align"] = horizontalAlign;
                format["vertical_align"] = verticalAlign;
                format["border_left"] = borderLeft;
                format["border_top"] = borderTop;
                format["border_right"] = borderRight;
                format["border_bottom"] = borderBottom;
                format["border_bold"] = borderBold;
            } else if (cellType === "iframe") {
                metadata["placeholder"] = "";
                metadata["min_chars"] = "0";
                metadata["min_words"] = "0";
                metadata["required"] = "required";
                format["bold"] = false;
                format["italic"] = false;
                format["underline"] = false;
                format["strike"] = false;
                format["horizontal_align"] = "justify";
                format["vertical_align"] = "middle";
                format["border_left"] = $(`#${cellId}_border-left`).hasClass('iterative-icon-chosen');
                format["border_top"] = $(`#${cellId}_border-top`).hasClass('iterative-icon-chosen');
                format["border_right"] = $(`#${cellId}_border-right`).hasClass('iterative-icon-chosen');
                format["border_bottom"] = $(`#${cellId}_border-bottom`).hasClass('iterative-icon-chosen');
                format["border_bold"] = $(`#${cellId}_border-bold`).hasClass('iterative-icon-chosen');
            } else {
                metadata["placeholder"] = "";
                metadata["min_chars"] = "0";
                metadata["min_words"] = "0";
                metadata["required"] = "required";
                format["bold"] = false;
                format["italic"] = false;
                format["underline"] = false;
                format["strike"] = false;
                format["horizontal_align"] = "justify";
                format["vertical_align"] = "middle";
                format["border_left"] = false;
                format["border_top"] = false;
                format["border_right"] = false;
                format["border_bottom"] = false;
                format["border_bold"] = false;
            }
            content[cellId] = {
                "type": cellType,
                "content": cellContent,
                "metadata": metadata,
                "format": format
            };
        });
        return {
            "grid": Array.from({ length: 10 }, () => Array(10).fill("")),
            "content": content
        }
    }

    function applyContent(content) {
        for (let i = 0; i < content.length; i++) {
            for (let j = 0; j < content[i].length; j++) {
                let inputId = `content-${i + 1}-${j + 1}`;
                $(`#${inputId}`).val(content[i][j]);
            }
        }
        let grid = makeGrid();
        let letters = validateGrid(grid);
        if (letters !== null) {
            displayCellsInputs(letters);
        }
        for (let id in content["content"]) {
            let cell = content["content"][id];
            let cellId = "cell_" + id;
            let cellType = cell["type"];
            $(`#${cellId}_type`).val(cellType);
            if (cellType === "question") {
                $(`#${cellId}_question`).val(cell["content"]);
            } else if (cellType === "text") {
                $(`#${cellId}_text`).val(cell["content"]);
            } else if (cellType === "iframe") {
                $(`#${cellId}_url`).val(cell["content"]);
            } else if (cellType === "answer") {
                $(`#${cellId}_answer`).val(cell["content"]);
            }
            $(`#${cellId}_placeholder`).val(cell["metadata"]["placeholder"]);
            $(`#${cellId}_min_chars`).val(cell["metadata"]["min_chars"]);
            $(`#${cellId}_min_words`).val(cell["metadata"]["min_words"]);
            $(`#${cellId}_required`).val(cell["metadata"]["required"]);
            if (cell["metadata"]["required"] === "required") {
                $(`#${cellId}_required`).val("required");
            } else {
                $(`#${cellId}_required`).val("optional");
            }
            if (cell["format"]["bold"]) {
                $(`#${cellId}_bold`).addClass('iterative-icon-chosen');
            }
            if (cell["format"]["italic"]) {
                $(`#${cellId}_italic`).addClass('iterative-icon-chosen');
            }
            if (cell["format"]["underline"]) {
                $(`#${cellId}_underline`).addClass('iterative-icon-chosen');
            }
            if (cell["format"]["strike"]) {
                $(`#${cellId}_strike`).addClass('iterative-icon-chosen');
            }
            if (cell["format"]["horizontal_align"] === "left") {
                $(`#${cellId}_left`).addClass('iterative-icon-chosen');
            } else if (cell["format"]["horizontal_align"] === "center") {
                $(`#${cellId}_center`).addClass('iterative-icon-chosen');
            } else if (cell["format"]["horizontal_align"] === "right") {
                $(`#${cellId}_right`).addClass('iterative-icon-chosen');
            } else {
                $(`#${cellId}_justify`).addClass('iterative-icon-chosen');
            }
            if (cell["format"]["vertical_align"] === "top") {
                $(`#${cellId}_align-up`).addClass('iterative-icon-chosen');
            } else if (cell["format"]["vertical_align"] === "middle") {
                $(`#${cellId}_align-center`).addClass('iterative-icon-chosen');
            } else if (cell["format"]["vertical_align"] === "bottom") {
                $(`#${cellId}_align-down`).addClass('iterative-icon-chosen');
            } else {
                $(`#${cellId}_align-center`).addClass('iterative-icon-chosen');
            }
            if (cell["format"]["border_left"]) {
                $(`#${cellId}_border-left`).addClass('iterative-icon-chosen');
            }
            if (cell["format"]["border_top"]) {
                $(`#${cellId}_border-top`).addClass('iterative-icon-chosen');
            }
            if (cell["format"]["border_right"]) {
                $(`#${cellId}_border-right`).addClass('iterative-icon-chosen');
            }
            if (cell["format"]["border_bottom"]) {
                $(`#${cellId}_border-bottom`).addClass('iterative-icon-chosen');
            }
            if (cell["format"]["border_bold"]) {
                $(`#${cellId}_border-bold`).addClass('iterative-icon-chosen');
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
            let justifyIcon = $(`<div style="display:none;" id="cell_${letter}_justify" class="iterative-xblock-formatting-icon iterative-icon-chosen"><i class="fa fa-align-justify"></i></div>`);
            let alignUpIcon = $(`<div style="display:none;" id="cell_${letter}_align-up" class="iterative-xblock-formatting-icon"><i class="fa fa-long-arrow-up"></i></div>`);
            let alignCenterIcon = $(`<div style="display:none;" id="cell_${letter}_align-center" class="iterative-xblock-formatting-icon iterative-icon-chosen"><i class="fa fa-long-arrow-right"></i></div>`);
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
            let placeholderInput = $(`<input style="display:none;" id="cell_${letter}_placeholder" class="setting-input cell_${letter}_placeholder cell-input-small" type="text" placeholder="Placeholder" value="...">`);
            let minCharsInput = $(`<input style="display:none;" id="cell_${letter}_min_chars" class="setting-input cell_${letter}_min_chars cell-input-small" type="number" placeholder="Mínimo de caracteres" value="20">`);
            let minWordsInput = $(`<input style="display:none;" id="cell_${letter}_min_words" class="setting-input cell_${letter}_min_words cell-input-small" type="number" placeholder="Mínimo de palabras" value="0">`);
            let requiredInput = $(`<select style="display:none;" id="cell_${letter}_required" class="setting-select-input cell_${letter}_required cell-input-small"></select>`);
            requiredInput.append($(`<option selected value="required">Obligatorio</option>`));
            requiredInput.append($(`<option value="optional">Opcional</option>`));
            extraInputsContainer.append(placeholderInput);
            extraInputsContainer.append(minCharsInput);
            extraInputsContainer.append(minWordsInput);
            extraInputsContainer.append(requiredInput);
            let seemore = $(`<div style="display: none;" class="iterative-xblock-seemore"><i class="fa fa-eye"></i></div>`);
            inputsContainer.append(seemore);
            inputsContainer.append(extraInputsContainer);
            inputsContainer.append(formattingInputs);
            wrapper.append(inputsContainer);
            letterContainer.append(wrapper);
            container.append(letterContainer);
        }
    }

    function triggerSeemore(cellId, show) {
        let seemore = $(element).find(`#input_${cellId}`).find('.iterative-xblock-seemore');
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
        if (show) {
            if (seemore.hasClass('iterative-xblock-seemore-text')) {
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
            } else if (seemore.hasClass('iterative-xblock-seemore-iframe')) {
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
            } else if (seemore.hasClass('iterative-xblock-seemore-question')) {
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
            } else if (seemore.hasClass('iterative-xblock-seemore-answer')) {
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
        if (show) {
            if (seemore.hasClass('iterative-xblock-seemore-text')) {
                placeholderInput.css('display', 'none');
                minCharsInput.css('display', 'none');
                minWordsInput.css('display', 'none');
                requiredInput.css('display', 'none');
                extraInputsContainer.css('display', 'none');
            } else if (seemore.hasClass('iterative-xblock-seemore-iframe')) {
                placeholderInput.css('display', 'none');
                minCharsInput.css('display', 'none');
                minWordsInput.css('display', 'none');
                requiredInput.css('display', 'none');
                extraInputsContainer.css('display', 'none');
            } else if (seemore.hasClass('iterative-xblock-seemore-question')) {
                placeholderInput.css('display', 'flex');
                placeholderInput.attr('placeholder', 'Placeholder');
                placeholderInput.val(placeholder.val() !== "Placeholder" ? placeholder.val() : "Placeholder");
                minCharsInput.css('display', 'flex');
                minWordsInput.css('display', 'flex');
                requiredInput.css('display', 'flex');
                extraInputsContainer.css('display', 'flex');
            } else if (seemore.hasClass('iterative-xblock-seemore-answer')) {
                placeholderInput.css('display', 'flex');
                placeholderInput.attr('placeholder', 'Texto del botón');
                placeholderInput.val(placeholder.val() !== "Ver respuesta" ? placeholder.val() : "Ver respuesta");
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
    }

    $(element).on('click', '.iterative-xblock-seemore', function (eventObject) {
        let cellId = $(this).parent().parent().parent().attr('id').replace('input_', '');
        let show = $(this).parent().find(".iterative-xblock-extra-inputs").css('display') === 'none' && $(this).parent().find(".iterative-xblock-formatting-inputs").css('display') === 'none';
        triggerSeemore(cellId, show);
    });

    $(element).on('click', '.iterative-xblock-formatting-icon', function (eventObject) {
        let icon = $(this);
        if (icon.attr('id').includes('bold') || icon.attr('id').includes('italic') || icon.attr('id').includes('underline') || icon.attr('id').includes('strike')) {
            if (icon.hasClass('iterative-icon-chosen')) {
                icon.removeClass('iterative-icon-chosen');
            } else {
                icon.addClass('iterative-icon-chosen');
            }
        }
        if (icon.attr('id').includes('left') || icon.attr('id').includes('center') || icon.attr('id').includes('right') || icon.attr('id').includes('justify')) {
            let cellId = icon.attr('id').replace('_left', '').replace('_center', '').replace('_right', '').replace('_justify', '');
            $(element).find(`#${cellId}_left`).removeClass('iterative-icon-chosen');
            $(element).find(`#${cellId}_center`).removeClass('iterative-icon-chosen');
            $(element).find(`#${cellId}_right`).removeClass('iterative-icon-chosen');
            $(element).find(`#${cellId}_justify`).removeClass('iterative-icon-chosen');
            icon.addClass('iterative-icon-chosen');
        }
        if (icon.attr('id').includes('align-up') || icon.attr('id').includes('align-center') || icon.attr('id').includes('align-down')) {
            let cellId = icon.attr('id').replace('_align-up', '').replace('_align-center', '').replace('_align-down', '');
            $(element).find(`#${cellId}_align-up`).removeClass('iterative-icon-chosen');
            $(element).find(`#${cellId}_align-center`).removeClass('iterative-icon-chosen');
            $(element).find(`#${cellId}_align-down`).removeClass('iterative-icon-chosen');
            icon.addClass('iterative-icon-chosen');
        }
        if (icon.attr('id').includes('border-left') || icon.attr('id').includes('border-top') || icon.attr('id').includes('border-right') || icon.attr('id').includes('border-bottom')) {
            if (icon.hasClass('iterative-icon-chosen')) {
                icon.removeClass('iterative-icon-chosen');
            } else {
                icon.addClass('iterative-icon-chosen');
            }
        }
    });

    $(element).on('change', '.cell-input-type', function (eventObject) {
        let cellId = $(this).attr('id').replace('_type', '');
        let cellType = $(this).val();
        let textInput = $(`#${cellId}_text`);
        let urlInput = $(`#${cellId}_url`);
        let questionInput = $(`#${cellId}_question`);
        let answerInput = $(`#${cellId}_answer`);
        let seemore = $(this).parent().find('.iterative-xblock-seemore');
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
            seemore.css('display', 'flex');
        } else if (cellType === "iframe") {
            textInput.hide();
            urlInput.show();
            questionInput.hide();
            answerInput.hide();
            seemore.addClass('iterative-xblock-seemore-iframe');
            seemore.css('display', 'flex');
        } else if (cellType === "question") {
            textInput.hide();
            urlInput.hide();
            questionInput.show();
            answerInput.hide();
            seemore.addClass('iterative-xblock-seemore-question');
            seemore.css('display', 'flex');
        } else if (cellType === "answer") {
            textInput.hide();
            urlInput.hide();
            questionInput.hide();
            answerInput.show();
            seemore.addClass('iterative-xblock-seemore-answer');
            seemore.css('display', 'flex');
        } else {
            textInput.hide();
            urlInput.hide();
            questionInput.hide();
            answerInput.hide();
            seemore.css('display', 'none');
        }
        toggleHiddenInputs(makeContentUI());
        triggerSeemore(cellId, false);
    });

    $(element).find('.apply-button').bind('click', function (eventObject) {
        eventObject.preventDefault();
        setStudioErrorMessage("");
        let grid = makeGrid();
        let letters = validateGrid(grid);
        if (letters == null) {
            setStudioErrorMessage("Grilla inválida. Por favor, verifique que las letras estén en rectángulos y que no haya letras repetidas, ni filas o columnas vacías antes de filas o columnas con letras.");
        } else {
            displayCellsInputs(letters);
        }
    });

    $(element).find('.save-button').bind('click', function (eventObject) {
        eventObject.preventDefault();
        setStudioErrorMessage("");
        content_ui = makeContentUI();
        var handlerUrl = runtime.handlerUrl(element, 'studio_submit');
        var checkQuestionIDsUrl = runtime.handlerUrl(element, 'check_question_ids');
        var original_questions = getQuestionIDs(content_backend["content"])
        var newQuestions = getQuestionIDs(content_ui["content"]).filter(function(questionId) {
            return !original_questions.includes(questionId);
        });
        var removedQuestions = original_questions.filter(function(questionId) {
            return !getQuestionIDs(content_ui["content"]).includes(questionId);
        });
        var data = {
            title: title.val(),
            content: content_ui,
            enable_download: enable_download.val(),
            download_name: download_name.val(),
            submit_message: submit_message.val(),
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