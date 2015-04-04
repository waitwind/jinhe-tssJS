

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

            $(".leftbar-menu").toggle(fn1, fn2);
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

            if (Math.abs(i - f) < 5)
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