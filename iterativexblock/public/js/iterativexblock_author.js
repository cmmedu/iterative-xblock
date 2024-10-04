function IterativeXBlockAuthor(runtime, element, settings) {

    $(function ($) {
        var iteraid = "iterative_" + settings.location;
        //console.log(iteraid);
		renderMathForSpecificElements(iteraidx);
    });

    function renderMathForSpecificElements(id) {
        //console.log("Render Mathjax in " + id);
        if (typeof MathJax !== "undefined") {
            var $container = $('#' + id);
            if ($container.length) {
                $container.find('.exptop, .expmid, .expbot').each(function (index, contaelem) {
                    MathJax.Hub.Queue(["Typeset", MathJax.Hub, contaelem]);
                });
            }
        } else {
            console.warn("MathJax no está cargado.");
        }
    }
}