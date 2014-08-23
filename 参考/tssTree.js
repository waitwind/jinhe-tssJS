
	/*
	 * 	鼠标单击事件响应函数
	 *			如果点击的是选择状态图标，则改变选择状态，同时根据treeNodeSelectAndActive属性，确定是否同时激活该节点。
	 *			如果点击的是伸缩状态图标，则打开或收缩当前节点的直系子节点。
	 *			如果点击的是文字连接，则激活该节点，同时根据treeNodeSelectAndActive属性，确定是否同时改变节点选择状态。
	 */
	this.element.onclick = function() {
		var srcElement = window.event.srcElement;
		preventDefault(event);

		var row = getRow(srcElement);
		if(row instanceof Row) {
			var treeNode = instanceTreeNode(row.node, treeThis);
		}
		if( treeNode && (treeNode instanceof TreeNode) ) {
			if(srcElement == row.checkType) {		// 根据不同的treeType，改变相应的选择状态
				treeNode.changeSelectedState(window.event.shiftKey); // 是否按下shift键
			}
			else if(srcElement == row.folder) {
				treeNode.changeFolderState();	//展开、收缩节点的直系子节点
			}
			else if(srcElement == row.label || srcElement == row.icon) {
				treeNode.setActive(window.event.shiftKey); //激活节点
			}
			treeThis.display.reload();
		}
	}

	/********************************************* 节点拖动相关事件 *********************************************/

	/* 开始拖动事件响应，设定拖动节点 */
	this.element.ondragstart = function() {
		if( !treeThis.isCanMoveNode() ) return;

		var srcElement = window.event.srcElement;
		var row = getRow(srcElement);
		if( (row instanceof Row) && row.label == srcElement) {
			var node = row.node;	
			treeThis.setMovedNode(node); //设定拖动节点
			
			var tempData = {};
			tempData.moveTree = element;
			tempData.movedNode = node;
			tempData.movedNodeScrollTop = treeThis.display.getScrollTop() + getTop(srcElement, treeThis.element);
			tempData.movedRow = srcElement;
			window._dataTransfer = tempData;

			row.setClassName(_TREE_NODE_MOVED_STYLE);
			window.event.dataTransfer.effectAllowed = "move";
		}
	}

	/* 拖动完成，触发自定义节点拖动事件 */
	this.element.ondrop = function() { 		
		if( !treeThis.isCanMoveNode() || window._dataTransfer == null) return;
		
		var srcElement = window.event.srcElement;
		stopScrollTree(srcElement, treeThis);
		
		srcElement.runtimeStyle.borderBottom = _TREE_NODE_MOVE_TO_HIDDEN_LINE_STYLE;
		srcElement.runtimeStyle.borderTop = _TREE_NODE_MOVE_TO_HIDDEN_LINE_STYLE;
		
		//触发自定义事件
		var eObj = createEventObject();
		eObj.movedTreeNode = instanceTreeNode(window._dataTransfer.movedNode, treeThis);
		eObj.toTreeNode    = instanceTreeNode(window._dataTransfer.toNode, treeThis);
		eObj.moveState = window._dataTransfer.moveState;
		eObj.moveTree  = window._dataTransfer.moveTree; // 增加被拖动的节点所在树
		eventNodeMoved.fire(eObj); 
	}

	/* 拖动结束，去除拖动时添加的样式 */
	this.element.ondragend = function() {
		if( !treeThis.isCanMoveNode() ) return;	
		
		var srcElement = window.event.srcElement;
		stopScrollTree(srcElement, treeThis);
		
		var row = getRow(srcElement);
		if( (row instanceof Row) && srcElement == row.label) {
			srcElement.runtimeStyle.borderBottom = _TREE_NODE_MOVE_TO_HIDDEN_LINE_STYLE;
			srcElement.runtimeStyle.borderTop    = _TREE_NODE_MOVE_TO_HIDDEN_LINE_STYLE;
			treeThis.setMovedNode(null);
			treeThis.display.reload();
		}	
	}

	/* 拖动时，鼠标进入节点，设定目标节点和拖动状态  */
	this.element.ondragenter = function() {
		if(!treeThis.isCanMoveNode() || window._dataTransfer == null) return;
		
		var srcElement = window.event.srcElement;	
		startScrollTree(srcElement); //判断是否需要滚动树，如是则相应的滚动
		
		var row = getRow(srcElement);
		if(row instanceof Row) {
			var node = row.node;
		}

		// 拖动的不是文字链接，则无效
		if(!(row instanceof Row) || srcElement != row.label) {	
			return;
		}
		
		// 区分是否同一棵树
		if( window._dataTransfer.moveTree == this ) {
			if(node.parentNode != window._dataTransfer.movedNode.parentNode	// 不是兄弟节点无效
				|| srcElement == window._dataTransfer.movedRow) {	// 目标节点相同无效
				return;
			}
		}

		window._dataTransfer.toNode = node;
		if(treeThis.display.getScrollTop() + getTop(srcElement, treeThis.element) > window._dataTransfer.movedNodeScrollTop) {
			window._dataTransfer.moveState = 1;
			srcElement.runtimeStyle.borderBottom = _TREE_NODE_MOVE_TO_LINE_STYLE;
		} else {
			window._dataTransfer.moveState = -1;
			srcElement.runtimeStyle.borderTop = _TREE_NODE_MOVE_TO_LINE_STYLE;
		}
		preventDefault(event);
		window.event.dataTransfer.dropEffect = "move";
	}
	
	/* 拖拽元素在目标元素头上移动的时候 */
	this.element.ondragover = function() { 		
		preventDefault(event);
	}

	/* 拖动时，鼠标离开节点 */
	this.element.ondragleave = function() {
		if(!treeThis.isCanMoveNode()) return;
		
		var srcElement = window.event.srcElement;
		stopScrollTree(srcElement, treeThis);
		
		var row = getRow(srcElement);
		if( (row instanceof Row) && srcElement != row.label) {
			srcElement.runtimeStyle.borderBottom = _TREE_NODE_MOVE_TO_HIDDEN_LINE_STYLE;
			srcElement.runtimeStyle.borderTop = _TREE_NODE_MOVE_TO_HIDDEN_LINE_STYLE;
			window.event.dataTransfer.dropEffect = "none";
		}	
	}

 
	/* 是否为激活节点 */
	this.isActive = function() {
		return this.treeObj.isActiveNode(this.node);
	}

	/*
	 * 获取节点的选择状态
	 * 返回：	多选树：0/1/2；单选数：1/0
	 */
	this.getSelectedState = function() {
		var state = this.node.getAttribute(_TREE_NODE_CHECKTYPE);
		if(/^(1|2)$/.test(state)) {
			return parseInt(state);
		} 
		return 0;
	}

	/* 删除当前节点  */
	this.remove = function() {
		this.node.parentNode.removeChild(this.node); // 删除xml中的此节点
		this.treeObj.display.resetTotalTreeNodes();
		return true;
	}
 
	this.appendChild = function(newNode) {	
		return this._appendChild(newNode, this.node);
	}
 
	this.appendRoot = function(newNode) {
		return this._appendChild(newNode, this.getXmlRoot());
	}
	
	this._appendChild = function(newNode, parent) {	
		if( newNode == null || newNode.nodeName != _TREE_NODE ) {
			alert("TreeNode对象：新增节点xml数据不能正常解析！");
			return null;
		}

		if(newNode instanceof XmlNode) {
			newNode = newNode.node;
		}
		
		parent.appendChild(newNode); // 添加子节点
		var treeNode = instanceTreeNode(newNode, this.treeObj);
		if(treeNode instanceof TreeNode) {
			refreshStatesByNode(treeNode);		// 根据新节点的选择状态刷新相关节点
		}
		this.treeObj.display.resetTotalTreeNodes();

		return treeNode;
	}
	
	/*
	 * 移动当前节点
	 * 参数：	toTreeNode	目标节点的TreeNode对象
	 *			moveState	移动状态：-1，移动到目标节点的上面，1，移动到目标节点的下面，1为缺省状态
	 * 返回：	true/false	是否移动节点成功
	 */
	this.moveTo = function(toTreeNode, moveState) {
		if( !(toTreeNode instanceof TreeNode) || this.node.parentNode == null ) {
			return false;
		}
		
		var beforeNode = (moveState == -1) ? toTreeNode.getXmlNode() : toTreeNode.getXmlNode().nextSibling;
		toTreeNode.getXmlNode().parentNode.insertBefore(this.node, beforeNode);
		
		this.treeObj.display.resetTotalTreeNodes();
		return true;
	}
 
	/* 选中节点 */
	function justSelected(treeNode, state, noChildren) {
        if( !treeNode.treeObj.isMenu() ) {
            if(state == 1 && noChildren && treeNode.node.hasChildNodes()) {
                setNodeState(treeNode.node, 2);
            } else {
                setNodeState(treeNode.node, state);
            }
			
			// 刷新相应节点的选中状态
            refreshStatesByNode(treeNode, noChildren);	 
        }
	}
 
}

