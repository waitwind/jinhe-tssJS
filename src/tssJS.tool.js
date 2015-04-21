

/*
 *  左栏
 */
;(function($) {
 
    $.leftbar = function(fn1, fn2) {

        var closeLeftbar = function() {
                $(".leftbar").removeClass("leftbar-open").addClass("leftbar-hidden");
            },
            showLeftbar = function() {
                $(".leftbar").removeClass("leftbar-hidden").addClass("leftbar-open");
            };

        var barWidth = 30, f = 0;

        this.init = function() {
            this.createInDomTree();

            $(".leftbar-menu").toggle(fn1, fn2 || fn1);
            $(document).addEvent("mousemove", this.onMouseMove);
        };

        this.createInDomTree = function() {
            var el = $.createElement("div", "leftbar");
            $(el).addClass("leftbar-hidden");
            $(el).html('<div class="leftbar-menu"><span>&nbsp;</span></div>');

            document.body.appendChild(el);
        };
        
        this.onMouseMove = function(ev) {
            ev.stopImmediatePropagation();

            var _x = ev.clientX > 0 ? ev.clientX : 1, 
                i = parseInt(100 / parseInt(document.body.clientWidth / _x, 10), 10), 
                s = !1;

            if (Math.abs(i - f) < 10)
                return;

            $(".leftbar").hasClass("leftbar-open") && _x > barWidth && closeLeftbar();

            if (i >= 10 && i <= 50) {
                var o = barWidth * i * 12 / 100;
                f > i ? s = barWidth - o : s = -o;
                s = Math.ceil(s);
                s > 0 && (s = 0)
            } 
            else {
                i > 50 ? s = -parseInt(barWidth, 10) : i >= 0 && i < 10 && (s = 0);
            }
            
            if (s === 0) {
                showLeftbar();
            }
            f = i;
        };

        this.init();
    }

})(tssJS);


/*
 *  drag / resize
 */
tssJS(function() {
    // 钩子
    $(".moveable").each(function(i, el){
        $(el).drag();
    });

    $(".resizable").each(function(i, el){
        $(el).resize().resize("col").resize("row");
    })
});

tssJS.fn.extend({
    drag: function(handle) {
        var element = this[0];
        handle = handle || $("h1", element)[0] || $("h2", element)[0] || element; // 拖动条
        if(handle == null) return;

        var mouseStart  = {x:0, y:0};  // 鼠标起始位置
        var elementStart = {x:0, y:0};  // 拖动条起始位置

        handle.onmousedown = function(ev) {
            var oEvent = ev || event;
            mouseStart.x  = oEvent.clientX;
            mouseStart.y  = oEvent.clientY;
            elementStart.x = element.offsetLeft;
            elementStart.y = element.offsetTop;

            if (handle.setCapture) {
                handle.onmousemove = doDrag;
                handle.onmouseup = stopDrag;
                handle.setCapture();
            } else {
                document.addEventListener("mousemove", doDrag, true);
                document.addEventListener("mouseup", stopDrag, true);
            }
        };

        function doDrag(ev) {
            ev = ev || event;

            var x = ev.clientX - mouseStart.x + elementStart.x;
            var y = ev.clientY - mouseStart.y + elementStart.y;

            element.style.left = x + "px";
            element.style.top  = y + "px";
        };

        function stopDrag() {
            if (handle.releaseCapture) {
                handle.onmousemove = handle.onmouseup = null;
                handle.releaseCapture();
            } else {
                document.removeEventListener("mousemove", doDrag, true);
                document.removeEventListener("mouseup", stopDrag, true);
            }
        };

        return this;
    },

    resize: function(type) {
        var element = this[0];

        var handle = document.createElement("DIV"); // 拖动条
        var cssText = "position:absolute;overflow:hidden;z-index:3;";
        if (type == "col") {
            handle.style.cssText = cssText + "cursor:col-resize;top:0px;right:0px;width:3px;height:100%;";
        } else if(type == "row") {
            handle.style.cssText = cssText + "cursor:row-resize;left:0px;bottom:0px;width:100%;height:3px;";
        } else {
            handle.style.cssText = cssText + "cursor:nw-resize;right:0px;bottom:0px;width:8px;height:8px;background:#99CC00";
        }
        
        element.appendChild(handle);

        var mouseStart  = {x:0, y:0};  // 鼠标起始位置
        var handleStart = {x:0, y:0};  // 拖动条起始位置

        handle.onmousedown = function(ev) {
            var oEvent = ev || event;
            mouseStart.x  = oEvent.clientX;
            mouseStart.y  = oEvent.clientY;
            handleStart.x = handle.offsetLeft;
            handleStart.y = handle.offsetTop;

            document.addEventListener("mousemove", doDrag, true);
            document.addEventListener("mouseup", stopDrag, true);
        };

        function doDrag(ev) {
            var oEvent = ev || event;

            // 水平移动距离
            if (type == "col" || type == null) {
                var _width = oEvent.clientX - mouseStart.x + handleStart.x + handle.offsetWidth;
                if (_width < handle.offsetWidth) {
                    _width = handle.offsetWidth;
                } 
                else if (_width > document.documentElement.clientWidth - element.offsetLeft) {
                    _width = document.documentElement.clientWidth - element.offsetLeft - 2; // 防止拖出窗体外
                }
                element.style.width = _width + "px";
            }

            // 垂直移动距离
            if (type == "row" || type == null) {
                var _height = oEvent.clientY - mouseStart.y + handleStart.y + handle.offsetHeight;
                if (_height < handle.offsetHeight) {
                    _height = handle.offsetHeight;
                } 
                else if (_height > document.documentElement.clientHeight - element.offsetTop) {
                    _height = document.documentElement.clientHeight - element.offsetTop - 2; // 防止拖出窗体外
                }
                element.style.height = _height + "px";
            }
        };

        function stopDrag() {
            document.removeEventListener("mousemove", doDrag, true);
            document.removeEventListener("mouseup", stopDrag, true);
        };

        return this;
    }
});