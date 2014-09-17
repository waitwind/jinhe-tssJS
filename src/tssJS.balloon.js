;(function ($, factory) {

    $.Balloon = factory();

})(tssJS, function () {

    'use strict';

    var
        /* 样式名称 */
        _STYLE_BALLOON = "balloon",
     
        /* 尺寸 */
        _SIZE_BALLOON_ARROW_HEIGHT = 15,
        _SIZE_BALLOON_CONTENT_WIDTH = 210,
        _SIZE_BALLOON_CONTENT_HEIGHT = 44,

        NEXT_ZINDEX = 1000,

        timeout, 

        /* 释放气球实例 */
        dispose = function() {
            var balloons = $("." + _STYLE_BALLOON);
            balloons.each(function() {
                $.removeNode(this);
            });
            
            $.Event.removeEvent(document, "mousedown", dispose);
        },
 
        /* 生成气球型提示界面 */
        Balloon = function (content) {
            this.el = $.createElement("div", _STYLE_BALLOON);

            var html = "<table>";
            html += "   <tr><td></td></tr>";
            html += "   <tr><td class='content'><div>" + content + "</div></td></tr>";        
            html += "   <tr><td></td></tr>";
            html += "</table>";
            this.el.innerHTML = html;

            // 绑定事件，鼠标按下后气球消失
            $.Event.addEvent(document, "mousedown", dispose);
        };
     
        /*
         *  定位气球
         *  参数：  number:x       坐标x
                    number:y        坐标y
                    number:delay    延时
                    ------------------------------------
                    object:x        作为参考点的目标对象
                    number:y        延时
         */
        Balloon.prototype.dockTo = function(x, y, delay) {
            if(typeof(x) == "object" && x.nodeType) {
                var position = $.absPosition(x);
                this.dockTo(position.left + x.offsetWidth/2, position.top - x.offsetHeight + 8, y);
            }
            else if(typeof(x) == "number") {
                var type = 1;
                if( (x + _SIZE_BALLOON_CONTENT_WIDTH) > (document.body.clientWidth + document.body.scrollLeft) ) {
                    x -= _SIZE_BALLOON_CONTENT_WIDTH;
                    type += 1;
                }
                if( (y - _SIZE_BALLOON_CONTENT_HEIGHT - _SIZE_BALLOON_ARROW_HEIGHT) < document.body.scrollTop) {
                    type += 2;
                }
                else {
                    y -= _SIZE_BALLOON_CONTENT_HEIGHT + _SIZE_BALLOON_ARROW_HEIGHT;            
                }

                $(this.el).css("zIndex", NEXT_ZINDEX++).css("left", x + "px").css("top", y + "px");

                /* 添加气球箭头  */
                var arrow = $.createElement("div", "arrow_" + type);
                $(arrow).css("width", "30px").css("height", "15px") ;

                var td = $("tr", this.el)[ (type <= 2) ? 2 : 0].childNodes[0];
                td.appendChild(arrow);
                if(type == 1 || type == 3) {
                    td.insertBefore(arrow, td.firstChild);
                } else {
                    td.align = "right";
                }

                // 设置气球持续时间
                clearTimeout(timeout);
                timeout = setTimeout( dispose, delay || 3000);

                document.body.appendChild(this.el);
            }
        };
    
    return Balloon;
});