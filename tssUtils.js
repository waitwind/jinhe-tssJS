IS_TEST = true;

FROMEWORK_CODE = "TSS";
SYSTEM_TITLE = "百世快运BI";  // 它山石应用支撑平台

/*  当前应用名  */
APP_CODE    = "TSS";
APPLICATION = APP_CODE.toLowerCase();
CONTEXTPATH = APPLICATION + "/";
AUTH_PATH    = "/" + CONTEXTPATH + "auth/";
NO_AUTH_PATH = "/" + CONTEXTPATH;

URL_UPLOAD_FILE  = AUTH_PATH + "file/upload";	

if( IS_TEST ) {
	URL_CORE = "../tssJS/";
} else {
	URL_CORE = "/" + APPLICATION + "/tssJS/";  // 界面核心包相对路径
} 
ICON =  URL_CORE + "../images/";

/*  常量定义 */
XML_OPERATION = "Operation";
XML_PAGE_INFO = "PageInfo";
OPERATION_ADD  = "新建$label";
OPERATION_VIEW = "查看\"$label\"";
OPERATION_DEL  = "删除\"$label\"";
OPERATION_EDIT = "编辑\"$label\"";
OPERATION_SEARCH = "查询\"$label\"";
OPERATION_IMPORT = "导入\"$label\"";
OPERATION_SETTING = "设置\"$label\"";
OPERATION_PERMISSION = "设置\"$label\"权限";

/* 延时 */
TIMEOUT_TAB_CHANGE = 200;

/* 默认唯一编号名前缀 */
CACHE_TREE_NODE = "_treeNode_";
CACHE_MAIN_TREE = "_tree_";

DEFAULT_NEW_ID = "-10";

/*********************** 和工作区Workspace相关 的 公用函数 **********************************/
var ws;
function initWorkSpace() {
	ws = new WorkSpace("ws");
	 
	var tr = ws.element.parentNode.parentNode;
	$1("ws").onTabCloseAll = function(event) { /* 隐藏tab页工作区 */
		tr.style.display = "none";
		tr.previousSibling.style.display = "none";    
	}
	$1("ws").onTabChange = function(event) { /* 显示tab页工作区 */
		tr.style.display = "";
		tr.previousSibling.style.display = "";
	}
}

/* 左栏添加左右拖动效果 */
function initPaletteResize() {
	// Element.attachColResize($1("palette"));
}
 
/* 事件绑定初始化 */
function initEvents() {
	Event.attachEvent($1("treeBtRefresh"), "click", onClickTreeBtRefresh);

	if($1("openLeftBarIcon")) {
		onClickPaletteBt();
	}

	// 关闭页面自动注销
	$.Event.addEvent(window, "unload", function() {
		if(event.clientX > document.body.clientWidth && event.clientY < 0 || event.altKey) {
			logout();
		}
	});
}
 
/* 点击树刷新按钮 */
function onClickTreeBtRefresh() {
	loadInitData();
}

/* 点击左栏控制按钮 */
function onClickPaletteBt() {
	$1("openLeftBarIcon").style.display = "none";
	
	$1("closeLeftBarIcon").onclick = function() {
		$1("palette").style.display = "none";
		$1("openLeftBarIcon").style.display = "";
	}	

	$1("openLeftBarIcon").onclick = function() {
		$1("palette").style.display = "";
		$1("openLeftBarIcon").style.display = "none";
	}
}
 
function onTreeNodeActived(eventObj) { }

function onTreeNodeRightClick(eventObj, carePermission, treeName) {
	var menu = $1(treeName || "tree").contextmenu;
	if(menu == null) {
		return;
	}

	if( carePermission ) {
        var treeNode = eventObj.treeNode;
        getTreeOperation(treeNode, function(_operation) {
			menu.show(eventObj.clientX, eventObj.clientY);
        });
	}
	else {
		menu.show(eventObj.clientX, eventObj.clientY);
	}
}

/*
 *	获取对树节点的操作权限
 *	参数：	treeNode:treeNode       树节点
			function:callback       回调函数
 */
