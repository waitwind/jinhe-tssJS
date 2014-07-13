//前台调用
var $ = function (args) {
  return new Base(args);
}

//基础库
function Base(args) {
  //创建一个数组，来保存获取的节点和节点数组
  this.elements = [];
  
  if (typeof args == 'string') {
      //find模拟
      switch (args.charAt(0)) {
        case '#' :
          this.elements.push(this.getId(args.substring(1)));
          break;
        case '.' : 
          this.elements = this.getClass(args.substring(1));
          break;
        default : 
          this.elements = this.getTagName(args);
      }
  } else if (typeof args == 'object') {
    if (args != undefined) {    //_this是一个对象，undefined也是一个对象，区别与typeof返回的带单引号的'undefined'
      this.elements[0] = args;
    }
  } else if (typeof args == 'function') {
    this.ready(args);
  }
}

//addDomLoaded
Base.prototype.ready = function (fn) {
  addDomLoaded(fn);
};

//获取ID节点
Base.prototype.getId = function (id) {
  return document.getElementById(id)
};

//获取元素节点数组
Base.prototype.getTagName = function (tag, parentNode) {
  var node = null;
  var temps = [];
  if (parentNode != undefined) {
    node = parentNode;
  } else {
    node = document;
  }
  var tags = node.getElementsByTagName(tag);
  for (var i = 0; i < tags.length; i ++) {
    temps.push(tags[i]);
  }
  return temps;
};

//获取CLASS节点数组
Base.prototype.getClass = function (className, parentNode) {
  var node = null;
  var temps = [];
  if (parentNode != undefined) {
    node = parentNode;
  } else {
    node = document;
  }
  var all = node.getElementsByTagName('*');
  for (var i = 0; i < all.length; i ++) {
    if (all[i].className == className) {
      temps.push(all[i]);
    }
  }
  return temps;
}

//设置CSS选择器子节点
Base.prototype.find = function (str) {
  var childElements = [];
  for (var i = 0; i < this.elements.length; i ++) {
    switch (str.charAt(0)) {
      case '#' :
        childElements.push(this.getId(str.substring(1)));
        break;
      case '.' : 
        var temps = this.getClass(str.substring(1), this.elements[i]);
        for (var j = 0; j < temps.length; j ++) {
          childElements.push(temps[j]);
        }
        break;
      default : 
        var temps = this.getTagName(str, this.elements[i]);
        for (var j = 0; j < temps.length; j ++) {
          childElements.push(temps[j]);
        }
    }
  }
  this.elements = childElements;
  return this;
}

//获取某一个节点，并返回这个节点对象
Base.prototype.ge = function (num) {	
  return this.elements[num];
};

//获取首个节点，并返回这个节点对象
Base.prototype.first = function () {
  return this.elements[0];
};

//获取末个节点，并返回这个节点对象
Base.prototype.last = function () {
  return this.elements[this.elements.length - 1];
};

//获取某一个节点，并且Base对象
Base.prototype.eq = function (num) {
  var element = this.elements[num];
  this.elements = [];
  this.elements[0] = element;
  return this;
};

//获取当前节点的下一个元素节点
Base.prototype.next = function () {
  for (var i = 0; i < this.elements.length; i ++) {
    this.elements[i] = this.elements[i].nextSibling;
    if (this.elements[i] == null) throw new Error('找不到下一个同级元素节点！');
    if (this.elements[i].nodeType == 3) this.next();
  }
  return this;
};

//获取当前节点的上一个元素节点
Base.prototype.prev = function () {
  for (var i = 0; i < this.elements.length; i ++) {
    this.elements[i] = this.elements[i].previousSibling;
    if (this.elements[i] == null) throw new Error('找不到上一个同级元素节点！');
    if (this.elements[i].nodeType == 3) this.prev();
  }
  return this;
};

//设置CSS
Base.prototype.css = function (attr, value) {
  for (var i = 0; i < this.elements.length; i ++) {
    if (arguments.length == 1) {
      return getStyle(this.elements[i], attr);
    }
    this.elements[i].style[attr] = value;
  }
  return this;
}

//添加Class
Base.prototype.addClass = function (className) {
  for (var i = 0; i < this.elements.length; i ++) {
    if (!hasClass(this.elements[i], className)) {
      this.elements[i].className += ' ' + className;
    }
  }
  return this;
}

//移除Class
Base.prototype.removeClass = function (className) {
  for (var i = 0; i < this.elements.length; i ++) {
    if (hasClass(this.elements[i], className)) {
      this.elements[i].className = this.elements[i].className.replace(new RegExp('(\\s|^)' +className +'(\\s|$)'), ' ');
    }
  }
  return this;
}

