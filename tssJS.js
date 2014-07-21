(function(window, undefined) {

    var _tssJS = (function() {

        // 构建tssJS对象
        var tssJS = function(selector) {
            return new tssJS.fn.init(selector, parent, rootTssJS);
        },

        version = "1.0.0",

        // Map over the $ in case of overwrite
        _$ = window.$,

        rootTssJS,

        // The deferred used on DOM ready
        readyList = [],

        // Check if a string has a non-whitespace character in it
        rnotwhite = /\S/,

        // Used for trimming whitespace
        trimLeft = /^\s+/,
        trimRight = /\s+$/,

        // Check for digits
        rdigit = /\d/,

        // JSON RegExp
        rvalidchars = /^[\],:{}\s]*$/,

        toString = Object.prototype.toString,
        push = Array.prototype.push,
        slice = Array.prototype.slice,
        trim = String.prototype.trim,
        indexOf = Array.prototype.indexOf,

        ua = navigator.userAgent.toLowerCase(),
        mc = function(e) {
            return e.test(ua)
        },

        isOpera = mc(/opera/),
        isChrome = mc(/\bchrome\b/),
        isWebKit = mc(/webkit/),
        isSafari = !isChrome && mc(/safari/),
        isIE = !isOpera && mc(/msie/),
        supportCanvas = !!document.createElement('canvas').getContext,
        isMobile = mc(/ipod|ipad|iphone|android/gi),

        // [[Class]] -> type pairs
        class2type = {};

        // tssJS对象原型
        tssJS.fn = tssJS.prototype = {

            tssjs: version,

            constructor: tssJS,

            init: function(selector, parent, rootTssJS) {
                // Handle $(""), $(null), or $(undefined)
                if (!selector) {
                    return this;
                }

                // Handle $(DOMElement)
                if (selector.nodeType || selector === document) {
                    this[0] = selector;
                    this.length = 1;
                    return this;
                }

                if (typeof selector === "string") {
                    return this.find(selector);
                }

                if (tssJS.isFunction(selector)) {
                    return rootTssJS.ready(selector);
                }
            },

            size: function() {
                return this.length;
            },

            each: function(callback, args) {
                return tssJS.each(this, callback, args);
            },

            ready: function(fn, args) {
                // Attach the listeners
                tssJS.bindReady.call(this, fn, args);

                return this;
            },
        };

        // Give the init function the tssJS prototype for later instantiation
        tssJS.fn.init.prototype = tssJS.fn;

        // 合并内容到第一个参数中，后续大部分功能都通过该函数扩展
        // 通过tssJS.fn.extend扩展的函数，大部分都会调用通过tssJS.extend扩展的同名函数
        tssJS.extend = tssJS.fn.extend = function(fnMap) {
            fnMap = fnMap || {};
            for (var name in fnMap) {
                this[name] = fnMap[name];
            }

            // Return the modified object
            return this;
        };

        // 在tssJS上扩展静态方法
        tssJS.extend({

            // 释放$的 tssJS 控制权
            // 许多 JavaScript 库使用 $ 作为函数或变量名，tssJS 也一样。
            // 在 tssJS 中，$ 仅仅是 tssJS 的别名，因此即使不使用 $ 也能保证所有功能性。
            // 假如我们需要使用 tssJS 之外的另一 JavaScript 库，我们可以通过调用 $.noConflict() 向该库返回控制权。
            noConflict: function(deep) {
                // 交出$的控制权
                if (window.$ === tssJS) {
                    window.$ = _$;
                }

                return tssJS;
            },

            // Is the DOM ready to be used? Set to true once it occurs.
            isReady: false,

            // Handle when the DOM is ready
            ready: function(fn, args) {
                if (!tssJS.isReady) {
                    // 确保document.body存在
                    if (!document.body) {
                        setTimeout(function() {
                            tssJS.ready(fn, args);
                        },
                        10);
                        return;
                    }

                    // Remember that the DOM is ready
                    tssJS.isReady = true;

                    // If there are functions bound, to execute
                    if (fn) {
                        fn(args);
                    } else {
                        tssJS.each(readyList,
                        function(i, name) {
                            var _ = readyList[i];
                            _.fn.call(_._this, _.args);
                        });

                        readyList = [];
                    }
                }
            },

            bindReady: function(fn, args) {
                readyList.push({
                    "_this": this,
                    "fn": fn,
                    "args": args
                });

                if (document.readyState === "complete") {
                    return setTimeout(tssJS.ready, 1);
                }

                if (document.addEventListener) {
                    document.addEventListener("DOMContentLoaded", DOMContentLoaded, false);
                    window.addEventListener("load", tssJS.ready, false);
                } else if (document.attachEvent) {
                    document.attachEvent("onreadystatechange", DOMContentLoaded);
                    window.attachEvent("onload", tssJS.ready);

                    var toplevel = false;
                    try {
                        toplevel = window.frameElement == null;
                    } catch(e) {}

                    if (document.documentElement.doScroll && toplevel) {
                        doScrollCheck();
                    }
                }
            },

            // 是否函数
            isFunction: function(obj) {
                return tssJS.type(obj) === "function";
            },

            // 是否数组
            isArray: Array.isArray ||
            function(obj) {
                return tssJS.type(obj) === "array";
            },

            // 简单的判断（判断setInterval属性）是否window对象
            isWindow: function(obj) {
                return obj && typeof obj === "object" && "setInterval" in obj;
            },

            // 是否是保留字NaN
            isNaN: function(obj) {
                // 等于null 或 不是数字 或调用window.isNaN判断
                return obj == null || !rdigit.test(obj) || isNaN(obj);
            },

            // 获取对象的类型
            type: function(obj) {
                // 通过核心API创建一个对象，不需要new关键字
                // 普通函数不行
                // 调用Object.prototype.toString方法，生成 "[object Xxx]"格式的字符串
                // class2type[ "[object " + name + "]" ] = name.toLowerCase();
                return obj == null ? String(obj) : class2type[toString.call(obj)] || "object";
            },

            // 是否空对象
            isEmptyObject: function(obj) {
                for (var name in obj) {
                    return false;
                }
                return true;
            },

            "isNullOrEmpty": function(value) {
                return (value == null || (typeof(value) == 'string' && value == ""));
            },

            // 抛出一个异常
            error: function(msg) {
                throw msg;
            },

            // parseJSON把一个字符串变成JSON对象。
            // 我们一般使用的是eval。parseJSON封装了这个操作，但是eval被当作了最后手段。
            // 因为最新JavaScript标准中加入了JSON序列化和反序列化的API。
            // 如果浏览器支持这个标准，则这两个API是在JS引擎中用Native Code实现的，效率肯定比eval高很多。
            // 目前来看，Chrome和Firefox4都支持这个API。
            parseJSON: function(data) {
                if (typeof data !== "string" || !data) {
                    return null;
                }

                // Make sure leading/trailing whitespace is removed (IE can't handle it)
                data = tssJS.trim(data);

                // 原生JSON API。反序列化是JSON.stringify(object)
                if (window.JSON && window.JSON.parse) {
                    return window.JSON.parse(data);
                }

                // ... 大致地检查一下字符串合法性
                if (rvalidchars.test(data.replace(rvalidescape, "@").replace(rvalidtokens, "]").replace(rvalidbraces, ""))) {

                    return (new Function("return " + data))();

                }
                tssJS.error("Invalid JSON: " + data);
            },

            // 解析XML 跨浏览器
            // parseXML函数也主要是标准API和IE的封装。
            // 标准API是DOMParser对象。
            // 而IE使用的是Microsoft.XMLDOM的 ActiveXObject对象。
            parseXML: function(data, xml, tmp) {

                if (window.DOMParser) { // Standard 标准XML解析器
                    tmp = new DOMParser();
                    xml = tmp.parseFromString(data, "text/xml");
                } else { // IE IE的XML解析器
                    xml = new ActiveXObject("Microsoft.XMLDOM");
                    xml.async = "false";
                    xml.loadXML(data);
                }

                tmp = xml.documentElement;

                if (!tmp || !tmp.nodeName || tmp.nodeName === "parsererror") {
                    alert("Invalid XML: " + data);
                }

                return xml;
            },

            // globalEval函数把一段脚本加载到全局context（window）中。
            // IE中可以使用window.execScript, 其他浏览器 需要使用eval。
            // 因为整个tssJS代码都是一整个匿名函数，所以当前context是tssJS，如果要将上下文设置为window则需使用globalEval。
            globalEval: function(data) {
                if (data && /\S/.test(data)) { // data非空
                    // use execScript on IE
                    // use an anonymous function so that context is window rather than tssJS in Firefox
                    (window.execScript ||
                    function(data) {
                        window["eval"].call(window, data);
                    })(data);
                }
            },

            "executeCommand": function(callback, param) {
                var returnVal;
                try {
                    if(isFunction(callback)) {
                        returnVal = callback(param);
                    }
                    else {
                        returnVal = eval(callback + "(" + param + ")");
                    }
                } catch (e) {
                    alert(e.message);
                    returnVal = false;
                }
                return returnVal;
            },

            // 遍历对象或数组
            each: function(object, callback, args) {
                var name, i = 0,
                length = object.length,
                isObj = length === undefined || tssJS.isFunction(object);

                // 如果有参数args，调用apply，上下文设置为当前遍历到的对象，参数使用args
                if (args) {
                    if (isObj) {
                        for (name in object) {
                            if (callback.apply(object[name], args) === false) {
                                break;
                            }
                        }
                    } else {
                        for (; i < length;) {
                            if (callback.apply(object[i++], args) === false) {
                                break;
                            }
                        }
                    }
                }
                // 没有参数args则调用，则调用call，上下文设置为当前遍历到的对象，参数设置为key/index和value
                else {
                    if (isObj) {
                        for (name in object) {
                            if (callback.call(object[name], name, object[name]) === false) {
                                break;
                            }
                        }
                    } else {
                        for (; i < length;) {
                            if (callback.call(object[i], i, object[i++]) === false) {
                                break;
                            }
                        }
                    }
                }

                return object;
            },

            // 尽可能的使用本地String.trim方法，否则先过滤开头的空格，再过滤结尾的空格
            trim: trim ?
            function(text) {
                return trim.call(text);
            }:
            // Otherwise use our own trimming functionality
            function(text) {
                return text.toString().replace(trimLeft, "").replace(trimRight, "");
            },

            // 过滤数组，返回新数组；callback返回true时保留
            grep: function(elems, callback) {
                var ret = [],
                retVal;

                for (var i = 0,
                length = elems.length; i < length; i++) {
                    retVal = !!callback(elems[i], i);
                    if (retVal) {
                        ret.push(elems[i]);
                    }
                }

                return ret;
            },

            /* 缓存页面数据（xml、变量等） */
            "cache": {
                "Variables": {},
                "XmlDatas":  {}
            },

            /* 负责生成对象唯一编号（为了兼容FF） */
            "uid": 0,
            "getUniqueID": function(prefix) {
                return (prefix || "_default_id_") + String(uid ++ );
            },

            // 获取当前时间的便捷函数
            now: function() {
                return (new Date()).getTime();
            }
        });

        // Populate the class2type map
        tssJS.each("Boolean Number String Function Array Date RegExp Object".split(" "),
        function(i, name) {
            class2type["[object " + name + "]"] = name.toLowerCase();
        });

        var DOMContentLoaded = (function() {
            if (document.addEventListener) {
                return function() {
                    document.removeEventListener("DOMContentLoaded", DOMContentLoaded, false);
                    tssJS.ready();
                };
            } else if (document.attachEvent) {
                return function() {
                    if (document.readyState === "complete") {
                        document.detachEvent("onreadystatechange", DOMContentLoaded);
                        tssJS.ready();
                    }
                };
            }
        })();

        var doScrollCheck = function() {
            if (isReady) {
                return;
            }
            try {
                document.documentElement.doScroll("left");
            } catch(e) {
                setTimeout(doScrollCheck, 1);
                return;
            }
            tssJS.ready();
        }

        rootTssJS = tssJS(document);

        // Expose tssJS to the global object
        // 到这里，tssJS对象构造完成，后边的代码都是对tssJS或tssJS对象的扩展
        return tssJS;

    })();

    /**
     * Add useful method
     */
    Array.prototype.each = function(f, s) {
        var j = this.length,
        r;
        for (var i = 0; i < j; i++) {
            r = s ? f.call(s, this[i], i) : f(this[i], i);
            if (typeof r === "boolean" && !r) {
                break
            }
        };
        return this;
    };

    Array.prototype.sort = function(f) {
        var _ = this,
        L = _.length - 1;

        for (var i = 0; i < L; i++) {
            for (var j = L; j > i; j--) {　　
                if (f ? !f(_[j], _[j - 1]) : (_[j] < _[j - 1])) {　　
                    var T = _[j];　　_[j] = _[j - 1];　　_[j - 1] = T;
                }
            }
        }
    };

    Array.prototype.contains = function(obj) {
        var i = this.length;
        while (i--) {
            if (this[i] === obj) {
                return true;
            }
        }
        return false;
    }

    String.prototype.convertEntry = function() {
        return this.replace(/\&/g, "&amp;").replace(/\"/g, "&quot;").replace(/\</g, "&lt;").replace(/\>/g, "&gt;");
    }

    String.prototype.revertEntity = function() {
        return this.replace(/&quot;/g, "\"").replace(/&lt;/g, "\<").replace(/&gt;/g, "\>").replace(/&amp;/g, "\&");
    }

    String.prototype.convertCDATA = function() {
        return this.replace(/\<\!\[CDATA\[/g, "&lt;![CDATA[").replace(/\]\]>/g, "]]&gt;");
    }

    String.prototype.revertCDATA = function() {
        return this.replace(/&lt;\!\[CDATA\[/g, "<![CDATA[").replace(/\]\]&gt;/g, "]]>");
    }

    Date.prototype.format = function(format) {
        var o = {
            "M+": this.getMonth() + 1,
            "d+": this.getDate(),
            "h+": this.getHours(),
            "m+": this.getMinutes(),
            "s+": this.getSeconds(),
            "q+": Math.floor((this.getMonth() + 3) / 3),
            // quarter
            "S": this.getMilliseconds() //millisecond
        }

        if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        }

        for (var k in o) {
            if (new RegExp("(" + k + ")").test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
            }
        }
        return format;
    }

    window.tssJS = window.$ = _tssJS;

})(window);