function getTreeOperation(treeNode, callback, url) {
	url = url || URL_GET_OPERATION;
	var _operation = treeNode.getAttribute("_operation");

	var treeId = treeNode.id;
	if(treeId == "_root") {
		treeId = 0;
	}
	
	// 如果节点上还没有_operation属性，则发请求从后台获取信息
	if( $.isNullOrEmpty(_operation) ) { 
		$.ajax({
			url : url + treeId,
			onresult : function() {
				_operation = this.getNodeValue(XML_OPERATION);
				treeNode.setAttribute("_operation", _operation);

				if ( callback ) {
					callback(_operation);
				}
			}
		});			
	} 
	else {
		if ( callback ) {
			callback(_operation);
		}
	}    
}
	
/*
 *	检测右键菜单项是否可见
 *	参数：	string:code     操作码
 */
function getOperation(code, treeName) {
	var flag = false;
	var treeNode = getActiveTreeNode(treeName);
	if( treeNode ) {
		var _operation = treeNode.getAttribute("_operation");
		flag = checkOperation(code, _operation);
	}
	return flag;
}

/*
 *	检测操作权限
 *	参数：	string:code             操作码
			string:_operation       权限
 */
function checkOperation(code, _operation) {
	var flag = false;
	if( "string" == typeof(code) && "string" == typeof(_operation) ) {
		var reg = new RegExp("(^" + code + ",)|(^" + code + "$)|(," + code + ",)|(," + code + "$)", "gi");
		flag = reg.test(_operation);
	}
	return flag;
}

/* request请求期间，同步按钮禁止/允许状态 */
function syncButton(btObjs, request) {
	btObjs.each(function(i, btEl){
		btEl.disabled = true;
	});

	request.ondata = function() {
		btObjs.each(function(i, btEl){
			btEl.disabled = false;
		});
	}
}

/* 创建导入Div */
function createImportDiv(remark, checkFileWrong, importUrl) {
	var importDiv = $1("importDiv");
	if( importDiv == null ) {
		importDiv = $.createElement("div");    
		importDiv.id = "importDiv";      
		$(importDiv).css("background", "#BEC6EE").css("width", "250px").css("height", "100px")
			.css("padding", "10px 10px 10px 10px").css("fontSize", "12px"); 
		document.body.appendChild(importDiv);

		var str = [];
		str[str.length] = "<form id='importForm' method='post' target='fileUpload' enctype='multipart/form-data'>";
		str[str.length] = "	 <input type='file' name='file' id='sourceFile'/> <br> " + remark + "<br> ";
		str[str.length] = "	 <input type='button' id='importBt' value='上传' /> ";
		str[str.length] = "	 <input type='button' id='closeBt'  value='关闭' /> ";
		str[str.length] = "</form>";
		str[str.length] = "<iframe width='0px' height='0px' name='fileUpload'></iframe>";
		
		importDiv.innerHTML = str.join("\r\n");

		$1("closeBt").onclick = function () {
			$(importDiv).hide();
		}
	}

	// 每次 importUrl 可能不一样，比如导入门户组件时。不能缓存
	$1("importBt").onclick = function() {
		var fileValue = $1("sourceFile").value;
		if( fileValue == null) {
			 return alert("请选择导入文件!");				 
		}

		var length = fileValue.length;
		var subfix = fileValue.substring(length - 4, length);
		if( checkFileWrong && checkFileWrong(subfix) ) {
		   return alert(remark);
		}

		var form = $1("importForm");
		form.action = importUrl;
		form.submit();

		$(importDiv).hide();
	}

	return importDiv;
}

 /* 创建导出用iframe */
function createExportFrame() {
	var frameName = "exportFrame";
	if( $1(frameName) == null ) {
		var exportDiv = $.createElement("div"); 
		exportDiv.style.display = "none";
		document.body.appendChild(exportDiv);

		exportDiv.innerHTML = "<iframe id='" + frameName + "' src='about:blank' style='display:none'></iframe>";
	}
	return frameName;
}


/*
 *	重新封装alert
 *	参数：	string:info     简要信息
			string:detail   详细信息
 */
