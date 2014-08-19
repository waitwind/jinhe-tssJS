;(function($, factory) {

	$.Tree = factory($);

})(tssJS, function($) {

	'use strict';

	var 
		_TREE_NODE = "treeNode",
		_TREE_NODE_ID = "id",
		_TREE_NODE_NAME = "name",
		_TREE_ROOT_NODE_ID = "_rootId",  /* “全部”节点的ID值  */

		_TREE_TYPE = "treeType",
		_TREE_TYPE_SINGLE = "single",
		_TREE_TYPE_MULTI  = "multi",

		_TREE_NODE_MOVEABLE = "moveable",    // 是否可以移动树节点，默认false
		_TREE_NODE_STATE = "disabled",       // 停用、启用

		_TREE_NODE_CHECKABLE = "checkable",
		_TREE_NODE_CHECKTYPE = "checktype",  // 没选、半选、全选
		_TREE_NODE_CHECK_SELF = "justSelf",  // 选中节点时只改变自己的选择状态，与父、子节点无关

		_STYLE_NODE_CHECKED = "checked",
		_STYLE_NODE_UN_CHECKED = "unChecked",
		_STYLE_NODE_HALF_CHECKED = "halfChecked",
		_STYLE_NODE_CHECK_DISABLED = "disableCheck",

		_STYLE_NODE_EXPAND = "expand",
		_STYLES_NODE_COLLAPSE = "collapse",		
		
		_STYLE_TREE = "tree",
		_STYLE_TREE_NODE_HOVER = "hover",
		_STYLE_TREE_NODE_MOVING = "moving",
		_STYLE_TREE_NODE_FINDED = "finded",
		_STYLE_TREE_NODE_CLICKED = "clicked",

		_STYLE_NODE_MOVE_TO_SHOW_LINE   = "1px solid #333399", // 目标节点划线样式
	    _STYLE_NODE_MOVE_TO_HIDDEN_LINE = "1px solid #ffffff", // 目标节点隐藏划线样式

	    /* 节点显示的行高（象素），用于计算显示的行数 */
		_TREE_NODE_HEIGHT = 21,	
		_TREE_SCROLL_BAR_WIDTH = 18;  // 滚动条的宽度（象素）

		var TreeNode = function(nodeXml, tree) {
			this.tree = tree;

			this.id = nodeXml.querySelector;

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

});