// 扩展tssJS 单元测试的静态方法
; (function($) {
    $.extend({
        /* 前台单元测试断言 */
        "assertEquals": function(actual, expect, msg) {
            if (expect != actual) {
                alert(msg || "" + "[expect: " + expect + ", actual: " + actual + "]");
            }
        },

        "assertTrue": function(result, msg) {
            if (!result && msg) {
                alert(msg);
            }
        },

        "assertNotNull": function(result, msg) {
            if (result == null && msg) {
                $.error(msg);
            }
        }
    });
})(tssJS);

// 扩展tssJS原型方法
; (function($) {
    $.fn.extend({

        "find": function(selector, parent) {
            var elements = [];
            switch (selector.charAt(0)) {
            case '#':
                elements[0] = $.getElementById(selector.substring(1));
                break;
            case '.':
                elements = $.getElementsByClass(selector.substring(1), parent);
                break;
            default:
                elements = $.getElementsByTag(selector, parent);
            }

            this.length = elements.length;
            for (var i = 0; i < this.length; i++) {
                this[i] = elements[i];
            }

            return this;
        },

        //设置CSS
        "css": function(attr, value) {
            for (var i = 0; i < this.length; i++) {
                var element = this[i];
                if (arguments.length == 1) {
                    return $.getStyle(element, attr);
                }
                element.style[attr] = value;
            }
            return this;
        },

        // 添加Class
        "addClass": function(className) {
            for (var i = 0; i < this.length; i++) {
                var element = this[i];
                if (!hasClass(element, className)) {
                    element.className += ' ' + className;
                }
            }
            return this;
        },

        // 移除Class
        "removeClass": function(className) {
            var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
            for (var i = 0; i < this.length; i++) {
                var element = this[i];
                if (hasClass(element, className)) {
                    element.className = element.className.replace(reg, ' ');
                }
            }
            return this;
        },

        // 设置innerHTML
        "html": function(str) {
            for (var i = 0; i < this.length; i++) {
                var element = this[i];
                if (arguments.length == 0) {
                    return element.innerHTML;
                }
                element.innerHTML = str;
            }
            return this;
        },

        // 设置鼠标移入移出方法
        "hover": function(over, out) {
            for (var i = 0; i < this.length; i++) {
                addEvent(this[i], 'mouseover', over);
                addEvent(this[i], 'mouseout', out);
            }
            return this;
        },

        // 设置点击切换方法
        "toggle": function() {
            for (var i = 0; i < this.length; i++) { (function(element, args) {
                    var count = 0;
                    addEvent(element, 'click',
                    function() {
                        args[count++%args.length].call(this);
                    });
                })(this[i], arguments);
            }
            return this;
        },

        //设置显示
        "show": function() {
            for (var i = 0; i < this.length; i++) {
                this[i].style.display = 'block';
            }
            return this;
        },

        //设置隐藏
        "hide": function() {
            for (var i = 0; i < this.length; i++) {
                this[i].style.display = 'none';
            }
            return this;
        },

        //设置物体居中
        "center": function(width, height) {
            var top = (getInner().height - 250) / 2;
            var left = (getInner().width - 350) / 2;
            for (var i = 0; i < this.length; i++) {
                this[i].style.top = top + 'px';
                this[i].style.left = left + 'px';
            }
            return this;
        },

        //触发点击事件
        "click": function(fn) {
            for (var i = 0; i < this.length; i++) {
                this[i].onclick = fn;
            }
            return this;
        }
    });
})(tssJS);

