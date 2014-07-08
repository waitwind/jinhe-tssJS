(function($) {

	'use strict';

	/* 树类型 */
	var _TREE_TYPE_SINGLE = "single";
	var _TREE_TYPE_MULTI  = "multi";

	/* 树控件属性名称 */
	var _TREE_BASE_URL         = "baseurl";
	var _TREE_TREE_TYPE        = "treeType";     // 树的类型 : multi / single
	var _TREE_CAN_MOVE_NODE    = "canMoveNode";  // 是否可以移动树节点，默认为false
	var _TREE_JUST_SELECT_SELF = "selectSelf";	          // 选中节点时只改变自己的选择状态，与父、子节点无关
	var _TREE_FOCUS_NEW_NODE   = "focusNewTreeNode";	  // 新增节点焦点不自动移到新节点上

	/* 节点属性名称 */
	var _TREE_NODE_ID        = "id";
	var _TREE_NODE_NAME      = "name";
	var _TREE_NODE_CANSELECT = "canselect";
	var _TREE_NODE_CHECKTYPE = "checktype";
	var _TREE_NODE_STATE     = "disabled"; // 启用/停用

	var _TREE_NODE         = "treeNode";  /* 节点名称 */
	var _TREE_ROOT_NODE_ID = "_rootId";   /* “全部”节点的ID值  */

	/* 选中状态图标地址（控件所在目录为根目录，起始不能有“/” */
	var _MULTI_NO_CHECKED_IMAGE     = "images/no_checked.gif";
	var _MULTI_CHECKED_IMAGE        = "images/checked.gif";
	var _MULTI_HALF_CHECKED_IMAGE   = "images/half_checked.gif";
	var _MULTI_CAN_NOT_CHECK_IMAGE  = "images/checkbox_disabled.gif";

	/* 伸缩状态图标地址 */
	var _TREE_NODE_COLLAPSED_IMAGE = "images/collapsed.gif";
	var _TREE_NODE_EXPAND_IMAGE    = "images/expand.gif";

	/* Tree相关样式名称 */
	var _TREE_STYLE = "Tree"; // 控件样式名
	var _TREE_NODE_OVER_STYLE       = "hover";    // 鼠标移到节点上方样式
	var _TREE_NODE_MOVED_STYLE      = "moved";    // 节点移动样式名称
	var _TREE_NODE_FINDED_STYLE     = "finded";   // 查询结果节点样式名称
	var _TREE_NODE_SELECTED_STYLE   = "selected"; // 节点选中样式名称
	var _TREE_NODE_ICON_STYLE       = "icon";     // 节点自定义图标样式名称
	var _TREE_NODE_FOLDER_STYLE     = "folder";   // 节点伸缩图标样式名称
	var _TREE_NODE_CHECK_TYPE_STYLE = "checkType";// 节点选择状态图标样式名称

	var _TREE_NODE_MOVE_TO_SHOW_LINE_STYLE   = "1px solid #333399"; // 目标节点划线样式
	var _TREE_NODE_MOVE_TO_HIDDEN_LINE_STYLE = "1px solid #ffffff"; // 目标节点隐藏划线样式

	/*
	 * 节点显示的行高（象素），只用于计算显示的行数，不能控制显示时行的高度
	 * 如果要修改显示的行高，修改样式文件
	 */
	var _TREE_NODE_HEIGHT = 21;	
	var _TREE_SCROLL_BAR_WIDTH = 18;  // 滚动条的宽度（象素）
	var _TREE_BOX_MIN_WIDTH  = 200;   // 树控件显示区最小宽度（象素）
	var _TREE_BOX_MIN_HEIGHT = 400;   // 树控件显示区最小高度（象素）

	var _TREE_SCROLL_DELAY_TIME = 0;          // 滚动条的滚动事件延迟时间（毫妙）
	var _TREE_SCROLL_REPEAT_DELAY_TIME = 300; // 拖动节点到最上、下行时循环滚动事件每次延迟时间（毫妙）

	/* 节点自定义图标尺寸 */
	var _TREE_NODE_ICON_WIDTH = 16;
	var _TREE_NODE_ICON_HEIGHT = 16;

	var TreeCache = new Collection();

	///////////////////////////////////////////////////////////////////////////
	//	对象名称：TreeNode											         //
	//	参数：	node	xml节点                                              //
	//  职责：	树节点对象接口。负责处理节点状态变化。	                     //
	///////////////////////////////////////////////////////////////////////////
	 
	/*
	 * 根据xml节点获取TreeNode对象的一个实例
	 * 参数：	nodeInfo	node的详细信息，由xml 或 json数据转换而来
	 * 参数：treeObj 所述的树对象
	 * 返回值：	TreeNode
	 */
	var TreeNode = function (nodeInfo, treeObj) {
		this.tree = treeObj;

		this.id   = nodeInfo[_TREE_NODE_ID];
		this.Name = nodeInfo[_TREE_NODE_NAME];

		// 维护成可双向树查找
		this.children = [];

		this.parent = this.tree.getNode(nodeInfo.parentId);
		this.level  = this.parent ? this.parent.level + 1 : 1;
		this.parent.children.push(this);	

		this.isOpen = (nodeInfo._open == "true");

		/* 是否为可选择节点 */
		this.canSelect = (nodeInfo[_TREE_NODE_CANSELECTED] != "0"); 

		/*
		 * 节点的选择状态, 多选树：0/1/2；单选数：1/0
		 */
		var state = nodeInfo[_TREE_NODE_CHECKTYPE];
		this.selectState = (/^(1|2)$/.test(state)) ? parseInt(state) : 0;

		var a = createObjByTagName("a");
		a.innerText = this.name;
		a.onclick =function() {

		};

		this.htmlNode = createObjByTagName("li");
		this.htmlNode.appendChild(a);

		for(var key in nodeInfo) {
			this.htmlNode[key] = nodeInfo[key];
		}

	}

	TreeNode.prototype = new function() {

		/*
		 * 设置选中状态，同时刷新相关节点的选择状态
		 * 参数：	state	选择状态
		 *	  onlyself	只选中自己节点（不选中子节点）
		 */
		this.setSelectedState = function(state, onlyself) {
			if( !this.isCanSelected() ) {	// 不可选择
				return;
			}

			justSelected(this, state, onlyself);
			
			if( !this.isActive() && state == 1 && (this.treeObj instanceof SingleCheckTree) ) {
				justActive(this);
			}
		}
	 
		/*
		 * 激活节点
		 * 参数：onlyself		选中节点时，是否不包含子节点
		 */
		this.setActive = function(onlyself) {
			if( !this.isCanSelected() ) {
				return;
			}
			
	        justActive(this);
			justSelected(this, this.treeObj.getNextState(this), onlyself);
		}

		/* 打开节点，让节点出现在可视区域内。*/
		this.focus = function() {
			// 打开未被打开的父节点，父节点的父节点，以此类推。
			openNode(this.node.parentNode);

			var display = this.treeObj.display;
			display.resetTotalTreeNodes();	
			display.scrollTo(this.node); // 如果节点没有在可视区域内，则滚动节点到可是区域
		}
	 
		/* 点击文字标签时，改变节点伸缩状态 */
		this.changeFolderStateByActive = function() {
			this.treeObj.changeOpenStateByActive(this);
		}

		/* 改变节点的伸缩状态 */
		this.changeFolderState = function() {
			if(this.isOpened()) {	
				this.close();	// 关闭子节点
			} 
			else {
				this.open();	// 打开子节点
			}
		}

		/* 打开子节点 */
		this.open = function() {
			this.isOpen = true;	// 标记当前节点为打开状态
			this.setAttribute("_open", "true");

			for(var i = 0; i < this.children.length; i++) {
				var child = this.children[i];
				// TODO 显示子节点
			}
		}

		/* 关闭子节点 */
		this.close = function() {
			this.isOpen = false;

			
		}

		this.isLast = function() {
			return this.parent.children[this.parent.children.length - 1] == this;
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

		/* 获取当前节点的XML节点对象，该对象是一个浅拷贝对象（不包含当前节点子节点）。*/
		this.toElement = function() {
			return this.node.cloneNode(false);
		}
	 
		this.toString = function() {
			return this.toElement().xml;
		}

		

		/* 激活节点，触发相应事件 */
		function justActive(treeNode) {
			treeNode.treeObj.setActiveNode(treeNode);	
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
		
		/*
		 * 根据给定的节点的选中状态，刷新相应节点的选中状态
		 * 参数：	TreeNode节点对象
		 *			noChildren	选中节点时，只选中自己节点，不影响子节点
		 */
		function refreshStatesByNode(treeNode, noChildren) {
			treeNode.treeObj.refreshStates(treeNode, noChildren);
		}
	}

	$.extend({
		"createTree": function(treeId, dataXML) {
				var tree = TreeCache.get(treeId);
				if( tree == null || dataXML ) {
					var element = $$(treeId);
					element._dataXML = (typeof(dataXML) == 'string') ? dataXML : dataXML.toXml();

					var _treeType = element.getAttribute(_TREE_TREE_TYPE);
					if(_treeType == _TREE_TYPE_MULTI) {
						tree = new MultiCheckTree(element);
					} 
					else {
						tree = new SingleCheckTree(element);
					}
					
					TreeCache.add(element.id, tree);
				}

				return tree;
			},

		"": null
	})
	
})(jQuery);