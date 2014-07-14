
/*
 *	隐藏对象覆盖范围内的高优先级的控件(select等)
 *	参数：	Object:obj			html对象
 *	返回值：
 */
Element.hideConflict = function(obj) {
	var x = Element.absLeft(obj);
	var y = Element.absTop(obj);
	var w = obj.offsetWidth;
	var h = obj.offsetHeight;
	var rect = {x:x, y:y, w:w, h:h};

	function isInside(point, rect) {
		if(point.x > rect.x + rect.w || point.x < rect.x 
			|| point.y > rect.y + rect.h || point.y < rect.y ) {
			return false;
		}
		return true;
	}

	var conflict = [];
	var conflictTags = ["select"];
	for(var i = 0; i < conflictTags.length; i++) {
		var curTag = conflictTags[i];
		var curObjs = document.getElementsByTagName(curTag);
		for(var j = 0; j < curObjs.length; j++) {
			var curObj = curObjs[j];

			var x1 = Element.absLeft(curObj);
			var y1 = Element.absTop(curObj);
			var w1 = curObj.offsetWidth;
			var h1 = curObj.offsetHeight;
			var x2 = x1 + w1;
			var y2 = y1 + h1;

			var flag = isInside( {x:x1, y:y1}, rect );
			flag = flag || isInside( {x:x2, y:y1}, rect );
			flag = flag || isInside( {x:x2, y:y2}, rect );
			flag = flag || isInside( {x:x1, y:y2}, rect );

			if(flag == true) {
				curObj.style.visibility = "hidden";
				conflict[conflict.length] = curObj;
			}
		}
	}
	obj.conflict = conflict;
	return obj;
}

Element.showConflict = function(obj) {
	// 气球有可能已经被其他途径释放掉了，obj被清空
	if( typeof(obj) != "undefined" && obj.conflict  ) {
		for( var i = 0; i < obj.conflict.length; i++ ) {
			obj.conflict[i].style.visibility = "visible";
		}
	}
}

/*
 * 控制对象拖动改变宽度
 * 参数：	Object:element   要拖动改变宽度的HTML对象
 */
Element.attachColResize = function(element) {
	 Element.attachResize(element, "col");
}

/*
 * 控制对象拖动改变高度
 * 参数：	Object:element   要拖动改变高度的HTML对象
 */
Element.attachRowResize = function(element) {
	 Element.attachResize(element, "row");
}
 
Element.attachResize = function(element, type) {
	var handle = document.createElement("DIV"); // 拖动条
	if (type == "col") {
		handle.style.cssText = "cursor:col-resize;position:absolute;overflow:hidden;float:right;top:0px;right:0px;width:3px;height:100%;z-index:3;filter:alpha(opacity:80);opacity:80;background:red;";
	} else if(type == "row") {
		handle.style.cssText = "cursor:row-resize;position:absolute;overflow:hidden;left:0px;bottom:0px;width:100%;height:3px;z-index:3;filter:alpha(opacity:0);opacity:0;";
	} else {
		handle.style.cssText = "cursor:nw-resize;position:absolute;overflow:hidden;right:0px;bottom:0px;width:8px;height:8px;z-index:3;background:#99CC00";
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
		if (handle.releaseCapture) {
			handle.onmousemove = handle.onmouseup = null;
			handle.releaseCapture();
		} else {
			document.removeEventListener("mousemove", doDrag, true);
			document.removeEventListener("mouseup", stopDrag, true);
		}
	};
}

Element.attachColResizeII = function(element) {
	var handle = element; // 拖动条(使用自己)

	var mouseStart  = {x:0, y:0};  // 鼠标起始位置
	var handleStart = {x:0, y:0};  // 拖动条起始位置

	handle.onmousedown = function(ev) {
		var oEvent = ev || event;
		mouseStart.x  = oEvent.clientX;
		handleStart.x = handle.offsetLeft;

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
		var oEvent = ev || event;

		var _width = oEvent.clientX - mouseStart.x + handle.offsetWidth;
		if (_width > document.documentElement.clientWidth - handle.offsetLeft) {
			_width = document.documentElement.clientWidth - handle.offsetLeft - 2; // 防止拖出窗体外
		}
		if (_width < 0) {
			_width = handle.width;
		}

		handle.style.width = Math.max(_width, 10) + "px";
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
}

/*
 * 拖动对象，改变其位置
 * 参数：	Object:element   要拖动的HTML对象
 */
Element.moveable = function(element, handle) {
	handle = handle || element.getElementsByTagName("h2")[0] || element; // 拖动条
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
		var oEvent = ev || event;

		var x = oEvent.clientX - mouseStart.x + elementStart.x;
		var y = oEvent.clientY - mouseStart.y + elementStart.y;
		if (x < 0) {
			x = 0;
		} else if (x > document.documentElement.clientWidth - element.offsetWidth) {
			x = document.documentElement.clientWidth - element.offsetWidth;
		}
		if (y < 0) {
			y = 0;
		} else if (y > document.documentElement.clientHeight - element.offsetHeight) {
			y = document.documentElement.clientHeight - element.offsetHeight;
		}
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
}