// 扩展tssJS操作HTML DOMElement的静态方法
; (function($) {
    $.extend({
        "getElementById": function(id) {
            return document.getElementById(id);
        },

        "getElementsByTag": function(tag, parentNode) {
            var node = parentNode ? parentNode: document;
            return node.getElementsByTagName(tag);
        },

        "getElementsByClass": function(cn, parentNode) {
            var node = parentNode ? parentNode: document;
            var result = [];
            var all = [];
            if ("getElementsByTagName" in node) {
                all = node.getElementsByTagName("*");
            } else if ("querySelectorAll" in node) {
                all = node.querySelectorAll("*");
            }

            for (var i = 0; i < all.length; i++) {
                if (hasClass(all[i], cn)) {
                    result.push(all[i]);
                }
            }
            return result;
        },

        "hasClass": function(element, className) {
            var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
            return element.className.match(reg);
        },

        // 获取视口大小
        "getInner": function() {
            if (typeof window.innerWidth != 'undefined') {
                return {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            } else {
                return {
                    width: document.documentElement.clientWidth,
                    height: document.documentElement.clientHeight
                }
            }
        },

        // 获取Style
        "getStyle": function(element, attr) {
            var value;
            if (typeof window.getComputedStyle != 'undefined') { // W3C
                value = window.getComputedStyle(element, null)[attr];
            } else if (typeof element.currentStyle != 'undeinfed') { //IE
                value = element.currentStyle[attr];
            }
            return value;
        },

        "removeNode": function(node) {
            if (node == null) return;

            var parentNode = node.parentNode;
            if (parentNode) {
                parentNode.removeChild(node);
            }
        },

        //  获取绝对位置
        "absPosition": function(node) {
            var left, top, pEl = node;

            if (typeof node.getBoundingClientRect === 'function') {
                var clientRect = node.getBoundingClientRect();
                left = clientRect.left + window.pageXOffset;
                top = clientRect.bottom + window.pageYOffset;
            } else {
                left = pEl.offsetLeft;
                top = pEl.offsetTop + pEl.offsetHeight;
                while ((pEl = pEl.offsetParent)) {
                    left += pEl.offsetLeft;
                    top += pEl.offsetTop;
                }
            }
            return {
                "left": left,
                "top": top
            };
        },

        // 创建带命名空间的对象
        "createNSElement": function(tagName, ns) {
            var obj;
            if (ns == null) {
                obj = document.createElement(tagName);
            } else {
                var tempDiv = document.createElement("DIV");
                tempDiv.innerHTML = "<" + ns + ":" + tagName + "/>";
                obj = tempDiv.firstChild.cloneNode(false);
                Element.removeNode(tempDiv);
            }

            if (obj.uniqueID == null) {
                obj.uniqueID = UniqueID.generator(); // 非IE
            }
            return obj;
        },

        "getNSElements": function(element, tagName, ns) {
            var childs = element.getElementsByTagName(tagName);
            if (childs == null || childs.length == 0) {
                childs = element.getElementsByTagName(ns + ":" + tagName);
            }
            return childs;
        },

        "createElement": function(tagName, className) {
            var element = document.createElement(tagName);
            if (className) {
                Element.addClass(element, className)
            }

            if (element.uniqueID == null) {
                element.uniqueID = UniqueID.generator(); // 非IE
            }
            return element;
        },

        /*
         * where：插入位置。包括beforeBegin,beforeEnd,afterBegin,afterEnd。
         * el：用于参照插入位置的html元素对象
         * html：要插入的html代码
         */
        "insertHtml": function(where, el, html) {
            where = where.toLowerCase();
            if(el.insertAdjacentHTML) {
                el.insertAdjacentHTML(where, html);
                return;
            }

            var range = el.ownerDocument.createRange();
            var frag;
            switch(where){
                 case "afterbegin":
                    if(el.firstChild){
                        range.setStartBefore(el.firstChild);
                        frag = range.createContextualFragment(html);
                        el.insertBefore(frag, el.firstChild); 
                     } else {
                        el.innerHTML = html;
                     }
                    break;
                case "afterend":
                    range.setStartAfter(el);
                    frag = range.createContextualFragment(html);
                    el.parentNode.insertBefore(frag, el.nextSibling);
                    break;
            }
        },

        /* 动态创建脚本 */
        "createScript": function(script) {
            var head = document.head || document.getElementsByTagName('head')[0];
            if( head ) {
                var scriptNode = Element.createElement("script");
                scriptNode.text = script;
                head.appendChild(scriptNode);
            }
        },

        /* 设置透明度 */
        "setOpacity": function(obj, opacity) {
            if(opacity == null || opacity == "") {
                opacity = 100;
            }

            if(window.DOMParser) {
                if(obj.style) {
                    obj.style.opacity = opacity / 100;
                }
            }
            else {
                obj.style.filter = "alpha(opacity=" + opacity + ")";
            }
        },

        "waitingLayerCount": 0,

        "showWaitingLayer": function () {
            var waitingDiv = $("#_waitingDiv")[0];
            if(waitingDiv == null) {
                waitingDiv = document.createElement("div");    
                waitingDiv.id = "_waitingDiv";    
                waitingDiv.style.width ="100%";    
                waitingDiv.style.height = "100%";    
                waitingDiv.style.position = "absolute";    
                waitingDiv.style.left = "0px";   
                waitingDiv.style.top = "0px";   
                waitingDiv.style.cursor = "wait"; 
                waitingDiv.style.zIndex = "10000";
                waitingDiv.style.background = "black";   
                Element.setOpacity(waitingDiv, 10);

                document.body.appendChild(waitingDiv);
            }

            if( waitingDiv ) {
                waitingDiv.style.display = "block";
            }

            waitingLayerCount ++;
        },

        "hideWaitingLayer": function() {
            waitingLayerCount --;

            var waitingDiv = $("#_waitingDiv")[0];
            if( waitingDiv && waitingLayerCount <= 0 ) {
                waitingDiv.style.display = "none";
            }
        }

    });
})(tssJS);

; (function($) {

    $.extend({
        /* 负责获取当前页面地址参数 */
        "Query": {
            "items": {},

            "get": function(name, decode) {
                var str = items[name];
                return decode ? unescape(str) : str;
            },

            "init": function(queryString) {
                items = {}; // 先清空
                queryString = queryString || window.location.search.substring(1);

                var params = queryString.split("&");
                for (var i = 0; i < params.length; i++) {
                    var param = params[i].split("=");
                    items[param[0]] = param[1];
                }
            }

        }
    });

    $.Query.init();

})(tssJS);

/* 
 * 负责管理页面上cookie数据.
 * Chrome只支持在线网站的cookie的读写操作，对本地html的cookie操作是禁止的。
 */
; (function($) {

    $.extend({
        "Cookie": {
            "setValue": function(name, value, expires, path) {
                if (expires == null) {
                    var exp = new Date();
                    exp.setTime(exp.getTime() + 365 * 24 * 60 * 60 * 1000);
                    expires = exp.toGMTString();
                }

                path = path || "/";
                window.document.cookie = name + "=" + escape(value) + ";expires=" + expires + ";path=" + path;
            },

            "getValue": function(name) {
                var value = null;
                var cookies = window.document.cookie.split(";");
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = cookies[i];
                    var index = cookie.indexOf("=");
                    var curName = cookie.substring(0, index).replace(/^ /gi, "");
                    var curValue = cookie.substring(index + 1);

                    if (name == curName) {
                        value = unescape(curValue);
                    }
                }
                return value;
            },

            "del": function(name, path) {
                var expires = new Date(0).toGMTString();
                this.setValue(name, "", expires, path);
            },

            "delAll": function(path) {
                var cookies = window.document.cookie.split(";");
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = cookies[i];
                    var index = cookie.indexOf("=");
                    var curName = cookie.substring(0, index).replace(/^ /gi, "");
                    del(curName, path);
                }
            }

        }
    });
})(tssJS);

