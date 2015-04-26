
/* tip, 提示气泡 */
;(function($, factory) {

    $.Bubble = $.Balloon = factory($);

    $.notice = function(targetEl, msg) {
        var balloon = new $.Bubble(msg);
        balloon.dockTo(targetEl);
    };

    $.fn.extend({
        notice: function(msg, delay) {
            if(this.length > 0) {
                $.notice(this[0], msg);
            }
        }
    });

})(tssJS, function($){
    'use strict';

    var _STYLE_BUBBLE = "tssJS-bubble",
        _STYLE_ARROW_TOP = "tssJS-bubble-arrow-top",
        _STYLE_ARROW_BOTTOM = "tssJS-bubble-arrow-bottom",      
        NEXT_ZINDEX  = 1000,
        BUBBLE_WIDTH = 200,
        ARROW_HEIGHT = 15,

    timeout,
    dispose = function() {
        var buddles = $("." + _STYLE_BUBBLE);
        buddles.each(function() {
            $.removeNode(this);
        });
        
        $(document).removeEvent("mousedown", dispose);
    },

    Bubble = function(content) {
        this.el = $.createElement("div", _STYLE_BUBBLE);
        $(this.el).html("<p>" + content + "</p>");
        $(this.el).css("width", BUBBLE_WIDTH + "px");

        // 绑定事件，鼠标按下后气球消失
        $(document).addEvent("mousedown", dispose);
    };

    Bubble.prototype.dockTo = function(targetEl, delay){
        var position = $.absPosition(targetEl), 
            x = position.left + targetEl.offsetWidth/2 - BUBBLE_WIDTH/2, 
            y;

        if( position.top + 50 >= document.body.clientHeight) {
            y = position.top - targetEl.offsetHeight - ARROW_HEIGHT * 4 - this.el.offsetHeight; 
            $(this.el).addClass(_STYLE_ARROW_BOTTOM);
        }
        else {
            y = position.top + ARROW_HEIGHT;
            $(this.el).addClass(_STYLE_ARROW_TOP);
        } 
        
        $(this.el).css("zIndex", NEXT_ZINDEX++).css("left", x + "px").css("top", y + "px");
        document.body.appendChild(this.el);

        clearTimeout(timeout);
        timeout = setTimeout( dispose, delay || 3000 );
    }

    return Bubble;
});


(function($) {

    var popupBox = function(title, callback) {
            var $box = $("#alert_box");
            if($box.length > 0) {
                $box.remove();
            }

            var boxEl = $.createElement("div", "moveable", "alert_box");
            document.body.appendChild(boxEl);

            var html = [];
            html.push('  <h1 class="title"></h1>');
            html.push('  <span class="close"></span>');
            html.push('  <div class="content">');
            html.push('    <div class="message"></div>');
            html.push('    <div class="btbox"><input type="button" value="确 定" class="ok"></div>');
            html.push('  </div>');

            $box = $(boxEl).html(html.join("\n")).show().drag();
            $(".close", boxEl).click(closeBox);
            $("h1", boxEl).html(title).addClass("text2");
            $(".content .message", boxEl).addClass("text1");

            $(boxEl).center(360, 300);   
            callback && $.showWaitingLayer();

            $.Event.addEvent(document, "keydown", function(ev) {
                if(27 == ev.keyCode) { // ESC 退出
                   closeBox();
                }
            });

            return $box[0];
        },

        closeBox = function() {
            $("#alert_box").hide().remove();
            $.hideWaitingLayer();
        },

        // 检查是否在texteara外按了enter键
        checkEnterPress = function(ev){
            var srcElement = $.Event.getSrcElement(ev);
            var tagName = srcElement.tagName.toLowerCase();
            return 13 == ev.keyCode && "textarea" != tagName;
        };


    // content：内容，title：对话框标题，callback：回调函数    
    $.alert = function(content, title, callback) {
        var boxEl = popupBox(title || '提示', callback);
        $(".content", boxEl).addClass("alert");
        $(".content .message", boxEl).html(content);

        function ok() {
            closeBox();
            callback && callback();
        }
        $(".btbox .ok", boxEl).click(ok);
        $.Event.addEvent(document, "keydown", function(ev) {
            if( checkEnterPress(ev) ) { 
               setTimeout(ok, 10);
            }
        });
    };

    // content：内容，title：对话框标题，callback：回调函数
    $.confirm = function(content, title, callback, cancelCallback){
        var boxEl = popupBox(title || '确认框', callback);
        $(".content", boxEl).addClass("confirm");
        $(".content .message", boxEl).html(content || '你确认此操作吗?');
        $(".btbox", boxEl).html($(".btbox", boxEl).html() + '<input type="button" value="取 消" class="cancel">');

        function ok(result) {
            closeBox();
            if(result) {
                callback && callback();
            } else {
                cancelCallback && cancelCallback();
            }
        }
        $(".btbox .ok", boxEl).click(function() { ok(true); });
        $(".btbox .cancel", boxEl).click(function() { ok(false); });
        $.Event.addEvent(document, "keydown", function(ev) {
            if( checkEnterPress(ev) ) { 
               setTimeout( function() { ok(true); }, 10);
            }
        });
    };

    // content：内容，deinput：输入框的默认值，title：对话框标题，callback：回调函数
    $.prompt = function(content, title, callback, deinput){
        var boxEl = popupBox(title || '输入框', callback);
        $(".content", boxEl).addClass("prompt");
        $(".content .message", boxEl).html( (content || "请输入：") + ':<br><input type="text">' );
        $(".content .message input", boxEl).value(deinput || '');
        $(".btbox", boxEl).html($(".btbox", boxEl).html() + '<input type="button" value="取 消" class="cancel">');       

        function ok() {
            var value = $(".content .message input", boxEl).value();

            closeBox();
            callback && callback(value);
        }
        $(".btbox .ok", boxEl).click(ok);
        $(".btbox .cancel", boxEl).click(closeBox);

        $.Event.addEvent(document, "keydown", function(ev) {
            if( checkEnterPress(ev) ) { 
               setTimeout(ok, 10);
            }
        });
    };

})(tssJS);