function myAlert(info, detail) {
	if(info == null) {
		return;
	}	

	var messageBox = $1("X-messageBox");
	if(messageBox == null) {
		var boxHtml = [];
		boxHtml[boxHtml.length] = "  <table class='full' style='table-layout:fixed'>";
		boxHtml[boxHtml.length] = "    <tr>";
		boxHtml[boxHtml.length] = "      <td valign='top' style='position:relative'>";
		boxHtml[boxHtml.length] = "        <img src='" + ICON + "icon_alert.gif' hspace='5' align='left'>";
		boxHtml[boxHtml.length] = "        <div id='infoBox'></div>";
		boxHtml[boxHtml.length] = "        <textarea id='detailBox' class='t' readOnly></textarea>";
		boxHtml[boxHtml.length] = "      </td>";
		boxHtml[boxHtml.length] = "    </tr>";
		boxHtml[boxHtml.length] = "    <tr>";
		boxHtml[boxHtml.length] = "      <td align='center' height='30' class='t'>";
		boxHtml[boxHtml.length] = "    		<input type='button' id='bt_ok' value='确 定' class='btStrong' onclick='closeMessage()'>";
		boxHtml[boxHtml.length] = "      </td>";
		boxHtml[boxHtml.length] = "    </tr>";
		boxHtml[boxHtml.length] = "  </table>";

		messageBox = document.createElement("div");    
		messageBox.id = "X-messageBox";    
		messageBox.className = "popupBox";
 		messageBox.innerHTML = boxHtml.join("");
		document.body.appendChild(messageBox);
	}
	messageBox.style.display = "block";
   
	var infoBox       = $1("infoBox");
	var detailBox     = $1("detailBox");
	var bt_ok         = $1("bt_ok");

	bt_ok.focus(); 
	detailBox.style.display = "none";
	infoBox.innerText = info.replace(/[\r\n]/g,"");

	if(detail && detail != "") {
		detailBox.value = detail.toString ? detail.toString() : "[object]";
		detailBox.style.display = "block";
		messageBox.style.height = "200px";
	}

	bt_ok.onclick = closeMessage;

	$.Event.attachEvent(document, "keydown", function(eventObj) {
        if(27 == eventObj.keyCode) { // ESC 退出
           closeMessage();
        }
    });

    function closeMessage() {
	    messageBox.style.display = "none";
	}
}
 
(function() {
	if(window.dialogArguments && window.dialogArguments.title) {
		document.write("<title>" + window.dialogArguments.title + new Array(100).join("　") + "</title>");
	}

	/* 禁止鼠标右键 */
	document.oncontextmenu = function(eventObj) {
		eventObj = eventObj || window.event;
		var srcElement = Event.getSrcElement(eventObj);
		var tagName = srcElement.tagName.toLowerCase();
		if("input" != tagName && "textarea" != tagName) {
			preventDefault(event);            
		}
	}

	window._alert = window.alert;
	window.alert = myAlert;

	/* 捕获页面js报错 */
	window.onerror = function(msg, url, line) {
		alert(msg, "错误:" + msg + "\r\n行:" + line + "\r\n地址:" + url);
		$.Event.cancel();
	};

	// 离开提醒
	window.onbeforeunload = function() {
		var count = Reminder.count;
		if(count > 0) {            
			return "当前有 <" + count + "> 项修改未保存，您确定要离开吗？";
		}
	}

})();


var Reminder = {
	this.items = {};   // 提醒项
	this.count = 0;

	this.add = function() {
		if( null == this.items[id] ) {
			this.items[id] = true;
			this.count ++;
		}
	}

	// ws里关闭tab页的时，可以自定义onTabClose事件，接触Tab页上的提醒
	this.del = function(id) {
		if(  this.items[id] ) {
			delete this.item[id];
			this.count --;
		}
	}

	/* 取消提醒 */
	this.reset = function() {
		this.items = {};   // 提醒项
		this.count = 0;
	}
};

/* 给xform等添加离开提醒 */
function attachReminder(id, form) {
	if( form ) {
		form.element.ondatachange = function(eventObj) {
			Reminder.add(eventObj.id); // 数据有变化时才添加离开提醒
		}
	}
	else {
		Reminder.add(id);
	}
}

function detachReminder(id) {
	Reminder.reset();
} 

/*********************** Tree 的 公用函数 **********************************/

