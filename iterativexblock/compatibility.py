from copy import deepcopy


def make_grid_template_areas(grid):
    grid_areas = [" ".join(row if (row and row != ".") else '.' for row in grid_row) for grid_row in grid]
    return grid_areas


def trim_grid(content):
    # Initialize a 10x10 grid as the default size
    grid = content["grid"]
    
    # Find the maximum non-empty row and column
    max_rows = 0
    max_cols = 0

    # Loop through the grid to determine the real boundaries (non-empty)
    for row_id, row in enumerate(grid):
        for col_id, cell in enumerate(row):
            if cell != "":  # We found a non-empty cell
                if row_id + 1 > max_rows:
                    max_rows = row_id + 1
                if col_id + 1 > max_cols:
                    max_cols = col_id + 1

    # Now trim the grid by keeping only up to the max_rows and max_cols found
    trimmed_grid = [row[:max_cols] for row in grid[:max_rows]]

    return trimmed_grid


def adapt_content(content):
    if "n_rows" not in content:
        new_content = deepcopy(content)
        new_content["grid"] = trim_grid(new_content)
        new_content["true_grid"] = make_grid_template_areas(new_content["grid"])
        return new_content
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
                "format": {
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
                    "border_bold": False,
                    "cell_background": "efefef",
                    "cell_color": "000000",
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