/*********************************** 事件（Event）函数  start **********************************/
;(function($){

    $.extend({
        "Event": {
            "MOUSEDOWN": 1,
            "MOUSEUP": 2,
            "MOUSEOVER": 4,
            "MOUSEOUT": 8,
            "MOUSEMOVE":16,
            "MOUSEDRAG": 32,

            "timeout": {},

            "preventDefault": function(event) {
                if (event.preventDefault) {
                    event.preventDefault();
                } else {
                    event.returnValue = false;
                }
            },

            /* 取消事件 */
            "cancel": function(event) { preventDefault(event); },

            // 获得事件触发对象
            "getSrcElement": function(eventObj) {
                return eventObj.target || eventObj.srcElement;
            },

            /* 使事件始终捕捉对象。设置事件捕获范围。 */
            "setCapture": function(srcElement, eventType) {
                if (srcElement.setCapture) {             
                    srcElement.setCapture();         
                } 
                else if(window.captureEvents){           
                    window.captureEvents(eventType);         
                }
            },

            /* 使事件放弃始终捕捉对象。 */
            "releaseCapture": function(srcElement, eventType) {
                if(srcElement.releaseCapture){
                    srcElement.releaseCapture();
                }
                else if(window.captureEvents) {
                    window.captureEvents(eventType);
                }
            },

            /* 阻止事件向上冒泡 */
            "cancelBubble": function(eventObj) {
                if( eventObj.stopPropagation ) {
                    eventObj.stopPropagation();
                }
                else {
                    eventObj.cancelBubble = true;
                }
            },

            "attachEvent": function(element, eventName, fn) {
                if(element.addEventListener) {
                    element.addEventListener(eventName, fn, false);
                }
                else if(element.attachEvent) {
                    element.attachEvent("on" + eventName, fn);
                }
            },

            "detachEvent": function(element, eventName, fn) {
                if( element.removeEventListener ) {
                    element.removeEventListener(eventName, fn, false);
                }
                else {
                    element.detachEvent("on" + eventName, fn);
                }
            },

            "fireOnScrollBar": function(eventObj) {
                var isOnScrollBar = false;
                var element = getSrcElement(eventObj);

                var absPosition = $.absPosition(element);

                // 是否有纵向滚动条
                if(element.offsetWidth > element.clientWidth) {
                    var offsetX = eventObj.clientX - absPosition.left;
                    if(offsetX > element.clientWidth) {
                        isOnScrollBar = true;
                    }
                }

                // 是否有横向滚动条
                if(false == isOnScrollBar && element.offsetHeight > element.clientHeight) {
                    var offsetY = eventObj.clientY - absPosition.top;
                    if(offsetY > element.clientHeight) {
                        isOnScrollBar = true;
                    }
                }
                return isOnScrollBar;
            },

            /** 模拟事件 */
            "createEventObject": function() { return new Object(); },
        }
    });

    $.extend({

        "EventFirer" : function(element, eventName) {
            var _name = eventName;
            this.fire = function (event) {
                var func = element.getAttribute(_name) || eval("element." + _name);
                if( func ) {
                    var funcType = typeof(func);
                    if("string" == funcType) {
                        eval(func);
                    }
                    else if ("function" == funcType) {
                        func(event);
                    }
                }
            }
        }

    });

})(tssJS);