function getActiveTreeNode(treeName) {
	return $T(treeName || "tree").getActiveTreeNode();
}

function getTreeAttribute(name, treeName) {
	var treeNode = getActiveTreeNode();
	if( treeNode ) {
		return treeNode.getAttribute(name);
	}
	return null;   
}

function getTreeNodeId() {
	return getTreeAttribute("id");
}

function getTreeNodeName() {
	return getTreeAttribute("name");
}

function isTreeNodeDisabled() {
	return getTreeAttribute("disabled") == "1";
}

function isTreeRoot() {
	return getTreeNodeId() == "_root";
}

/*
 *	修改树节点属性
 *	参数：  string:id               树节点id
			string:attrName         属性名
			string:attrValue        属性值
 */
function modifyTreeNode(id, attrName, attrValue, treeName) {
	var tree = $T(treeName || "tree");
	var treeNode = tree.getTreeNodeById(id);
	if( treeNode ) {
		treeNode.attrs[attrName] = attrValue;
		if(attrName == "name") {
			treeNode.li.a.innerText = activeNode.li.a.title = attrValue;
		}
	}
}

/* 添加子节点 */
function appendTreeNode(id, xmlNode, treeName) {
	var tree = $T(treeName || "tree");
	var treeNode = tree.getTreeNodeById(id);
	if( treeNode && xmlNode ) {
		tree.addTreeNode(xmlNode);
	}
}

/* 获取树全部节点id数组 */
function getTreeNodeIds(xmlNode) {
	var idArray = [];
	$.each(xmlNode.querySelectorAll("treeNode>treeNode"), function(i, curNode){
	  	var id = curNode.getAttribute("id");
		if( id ) {
			idArray.push(id);
		}
	});
	return idArray;
}

/* 根据条件将部分树节点设置为不可选状态 */
function disableTreeNodes(treeXML, selector) {
	var nodeLsit = treeXML.querySelectorAll(selector);
	for(var i = 0; i < nodeLsit.length; i++) {
		nodeLsit[i].setAttribute("disabled", "0");
	}
}
 			
/* 删除树选中节点 */
function removeTreeNode(tree, excludeIds) {
	excludeIds = excludeIds || ["_root"];

	tree.getCheckedNodes().each(function(i, node){
		if( !excludeIds.contains(node.id) ) {
			tree.removeTreeNode(node);
		}
	});
}

/*
 *	将树选中节点添加到另一树中(注：过滤重复id节点，并且结果树只有一层结构)
 *	参数：	Element:fromTree         树控件
			Element:toTree           树控件
			Function:checkFunction   检测单个节点是否允许添加
 */
function addTreeNode(fromTree, toTree, checkFunction) {	
	var reload = false;
	var selectedNodes = fromTree.getCheckedNodes(false);	
	selectedNodes.each(function(i, curNode) {
		var curNode = selectedNodes[i];
		if( !curNode.isEnable() ) {
			continue;  // 过滤不可选择的节点
		}

		if( checkFunction ) {
			var result = checkFunction(curNode);
			if( result && result.error ) {
				if( result.message ) {
					var balloon = $.Balloon(result.message);
					balloon.dockTo(toTree.el); // 显示错误信息
				}
				if( result.stop ) {
					return;
				}
				continue;
			}
		}

		var id = curNode.getId();
		var theSameNode = toTree.el.querySelector("li[nodeId='" + id + "']");
		if("_root" != id && theSameNode == null) {
			var parent = toTree.getTreeNodeById("_root");
			if( parent ) {
				toTree.addTreeNode(curNode.attrs, parent);
			}
		}
	});
}

// 删除选中树节点
function delTreeNode(url, treeName) {
	if( !confirm("您确定要删除该节点吗？") )  return;

	var tree = $T(treeName || "tree");
	var treeNode = tree.getActiveTreeNode();
	$.ajax({
		url : (url || URL_DELETE_NODE) + treeNode.id,
		method : "DELETE",
		onsuccess : function() { 
			tree.removeTreeNode(treeNode);
			tree.setActiveTreeNode(treeNode.parent.id);
		}
	});	
}

/*
 *	停用启用节点
 *	参数：	url      请求地址
			state    状态
 */
