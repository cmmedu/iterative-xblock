# Iterative XBlock

Iterative XBlock is a potent educational tool designed for integration into [edX courses](https://www.edx.org/). This tool enables the incorporation of open-response questions whose answers can be referenced in later parts of the course.

Here are some example use cases:

- At the start of a course, a diagnostic question is posed to students. Toward the course's conclusion, students have the opportunity to address the same question again and review their initial responses to assess their learning progress.
- Students are tasked with constructing a document throughout the duration of the course. This document is segmented into various parts, each written at different stages of the course. Students may have the opportunity to revise some of their responses. Upon conclusion of the course, the most recent responses from each section are compiled into a cohesive PDF document.


## Installation

The installation method for Iterative XBlock may differ based on your Open edX setup. You are encouraged to consult the [official documentation](https://edx.readthedocs.io/projects/edx-installing-configuring-and-running/en/latest/configuration/install_xblock.html) for detailed guidance.

To activate Iterative XBlock in a course, it needs to be added to the list of advanced modules. This can be done in the course's advanced settings by entering `iterativexblock` as the module name.

## How to use

To incorporate an Iterative XBlock into your course, proceed to a specific unit within Studio, select "Advanced" from the options, and then choose "Iterative XBlock." This action will add an empty XBlock to the unit. Note that this XBlock will not appear in the LMS until it has been properly configured.

### Configuring content

The structure of each Iterative XBlock resembles a table, allowing for the addition of up to 9 rows of content. Each row can consist of 1 to 4 cells, with each cell capable of containing one of the following types of content:

- Fixed text: Simply text, utilized for providing context.
- Question: An open-ended question assigned a unique ID within the course.
- Answer: Corresponds to the ID of a question defined in another Iterative XBlock within the course. This enables the display of a student's answer to that specific question.

### Additional configuration

The customization of the Iterative XBlock can be done with the following options:

- **Title**: Specifies the module's title. If this field is left blank, no title will be displayed.
- **Style**: Determines the module's appearance. A variety of stylesheets are available to choose from.
- **Min questions**: Sets the minimum number of questions a student is required to answer. Setting this value to 0 mandates that all questions must be answered. This option is accessible only when at least one question is defined.
- **Enable download**: Allows for the downloading of the XBlock content as a PDF document. This functionality is only enabled if there are no questions within the module.
- **Submit button message**: Defines the text displayed on the submit button.
- **Submitted button message**: Indicates the text that appears on the submit button after a student submits an answer.
- **Display button message**: Text displayed on buttons used to view previous answers.
- **No answer message**: Message displayed in the event that no previous answer is available.

### Scoring

Once a student submits a valid response to an Iterative XBlock, a score of 1 is automatically assigned. If the XBlock does not contain any defined questions, it will automatically assign a score of 1 upon its first display to the student.


## License

...