//////////////////////////////////////////////////////////////////////////////
//		                       公用函数	   	                                //
//////////////////////////////////////////////////////////////////////////////
  
/*
 *	获取树节点属性
 *	参数：	string:name         属性名
 *	返回值：string:value        属性值
 */
function getTreeAttribute(name, treeName) {
	var treeNode = getActiveTreeNode();
	if( treeNode ) {
		return treeNode.getAttribute(name);
	}
	return null;   
}

function getTreeNodeId() {
	return getTreeAttribute(_TREE_NODE_ID);
}

function getTreeNodeName() {
	return getTreeAttribute(_TREE_NODE_NAME);
}

function isTreeNodeDisabled() {
	return getTreeAttribute(_TREE_NODE_STATE) == "1";
}

function isTreeRoot() {
	return "_rootId" == getTreeNodeId();
}

/*
 *	修改树节点属性
 *	参数：  string:id               树节点id
			string:attrName         属性名
			string:attrValue        属性值
			string:refresh          是否刷新树
 *	返回值：
 */
function modifyTreeNode(id, attrName, attrValue, refresh, treeName) {
	var tree = $T(treeName || "tree");
	var treeNode = tree.getTreeNodeById(id);
	if( treeNode ) {
		treeNode.setAttribute(attrName, attrValue);
	}
	if( refresh ) {
		tree.reload();
	}
}

