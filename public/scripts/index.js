$(function() {
    $(".btn:first").click(function() {
        $(".index").attr("hidden", "hidden");
        $(".play-info").removeAttr("hidden");
    });
    $(".btn:last").click(function() {
        $(".index").attr("hidden", "hidden");
        $("#info").removeAttr("hidden");
    });
});