//添加link或style的CSS规则
Base.prototype.addRule = function (num, selectorText, cssText, position) {
  var sheet = document.styleSheets[num];
  insertRule(sheet, selectorText, cssText, position);
  return this;
}

//移除link或style的CSS规则
Base.prototype.removeRule = function (num, index) {
  var sheet = document.styleSheets[num];
  deleteRule(sheet, index);
  return this;
}

//设置innerHTML
Base.prototype.html = function (str) {
  for (var i = 0; i < this.elements.length; i ++) {
    if (arguments.length == 0) {
      return this.elements[i].innerHTML;
    }
    this.elements[i].innerHTML = str;
  }
  return this;
}

//设置鼠标移入移出方法
Base.prototype.hover = function (over, out) {
  for (var i = 0; i < this.elements.length; i ++) {
    addEvent(this.elements[i], 'mouseover', over);
    addEvent(this.elements[i], 'mouseout', out);
  }
  return this;
};

//设置点击切换方法
Base.prototype.toggle = function () {
  for (var i = 0; i < this.elements.length; i ++) {
    (function (element, args) {
      var count = 0;
      addEvent(element, 'click', function () {
        args[count++ % args.length].call(this);
      });
    })(this.elements[i], arguments);
  }
  return this;
};

//设置显示
Base.prototype.show = function () {
  for (var i = 0; i < this.elements.length; i ++) {
    this.elements[i].style.display = 'block';
  }
  return this;
};

//设置隐藏
Base.prototype.hide = function () {
  for (var i = 0; i < this.elements.length; i ++) {
    this.elements[i].style.display = 'none';
  }
  return this;
};

//设置物体居中
Base.prototype.center = function (width, height) {
  var top = (getInner().height - 250) / 2;
  var left = (getInner().width - 350) / 2;
  for (var i = 0; i < this.elements.length; i ++) {
    this.elements[i].style.top = top + 'px';
    this.elements[i].style.left = left + 'px';
  }
  return this;
};

//锁屏功能
Base.prototype.lock = function () {
  for (var i = 0; i < this.elements.length; i ++) {
    this.elements[i].style.width = getInner().width + 'px';
    this.elements[i].style.height = getInner().height + 'px';
    this.elements[i].style.display = 'block';
    document.documentElement.style.overflow = 'hidden';
    addEvent(window, 'scroll', scrollTop);
  }
  return this;
};

Base.prototype.unlock = function () {
  for (var i = 0; i < this.elements.length; i ++) {
    this.elements[i].style.display = 'none';
    document.documentElement.style.overflow = 'auto';
    removeEvent(window, 'scroll', scrollTop);
  }
  return this;
};

//触发点击事件
Base.prototype.click = function (fn) {
  for (var i = 0; i < this.elements.length; i ++) {
    this.elements[i].onclick = fn;
  }
  return this;
};

//触发浏览器窗口事件
Base.prototype.resize = function (fn) {
  for (var i = 0; i < this.elements.length; i ++) {
    var element = this.elements[i];
    addEvent(window, 'resize', function () {
      fn();
      if (element.offsetLeft > getInner().width - element.offsetWidth) {
        element.style.left = getInner().width - element.offsetWidth + 'px';
      }
      if (element.offsetTop > getInner().height - element.offsetHeight) {
        element.style.top = getInner().height - element.offsetHeight + 'px';
      }
    });
  }
  return this;
};

//插件入口
Base.prototype.extend = function (name, fn) {
  Base.prototype[name] = fn;
};
//浏览器检测
(function () {
  window.sys = {};
  var ua = navigator.userAgent.toLowerCase();	
  var s;		
  (s = ua.match(/msie ([\d.]+)/)) ? sys.ie = s[1] :
  (s = ua.match(/firefox\/([\d.]+)/)) ? sys.firefox = s[1] :
  (s = ua.match(/chrome\/([\d.]+)/)) ? sys.chrome = s[1] : 
  (s = ua.match(/opera\/.*version\/([\d.]+)/)) ? sys.opera = s[1] : 
  (s = ua.match(/version\/([\d.]+).*safari/)) ? sys.safari = s[1] : 0;
  
  if (/webkit/.test(ua)) sys.webkit = ua.match(/webkit\/([\d.]+)/)[1];
})();