/*
 *	添加子节点
 *	参数：	string:id           树节点id
			XmlNode:xmlNode     XmlNode实例
 */
function appendTreeNode(id, xmlNode, treeName) {
	var tree = $T(treeName || "tree");
	var treeNode = tree.getTreeNodeById(id);
	if( treeNode && xmlNode ) {
		tree.insertTreeNodeXml(xmlNode, treeNode);
	}
}

/*
 *	获取树全部节点id数组
 *	参数：	XmlNode:xmlNode         XmlNode实例
			string:xpath            选取节点xpath
 *	返回值：Array:Ids               节点id数组
 */
function getTreeNodeIds(xmlNode, xpath) {
	  var idArray = [];
	  var treeNodes = xmlNode.selectNodes(xpath || "./treeNode//treeNode");
	  for(var i=0; i < treeNodes.length; i++) {
		  var curNode = treeNodes[i];
		  var id = curNode.getAttribute(_TREE_NODE_ID);
		  if( id ) {
			  idArray.push(id);
		  }
	  }
	  return idArray;
}
 
/*
 *	清除tree数据
 *	参数：	Element:treeObj         tree控件对象
 */
function clearTreeData(treeObj) {
	var xmlReader = new XmlReader("<actionSet/>");
	var emptyNode = new XmlNode(xmlReader.documentElement);
	treeObj.load(emptyNode.node);
}    

/* 根据条件将部分树节点设置为不可选状态 */
function disableTreeNodes(treeXML, xpath) {
	var nodeLsit = treeXML.selectNodes(xpath);
	if(nodeLsit) {
		for(var i = 0; i < nodeLsit.length; i++) {
			nodeLsit[i].setAttribute("canselected", "0");
		}
	}
}

function disableSingleTreeNode(treeXML, xpath) {
	var node = treeXML.selectSingleNode(xpath);
	if(node) {
		node.setAttribute("canselected", "0");
	}
}
			
/*
 *	删除树选中节点
 *	参数：	Element:treeObj         tree控件对象
			Array:exceptIds         例外的id
 */
function removeTreeNode(treeObj, exceptIds) {
	exceptIds = exceptIds || ["_rootId"];

	var selectedNodes = treeObj.getSelectedTreeNode();
	for(var i=0; i < selectedNodes.length; i++) {
		var curNode = selectedNodes[i];
		var id = curNode.getId();

		var flag = true;
		for(var j=0; j < exceptIds.length; j++) {
			if(id == exceptIds[j]) {
				flag = false;
				break;
			}
		}

		if(flag) {
			treeObj.removeTreeNode(curNode);
		}
	}
}

/*
 *	将树选中节点添加到另一树中(注：过滤重复id节点，并且结果树只有一层结构)
 *	参数：	Element:fromTree         树控件
			Element:toTree           树控件
			Function:checkFunction      检测单个节点是否允许添加
 */