/*********************************** 事件（Event）函数  end **********************************/

/*********************************** xml相关操作函数  start **********************************/

;(function($) {

    $.extend({

    });

})(tssJS);


MSXML_DOCUMENT_VERSION = "Msxml2.DOMDocument.6.0";

/* 将字符串转化成xml节点对象 */
function loadXmlToNode(xml) {
    if(xml == null || xml == "" || xml == "undifined") {
        return null;
    }

    xml = xml.revertEntity();
    var xr = new XmlReader(xml);
    return xr.documentElement;
}

function xml2String(element) {
    if (Public.isIE()) {
        return element.xml;
    }
    else {
        var xmlSerializer = new XMLSerializer();
        return xmlSerializer.serializeToString(element);
    }
}

function getNodeText(node) {
    return node.text || node.textContent || ""; // 取节点值时，chrome里用textContent
}

function getXmlDOM() {
    var xmlDom;
    if (Public.isIE()) {
        xmlDom = new ActiveXObject(MSXML_DOCUMENT_VERSION);
        xmlDom.async = false;
    }
    else {
        var parser = new DOMParser();
        xmlDom = parser.parseFromString("<null/>", "text/xml");
        xmlDom.parser = parser;
    } 
    return xmlDom;
}

var EMPTY_XML_DOM = getXmlDOM();