//DOM加载
function addDomLoaded(fn) {
  var isReady = false;
  var timer = null;
  function doReady() {
    if (timer) clearInterval(timer);
    if (isReady) return;
    isReady = true;
    fn();
  }
  
  if ((sys.opera && sys.opera < 9) || (sys.firefox && sys.firefox < 3) || (sys.webkit && sys.webkit < 525)) {
    //无论采用哪种，基本上用不着了
    /*timer = setInterval(function () {
      if (/loaded|complete/.test(document.readyState)) { 	//loaded是部分加载，有可能只是DOM加载完毕，complete是完全加载，类似于onload
        doReady();
      }
    }, 1);*/

    timer = setInterval(function () {
      if (document && document.getElementById && document.getElementsByTagName && document.body) {
        doReady();
      }
    }, 1);
  } else if (document.addEventListener) {//W3C
    addEvent(document, 'DOMContentLoaded', function () {
      fn();
      removeEvent(document, 'DOMContentLoaded', arguments.callee);
    });
  } else if (sys.ie && sys.ie < 9){
    var timer = null;
    timer = setInterval(function () {
      try {
        document.documentElement.doScroll('left');
        doReady();
      } catch (e) {};
    }, 1);
  }
}

//跨浏览器添加事件绑定
function addEvent(obj, type, fn) {
  if (typeof obj.addEventListener != 'undefined') {
    obj.addEventListener(type, fn, false);
  } else {
    //创建一个存放事件的哈希表(散列表)
    if (!obj.events) obj.events = {};
    //第一次执行时执行
    if (!obj.events[type]) {	
      //创建一个存放事件处理函数的数组
      obj.events[type] = [];
      //把第一次的事件处理函数先储存到第一个位置上
      if (obj['on' + type]) obj.events[type][0] = fn;
    } else {
      //同一个注册函数进行屏蔽，不添加到计数器中
      if (addEvent.equal(obj.events[type], fn)) return false;
    }
    //从第二次开始我们用事件计数器来存储
    obj.events[type][addEvent.ID++] = fn;
    //执行事件处理函数
    obj['on' + type] = addEvent.exec;
  }
}

//为每个事件分配一个计数器
addEvent.ID = 1;

//执行事件处理函数
addEvent.exec = function (event) {
  var e = event || addEvent.fixEvent(window.event);
  var es = this.events[e.type];
  for (var i in es) {
    es[i].call(this, e);
  }
};

//同一个注册函数进行屏蔽
addEvent.equal = function (es, fn) {
  for (var i in es) {
    if (es[i] == fn) return true;
  }
  return false;
}

//把IE常用的Event对象配对到W3C中去
addEvent.fixEvent = function (event) {
  event.preventDefault = addEvent.fixEvent.preventDefault;
  event.stopPropagation = addEvent.fixEvent.stopPropagation;
  event.target = event.srcElement;
  return event;
};

//IE阻止默认行为
addEvent.fixEvent.preventDefault = function () {
  this.returnValue = false;
};

//IE取消冒泡
addEvent.fixEvent.stopPropagation = function () {
  this.cancelBubble = true;
};


//跨浏览器删除事件
function removeEvent(obj, type, fn) {
  if (typeof obj.removeEventListener != 'undefined') {
    obj.removeEventListener(type, fn, false);
  } else {
    if (obj.events) {
      for (var i in obj.events[type]) {
        if (obj.events[type][i] == fn) {
          delete obj.events[type][i];
        }
      }
    }
  }
}


//跨浏览器获取视口大小
function getInner() {
  if (typeof window.innerWidth != 'undefined') {
    return {
      width : window.innerWidth,
      height : window.innerHeight
    }
  } else {
    return {
      width : document.documentElement.clientWidth,
      height : document.documentElement.clientHeight
    }
  }
}

//跨浏览器获取滚动条位置
function getScroll() {
  return {
    top : document.documentElement.scrollTop || document.body.scrollTop,
    left : document.documentElement.scrollLeft || document.body.scrollLeft
  }
}


//跨浏览器获取Style
function getStyle(element, attr) {
  var value;
  if (typeof window.getComputedStyle != 'undefined') {//W3C
    value = window.getComputedStyle(element, null)[attr];
  } else if (typeof element.currentStyle != 'undeinfed') {//IE
    value = element.currentStyle[attr];
  }
  return value;
}


//判断class是否存在
function hasClass(element, className) {
  return element.className.match(new RegExp('(\\s|^)' +className +'(\\s|$)'));
}


//跨浏览器添加link规则
function insertRule(sheet, selectorText, cssText, position) {
  if (typeof sheet.insertRule != 'undefined') {//W3C
    sheet.insertRule(selectorText + '{' + cssText + '}', position);
  } else if (typeof sheet.addRule != 'undefined') {//IE
    sheet.addRule(selectorText, cssText, position);
  }
}

//跨浏览器移出link规则
function deleteRule(sheet, index) {
  if (typeof sheet.deleteRule != 'undefined') {//W3C
    sheet.deleteRule(index);
  } else if (typeof sheet.removeRule != 'undefined') {//IE
    sheet.removeRule(index);
  }
}

//删除左后空格
function trim(str) {
  return str.replace(/(^\s*)|(\s*$)/g, '');
}

//滚动条清零
function scrollTop() {
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}
 