
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