function loadXmlDOM(url) {
    var xmlDom;
    if (window.DOMParser) {
        var xmlhttp = new window.XMLHttpRequest();  
        xmlhttp.open("GET", url, false);  
        try {  xmlhttp.responseType = 'msxml-document';  } catch (e) {  } 
        xmlhttp.send(null);  
        xmlDom = xmlhttp.responseXML.documentElement;  
    }
    else { // < IE10
        xmlDom = new ActiveXObject(MSXML_DOCUMENT_VERSION);
        xmlDom.async = false;
        xmlDom.load(url);
    } 
    return xmlDom;
}

function XmlReader(text) {
    this.xmlDom = null;

    if (Public.isIE()) {
        this.xmlDom = new ActiveXObject(MSXML_DOCUMENT_VERSION);
        this.xmlDom.async = false;
        this.xmlDom.loadXML(text); 
    }
    else {
        var parser = new DOMParser();
        this.xmlDom = parser.parseFromString(text, "text/xml"); 
    } 

    this.documentElement = this.xmlDom.documentElement || this.xmlDom;
}

XmlReader.prototype.loadXml = function(text) {
    if (Public.isIE()) {
        this.xmlDom.loadXML(text); 
    }
    else { 
        var parser = new DOMParser();
        this.xmlDom = parser.parseFromString(text, "text/xml");
    } 
}

