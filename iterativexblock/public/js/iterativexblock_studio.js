function IterativeAssessedActivityStudio(runtime, element, settings) {
    let input_title = $(element).find("#input_title");
    let title = $(element).find("#title");

    function validate(data) {
        if (data["title"] === "") {
            return "Please provide a title for this XBlock."
        }
        return "";
    }

    function showMessage(msg) {
        $(element).find('.studio-error-msg').html(msg);
    }


    $(element).find('.save-button').bind('click', function (eventObject) {
        eventObject.preventDefault();
        var handlerUrl = runtime.handlerUrl(element, 'studio_submit');
        var data = {
            title: title.val()
        };
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

    function onLoad() {
        input_title.removeAttr("hidden");
        title.val("Iterative XBlock");
    }
    onLoad();
}