function win(attr) {
    switch (attr) {
    case 'height':
        if (window.innerHeight) {
            winHeight = window.innerHeight;
            return winHeight;
        } else if ((document.body) && (document.body.clientHeight)) {
            winHeight = document.body.clientHeight;
            return winHeight;
        }
        if (document.documentElement && document.documentElement.clientHeight) {
            winHeight = document.documentElement.clientHeight;
            return winHeight;
        }
        break;
    case 'width':
        if (window.innerWidth) {
            winWidth = window.innerWidth;
            return winWidth;
        } else if ((document.body) && (document.body.clientWidth)) {
            winWidth = document.body.clientWidth;
            return winWidth;
        } 
        if (document.documentElement && document.documentElement.clientWidth) {
            winWidth = document.documentElement.clientWidth;
            return winWidth;
        }
        break;
    case 'scrollTop':
        var scrollTop;
        if (typeof window.pageYOffset != 'undefined') {
            scrollTop = window.pageYOffset;
        } else if (typeof document.compatMode != 'undefined' && document.compatMode != 'BackCompat') {
            scrollTop = document.documentElement.scrollTop;
        } else if (typeof document.body != 'undefined') {
            scrollTop = document.body.scrollTop;
        }
        return scrollTop;
        break;
    default:
        return 0;
        break;
    }
}

function css(obj, attr) {
    var re = [];
    switch (attr) {
    case 'rotate':
        var transformstr = obj.currentStyle ? obj.currentStyle['transform'] : document.defaultView.getComputedStyle(obj, false)['webkitTransform'] || document.defaultView.getComputedStyle(obj, false)['msTransform'] || document.defaultView.getComputedStyle(obj, false)['MozTransform'] || document.defaultView.getComputedStyle(obj, false)['OTransform'] || document.defaultView.getComputedStyle(obj, false)['transform'] + "";
        var matrixarray = transformstr.split(",");
        re.push(Math.asin(matrixarray[1]) / Math.PI * 180);
        return re;
        break;
    default:
        re.push(parseInt(obj.currentStyle ? obj.currentStyle[attr] : document.defaultView.getComputedStyle(obj, false)[attr]));
        return re;
        break;
    }
}
function drag(obj) {
    obj.onmousedown = function(ev) {
        var oev = ev || event;
        var disX = oev.clientX - obj.offsetLeft;
        var disY = oev.clientY - obj.offsetTop;
        document.onmousemove = function(ev) {
            var oev = ev || event;
            var left = oev.clientX - disX;
            var top = oev.clientY - disY;
            obj.style.left = left + 'px';
            obj.style.top = top + 'px';
        }
        document.onmouseup = function() {
            document.onmousemove = null;
            document.onmouseup = null;
        }
    }
}