XmlReader.prototype.createElement = function(name) {
    var node = this.xmlDom.createElement(name);
    var xmlNode = new XmlNode(node);
    return xmlNode;
}

XmlReader.prototype.createCDATA = function(data) {
    var xmlNode;
    data = String(data).convertCDATA();
    if(window.DOMParser) {
        var tempReader = new XmlReader("<root><![CDATA[" + data + "]]></root>");
        var xmlNode = new XmlNode(tempReader.documentElement.firstChild);
    }
    else {
        xmlNode = new XmlNode(this.xmlDom.createCDATASection(data));
    }
    return xmlNode;
}

 XmlReader.prototype.createElementCDATA = function(name, data) {
    var xmlNode   = this.createElement(name);
    var cdataNode = this.createCDATA(data);
    xmlNode.appendChild(cdataNode);
    return xmlNode;
}

/* 获取解析错误 */
XmlReader.prototype.getParseError = function() {
    var parseError = null;
    if(window.DOMParser) {

    } 
    else {
        if( this.xmlDom.parseError.errorCode != 0 ) {
            parseError = this.xmlDom.parseError;
        }
    }
    return parseError;
}

XmlReader.prototype.toString = function() {
    var str = [];
    str[str.length] = "[XmlReader Object]";
    str[str.length] = "xml:" + this.toXml();
    return str.join("\r\n");
}

XmlReader.prototype.toXml = function() {
    if (Public.isIE()) {
        return this.xmlDom.xml;
    }
    else {
        var xmlSerializer = new XMLSerializer();
        return xmlSerializer.serializeToString(this.xmlDom.documentElement);
    }
}


if ( !Public.isIE() ) {
    Element.prototype.selectNodes = function(p_xPath) {
        var m_Evaluator = new XPathEvaluator();
        var m_Result = m_Evaluator.evaluate(p_xPath, this, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

        var m_Nodes = [];
        if (m_Result) {
            var m_Element;
            while (m_Element = m_Result.iterateNext()) {
                m_Nodes.push(m_Element);
            }
        } 
        return m_Nodes;
    };

    Element.prototype.selectSingleNode = function(p_xPath) {
        var m_Evaluator = new XPathEvaluator();
        var m_Result = m_Evaluator.evaluate(p_xPath, this, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);

        if (m_Result) {
            return m_Result.singleNodeValue;
        } else {
            return null;
        }
    };
}