function stopOrStartTreeNode(state, url, treeName) {	
	if( state == "1" && !confirm("您确定要停用该节点吗？") )  return;
		
	var tree = $T(treeName || "tree");
	var treeNode = tree.getActiveTreeNode();
	Ajax({
		url : (url || URL_STOP_NODE) + treeNode.id + "/" + state,
		onsuccess : function() { 
			// 刷新父子树节点停用启用状态: 启用上溯，停用下溯
			refreshTreeNodeState(treeNode, state);
	
			if("1" == state) {
 				treeNode.children.each(function(i, child){
 					refreshTreeNodeState(child, state);
 				});
			} else if ("0" == state) {
				var parent = treeNode.parent;
				while( parent && parent.id != "_root") {
					refreshTreeNodeState(parent, state);
					parent = parent.parent;
				}            
			}
		}
	});
}

function refreshTreeNodeState(treeNode, state) {
	var iconPath = treeNode.getAttribute("icon");
	iconPath = iconPath.replace( /_[0,1].gif/gi, "_" + state + ".gif"); 
	
	treeNode.setAttribute("icon", iconPath);
	treeNode.li.selfIcon.css("backgroundImage", "url(" + iconPath + ")");
}

// 对同层的树节点进行排序
function sortTreeNode(url, ev) {
	var dragNode = ev.dragNode;
	var destNode = ev.destNode;
 
	$.ajax({
		url : url + dragNode.id + "/" + destNode.id + "/-1",
		onsuccess : function() { 
			ev.ownTree.sortTreeNode(dragNode, destNode);
		}
	});
}

// 移动树节点
function moveTreeNode(tree, id, targetId, url) {
	$.ajax({
		url : (url || URL_MOVE_NODE) + id + "/" + targetId,
		onsuccess : function() {  				
			var treeNode = tree.getTreeNodeById(id);
			var parent   = tree.getTreeNodeById(targetId);
			tree.moveTreeNode(treeNode, parent); // 移动树节点	

			// 父节点停用则下溯
			if( !parent.isEnable() ) {
				refreshTreeNodeState(treeNode, "1");
			}

			treeNode.setAttribute("_operation", null); // 清除树节点操作权限
		}
	});
}

/*********************** 和UM相关 的 公用函数 **********************************/
function showOnlineUser() {
	$.ajax({
		url : AUTH_PATH + "user/online",
		method : "GET",
		headers : {"appCode": FROMEWORK_CODE, "anonymous": "true"},
		onresult : function() { 
			var size  = this.getNodeValue("size");
			var users = this.getNodeValue("users");
			alert("当前共有" + size + "个用户在线：" + users);
		}
	});
}

function logout() {
	$.ajax({
		url : URL_CORE + "../logout.in",
		method : "GET",
		onsuccess : function() { 
			$.Cookie.del("token", "/" + CONTEXTPATH);
			$.Cookie.del("token", "/" + APPLICATION);
			$.Cookie.del("token", "");
			$.Cookie.del("token", "/");
			location.href = URL_CORE + "../login.html";
		}
	});
}

/* 检查密码强度 */
function checkPasswordSecurityLevel(formObj, url, password, loginName) {
	$.ajax({
		url : url,
		method : "POST",
		headers: {"appCode": APP_CODE},
		params : {"password": password, "loginName": loginName}, 
		onresult : function() {
			var securityLevel = this.getNodeValue(XML_SECURITY_LEVEL);
			var errorInfo = {
				0: "您输入的密码安全等级为不可用，不安全",
				1: "您输入的密码安全等级为低，只能保障基本安全",
				2: "您输入的密码安全等级为中，较安全",
				3: "您输入的密码安全等级为高，很安全"
			};
			formObj.showCustomErrorInfo("password", errorInfo[securityLevel]);
		}
	});
}

/*********************** 临时 公用函数 **********************************/
Element.show = function(element) {
	element.style.display = "block"; 
	element.style.position = "absolute";  
	element.style.left = "18%";   
	element.style.top  = "70px";    
	element.style.zIndex = "999"; 

	Element.setOpacity(element, 95);
},

Element.attachColResize = function(element) {
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