/**
 * Created by Alexqiqing on 16/9/26.
 */
var plugin = (function ($) {

    var bootstrapGrowl = function (content, opts) {
        var growlOptions = {
            type: 'danger', // (null, 'info', 'danger', 'success')
            offset: {from: 'top', amount: 200}, // 'top', or 'bottom'
            align: 'center', // ('left', 'right', or 'center')
            width: 300, // (integer, or 'auto')
            delay: 3000 // Time while the message will be displayed. It's not equivalent to the *demo* timeOut!
        };

        var config = $.extend({}, growlOptions, opts);

        $.bootstrapGrowl(content, opts);

    };

    var bootstrapAlert = function (content, opts) {
        $('#alert').alert('close');

        var defaultOptions = {
            type: 'warning', // ('success', 'warning')
            appendTo: 'body', // id or class, default body
            delay: 2000 // Time while the message will be displayed. It's not equivalent to the *demo* timeOut!
        };

        var config = $.extend({}, defaultOptions, opts);

        var alertHtml = '<div id="alert" style="display: none;" class="alert alert-' + config.type + '"><strong>' +
            content + '</strong></div>';

        if (config.appendTo != 'body') {
            var ele = $('#' + config.appendTo).length > 0 ? $('#' + config.appendTo) : $('.' + config.appendTo);
            if (ele.length > 0) {
                ele.parent().append(alertHtml);
            } else {
                alert("element not found, please check variable appendTo");
                return;
            }
        } else {
            $(config.appendTo).append(alertHtml);
        }

        $('#alert').css('display', 'block');
        setTimeout("$('#alert').alert('close')", config.delay);
    };

    return {
        bootstrapGrowl: bootstrapGrowl,
        bootstrapAlert: bootstrapAlert
    }

})(jQuery);