function addTreeNode(fromTree, toTree, checkFunction) {	
	var reload = false;
	var selectedNodes = fromTree.getSelectedTreeNode(false);	
	for(var i=0; i < selectedNodes.length; i++) {
		var curNode = selectedNodes[i];

		if("0" == curNode.getAttribute("canselected")) {
			continue;  // 过滤不可选择的节点
		}

		curNode.setSelectedState(0, true, true);

		if( checkFunction ) {
			var result = checkFunction(curNode);
			if( result && result.error ) {
				// 显示错误信息
				if( result.message ) {
					var balloon = Balloons.create(result.message);
					balloon.dockTo(toTree.element);
				}

				if( result.stop ) {
					return;
				}
				continue;
			}
		}

		var groupName = curNode.getName();
		var id = curNode.getId();

		var sameAttributeTreeNode = hasSameAttributeTreeNode(toTree, _TREE_NODE_ID, id);
		if("_rootId" != id && false == sameAttributeTreeNode) {
			// 至少有一行添加才刷新Tree
			reload = true;

			// 排除子节点
			var treeNode = toTree.getTreeNodeById("_rootId");
			if( treeNode ) {
				var cloneNode = curNode.node.cloneNode(false);
				toTree.insertTreeNodeXml(cloneNode, treeNode);
			}
		}
	}

	if( reload ) {
		toTree.reload();
	}
	fromTree.reload();
}

/*
 *	检测是否有相同属性节点
 *	参数：	Element:treeObj         tree控件对象
			string:attrName         属性名
			string:attrValue        属性值
 */
function hasSameAttributeTreeNode(treeObj, attrName, attrValue) {
	var flag = false;
	var root = treeObj.getTreeNodeById("_rootId").node;
	var treeNode = root.selectSingleNode(".//treeNode[@" + attrName + "='" + attrValue + "']");
	if( treeNode ) {
		flag = true;
		flag.treeNode = treeNode;
	}
	return flag;
}

// 删除选中节点，适用于多层结构树
function delTreeNode(url, treeName) {
	if( !confirm("您确定要删除该节点吗？") )  return;

	var tree = $T(treeName || "tree");
	var treeNode = tree.getActiveTreeNode();
	Ajax({
		url : (url || URL_DELETE_NODE) + treeNode.getId(),
		method : "DELETE",
		onsuccess : function() { 
			var parentNode = treeNode.getParent();
			if( parentNode ) {
				tree.setActiveTreeNode(parentNode.getId());
			}
			tree.removeTreeNode(treeNode);
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
		url : (url || URL_STOP_NODE) + treeNode.getId() + "/" + state,
		onsuccess : function() { 
			// 刷新父子树节点停用启用状态: 启用上溯，停用下溯
			var curNode = new XmlNode(treeNode.node);
			refreshTreeNodeState(curNode, state);
	
			if("1" == state) {
				var childNodes = curNode.selectNodes(".//treeNode");
				for(var i=0; i < childNodes.length; i++) {                
					refreshTreeNodeState(childNodes[i], state);
				}
			} else if ("0" == state) {
				while( curNode && curNode.getAttribute(_TREE_NODE_ID) > 0 ) {
					refreshTreeNodeState(curNode, state);
					curNode = curNode.getParent();
				}            
			}
			
			tree.reload(); 
		}
	});
}

function refreshTreeNodeState(xmlNode, state) {
	xmlNode.setAttribute(_TREE_NODE_STATE, state);

	var iconPath = xmlNode.getAttribute("icon");
	iconPath = iconPath.replace( /_[0,1].gif/gi, "_" + state + ".gif");
	xmlNode.setAttribute("icon", iconPath); 
}

// 对同层的树节点进行排序
function sortTreeNode(url, eventObj, treeName) {
	var movedNode  = eventObj.movedTreeNode;
	var targetNode = eventObj.toTreeNode;
	var direction  = eventObj.moveState; // -1: 往上, 1: 往下
	var movedNodeID = movedNode.getId();
 
	if(targetNode) {
		Ajax({
			url : url + movedNodeID + "/" + targetNode.getId() + "/" + direction,
			onsuccess : function() { 
				 $T(treeName || "tree").moveTreeNode(movedNode, targetNode, direction);
			}
		});
	}
}

// 移动树节点
function moveTreeNode(tree, id, targetId, url) {
	Ajax({
		url : (url || URL_MOVE_NODE) + id + "/" + targetId,
		onsuccess : function() {  // 移动树节点					
			var treeNode = tree.getTreeNodeById(id);
			var xmlNode = new XmlNode(treeNode.node);
			var parentNode = tree.getTreeNodeById(targetId);

			// 父节点停用则下溯
			var parentNodeState = parentNode.node.getAttribute(_TREE_NODE_STATE);
			if("1" == parentNodeState) {
				refreshTreeNodeState(xmlNode, "1");
			}
			parentNode.node.appendChild(treeNode.node);
			parentNode.node.setAttribute("_open", "true");

			clearOperation(xmlNode);

			tree.reload();
		}
	});
}