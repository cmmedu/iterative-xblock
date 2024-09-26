def adapt_content(content):
    if "n_rows" not in content:
        return content
    new_content = {
        "grid": [
            ["" for i in range(10)] for j in range(10)
        ],
        "content": {}
    }
    current_letter = "a"
    max_cols = 1
    max_rows = 1
    for row_id in range(1, content["n_rows"] + 1):
        row = content[str(row_id)]
        for col_id in range(1, row["n_cells"] + 1):
            if col_id > max_cols:
                max_cols = col_id
            cell = row[str(col_id)]
            new_content["grid"][row_id - 1][col_id - 1] = current_letter
            new_content["content"][current_letter] = {
                "type": cell["type"],
                "content": cell["content"],
                "formatting": {
                    "horizontal_align": cell["alignment"],
                    "vertical_align": "middle",
                    "bold": cell["bold"],
                    "italic": cell["italic"],
                    "underline": cell["underline"],
                    "strike": cell["strikethrough"],
                    "border_left": False,
                    "border_right": False,
                    "border_top": False,
                    "border_bottom": False,
                    "border_bold": False
                },
                "metadata": {
                    "placeholder": "Ver respuesta" if cell["type"] == "answer" else "Placeholder",
                    "min_chars": "0",
                    "min_words": "0",
                    "required": "required"
                }
            }
            current_letter = chr(ord(current_letter) + 1)
        if row_id > max_rows:
            max_rows = row_id
    for i in range(max_rows):
        for j in range(max_cols):
            if new_content["grid"][i][j] == "":
                new_content["grid"][i][j] = "."
    return new_content



