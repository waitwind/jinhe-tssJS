;(function($, factory) {

	$.Tree = factory($);

	var TreeCache = {};

    $.T = function(id, data) {
 		var tree = TreeCache[id];
		if( tree == null || data ) {
			tree = new $.Tree($1(id), data);
			TreeCache[tree.id] = tree;	
		}
		
		return tree;
	}

})(tssJS, function($) {

	'use strict';

	var 
		_TREE_NODE = "treeNode",
		_TREE_NODE_ID = "id",
		_TREE_NODE_NAME = "name",
		_TREE_ROOT_NODE_ID = "_root",  /* “全部”节点的ID值  */
		_TREE_NODE_STATE = "disabled",       // 停用、启用
		
		/* 树节点的选择状态：没选、半选、全选、禁选  0/1/2/-1 */
		_TREE_NODE_CHECK_STATE = "checkState",  
		_STYLE_NODE_UN_CHECKED = "checkstate_0",
		_STYLE_NODE_HALF_CHECKED = "checkstate_1",
		_STYLE_NODE_CHECKED = "checkstate_2",
		_STYLE_NODE_UN_CHECKED_DISABLED = "checkstate_0_disable",
		_STYLE_NODE_HALF_CHECKED_DISABLED = "checkstate_1_disable",
		_STYLE_NODE_CHECKED_DISABLED = "checkstate_2_disable",

		_STYLE_NODE_EXPAND = "node_open",
		_STYLE_NODE_COLLAPSE = "node_close",	
		_STYLE_NODE_LEAF = "node_leaf",		
		
		_STYLE_TREE_NODE_HOVER = "hover",
		_STYLE_TREE_NODE_MOVING = "moving",
		_STYLE_TREE_NODE_FINDED = "finded",
		_STYLE_TREE_NODE_CLICKED = "clicked",

	TreeNode = function(nodeInfo, parent) {

		this.id   = nodeInfo[_TREE_NODE_ID];
		this.name = nodeInfo[_TREE_NODE_NAME];

		// 维护成可双向树查找
		this.children = [];

		this.parent = parent;
		if(this.parent) {
			this.level = this.parent.level + 1;
			this.parent.children.push(this);
		} else {
			this.level = 1;
		}				

		this.opened = (nodeInfo._open == "true");
		this.state = parseInt(nodeInfo[_TREE_NODE_STATE] || "0");  // 状态： 停用/启用  1/0
		this.checkState = parseInt(nodeInfo[_TREE_NODE_CHECK_STATE] || "0"); /* 节点的选择状态 */

		var oThis = this;
		this.toHTMLEl = function() {
			var li = $.createElement("li");
			li.setAttribute("nodeID", this.id);
			li.node = this;

			// 节点打开、关闭开关
			var switchIcon = $.createElement("span", "switch");
			li.appendChild(switchIcon);

			// checkbox
			var checkbox = $.createElement("span", "checkbox");
			li.appendChild(checkbox);

			// 自定义图标
			var selfIcon = $.createElement("div", "selfIcon");
			li.appendChild(selfIcon);

			// 节点名称
			var a = $.createElement("a");
			a.innerText = a.title = this.name;
			li.appendChild(a);

			if(this.children.length > 0) {
 				var ul = $.createElement("ul");
 				ul.setAttribute("pID", this.id);
 				li.appendChild(ul);

 				$(switchIcon).addClass("node_close");
 				$(selfIcon).addClass("folder");
 				$(checkbox).addClass("checkstate_1");
			}
			else { // is leaf
				$(switchIcon).addClass("node_leaf");
				$(checkbox).addClass("checkstate_2");
				$(selfIcon).addClass("leaf");
			}

			return li;
		};

		this.toHTMLTree = function() {
			var stack = [];
			stack.push(this);

			var current, currentEl, rootEl, ul;
			while(stack.length > 0) {
				current = stack.pop();
				var currentEl = current.toHTMLEl(current);
				if(rootEl == null) {
					rootEl = currentEl;
				}
				else {
					ul = rootEl.querySelector("ul[pID ='" + current.parent.id + "']");
					ul.insertBefore(currentEl, ul.firstChild);
				}

				current.children.each(function(i, child) {
					stack.push(child);
				});
			}
 
			return rootEl;
		}
	};

	TreeNode.prototype = {
		
		disable: function() {

		}
	};


	var
		_TREE_TYPE = "treeType",
		_TREE_TYPE_SINGLE = "single",
		_TREE_TYPE_MULTI  = "multi",

		_TREE_NODE_MOVEABLE = "moveable",    // 是否可以移动树节点，默认false
		_TREE_NODE_CHECK_SELF = "justSelf",  // 选中节点时只改变自己的选择状态，与父、子节点无关

		_STYLE_NODE_MOVE_TO_SHOW_LINE   = "1px solid #333399", // 目标节点划线样式
		_STYLE_NODE_MOVE_TO_HIDDEN_LINE = "1px solid #ffffff", // 目标节点隐藏划线样式

	Tree = function(el, data) {
		/*  自定义事件 */
		var eventTreeReady       = new $.EventFirer(el, "onLoad"),
		 	eventTreeChange      = new $.EventFirer(el, "onChange"),
			eventNodeActived     = new $.EventFirer(el, "onTreeNodeActived"), 
			eventNodeDoubleClick = new $.EventFirer(el, "onTreeNodeDoubleClick"),
			eventNodeRightClick  = new $.EventFirer(el, "onTreeNodeRightClick"),
			eventNodeMoved       = new $.EventFirer(el, "onTreeNodeMoved");

		this.el = el;
		this.treeType  = el.getAttribute(_TREE_TYPE) || _TREE_TYPE_SINGLE;
		this.moveable  = el.getAttribute(_TREE_NODE_MOVEABLE) == "true";
		this.checkSelf = el.getAttribute(_TREE_NODE_CHECK_SELF) == "true";

		this.rootList = [];

		this.init = function() {
			if(data.nodeType) {
				loadXML(data);
			} else {
				loadJson(data);
			}

			var ul = $.createElement("ul");
			this.rootList.each(function(i, root){
				var li = root.toHTMLTree();
				ul.appendChild(li);
			});
			this.el.appendChild(ul);

			// this.seacher = new Seacher();

			eventTreeReady.fire($.Event.createEventObject()); // 触发载入完成事件
		}

		// 定义Tree私有方法
		var oThis = this;
		var loadXML = function(node, parent) {
			var xmlNodes = node.querySelectorAll("treeNode");
			var parents = {};
			$.each(xmlNodes, function(i, xmlNode) {
				var nodeAttrs = {};
				$.each(xmlNode.attributes, function(j, attr) {
					nodeAttrs[attr.nodeName] = attr.value;
				});

				var parentId = xmlNode.parentNode.getAttribute(_TREE_NODE_ID);
				var parent = parents[parentId];
				var treeNode = new TreeNode(nodeAttrs, parent);

				if(parent == null) {
					oThis.rootList.push(treeNode); // 可能存在多个根节点
				}	
				parents[treeNode.id] = treeNode;
			});
		};

		var loadJson = function(data) {

		};

		/********************************************* 以下添加树事件 *********************************************/
		/* 鼠标双击响应函数，触发自定义双击事件。 */
		this.el.ondblclick = function(event) {
			var srcElement
		};

		this.init();
	};

	Tree.prototype = {
		getTreeNodeById: function(id) {
			var li = this.el.querySelector("li[id='" + id + "']");
			return li ? li.node : null;
		},

		/* 获取当前高亮（激活）的节点（被激活的节点一次只有一个）。如果没有激活的节点，则返回null。*/
		getActiveTreeNode: function() {

		},

		/* 设定相应id的节点为激活状态。如果节点尚未被打开，那么先打开此节点。*/
		setActiveTreeNode: function(id) {
			var treeNode = this.getTreeNodeById(id);
			if(treeNode) {
				// 设置当前节点高亮，且显示其所有父节点及其兄弟节点；去掉原先高亮的节点；让节点出现在可视区域内
			}
		},

		addTreeNode: function(nodeInfo, parent) {
			// 让新增节点出现在可视区域内。
		},

		removeTreeNode: function(treeNode) {

		},

		/*
		 * 跟据目标节点和移动状态，移动节点位置。
		 * 参数：	from	移动节点TreeNode对象
		 *			to		目标节点TreeNode对象
		 *			direction		移动方向，-1为目标节点上方，1为目标节点下方
		 */
		moveTreeNode: function(from, to, direction) {
			from.moveTo(to, direction);
		},

 		getIDs: function(includeHalfChecked) {
 			if(includeHalfChecked) {
 				this.el.querySelectorAll("li>span[checkType=1]");
 				this.el.querySelectorAll("li>span[checkType=2]");
 			} else {
 				this.el.querySelectorAll("li>span[checkType=2]");
 			}
 		},

 		searchNode: function(searchStr, exact) {
 			if(this.searcher.search(searchStr, exact)) {
				this.searcher.first();
			}
 		},

 		/* 获取查询结果的下一个结果 */	
 		searchNext: function() {
 			this.searcher.next();
 		},

 		/* 将节点滚动到可视范围之内 */
 		scrollTo: function(treeNode) {
 			// first open the node
 			// this.el.scrollTop += 100;
 		}

	};

	return Tree;
});