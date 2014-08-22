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
		_TREE_TYPE = "treeType",
		_TREE_TYPE_SINGLE = "single",
		_TREE_TYPE_MULTI  = "multi",

		_TREE_NODE_MOVEABLE = "moveable",    // 是否可以移动树节点，默认false
		_TREE_NODE_CHECK_SELF = "justSelf",  // 选中节点时只改变自己的选择状态，与父、子节点无关

	Tree = function(el, data) {
		/*  自定义事件 */
		var eventTreeReady       = new $.EventFirer(this, "onLoad"),
		 	eventTreeChange      = new $.EventFirer(this, "onChange"),
			eventNodeActived     = new $.EventFirer(this, "onTreeNodeActived"), 
			eventNodeDoubleClick = new $.EventFirer(this, "onTreeNodeDoubleClick"),
			eventNodeRightClick  = new $.EventFirer(this, "onTreeNodeRightClick"),
			eventNodeMoved       = new $.EventFirer(this, "onTreeNodeMoved");

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

			eventTreeReady.fire(); // 触发载入完成事件
		}

		// 定义Tree私有方法
		var tThis = this;
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
					tThis.rootList.push(treeNode); // 可能存在多个根节点
				}	
				parents[treeNode.id] = treeNode;
			});
		};

		var loadJson = function(data) {

		};

		// 树控件上禁用默认右键和选中文本（默认双击会选中节点文本）
		this.el.oncontextmenu = this.el.onselectstart = function(_event) {
			$.Event.cancel(_event || window.event);
		}		

		/********************************************* 定义树节点TreeNode start *********************************************/
		var 
			_TREE_NODE = "treeNode",
			_TREE_NODE_ID = "id",
			_TREE_NODE_NAME = "name",
			_TREE_ROOT_NODE_ID = "_root",  /* “全部”节点的ID值  */
			_TREE_NODE_STATE = "disabled",       // 停用、启用
			
			/* 
			 * 树节点的选择状态：没选(UN_CHECKED)、半选(HALF_CHECKED)、全选(CHECKED)  0/1/2/ 
			 * 禁选(CHECKED_DISABLED)状态下，也分没选、半选、全选
			 */
			_TREE_NODE_CHECK_STATE = "checkState",  

		clickSwich = function(node) {
			node.opened = !node.opened;

			var styles = ["node_close", "node_open"],
				index = node.opened ? 0 : 1;

			$(node.li.switchIcon).removeClass(styles[index]).addClass(styles[++index % 2]);

			if(node.li.ul) {
				if(node.opened) {
					$(node.li.ul).removeClass("hidden");
				} else {
					$(node.li.ul).addClass("hidden");
				}
			}
		},

		/* 根据现有状态改成下一个选择状态，0-->2,  1|2-->0 */
		checkNode = function(node) {
			var oldState = node.checkState;
			switch(oldState) {
				case 0:
					node.checkState = 2;
					break;
				case 1:
				case 2:
					node.checkState = 0;
					break;
			}

			setNodeState(node, oldState);

			// TODO 改变子节点及父节点的check状态
			var parent = node;
			while(parent = parent.parent) {
				var oldState = parent.checkState;
				parent.checkState = Math.max(oldState, 1);
				setNodeState(parent, oldState);
			}

			if(!tThis.checkSelf) {
				node.children.each(function(i, child) {
					child.checkState = 2;
					setNodeState(child);
				});
			}
		},

		setNodeState = function(node, oldState) {
			$(node.li.checkbox).removeClass("checkstate_" + oldState + "_" + node.disabled)
				.addClass("checkstate_" + node.checkState + "_" + node.disabled);
		},

		TreeNode = function(nodeInfo, parent) {			
			this.id   = nodeInfo[_TREE_NODE_ID];
			this.name = nodeInfo[_TREE_NODE_NAME];

			this.opened = (nodeInfo._open == "true");
			this.disabled = nodeInfo[_TREE_NODE_STATE] || "0";  // 状态： 停用/启用  1/0
			this.checkState = parseInt(nodeInfo[_TREE_NODE_CHECK_STATE] || "0"); /* 节点的选择状态 */

			// 维护成可双向树查找
			this.children = [];

			this.parent = parent;
			if(this.parent) {
				this.level = this.parent.level + 1;
				this.parent.children.push(this);
			} else {
				this.level = 1;
			}				

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
			};
		};

		TreeNode.prototype = {
			toHTMLEl: function() {
				var li = $.createElement("li");
				li.setAttribute("nodeID", this.id);
				li.node = this;
				this.li = li;

				// 节点打开、关闭开关
				var switchIcon = $.createElement("span", "switch");
				li.appendChild(switchIcon);
				li.switchIcon = switchIcon;

				// checkbox
				var checkbox = $.createElement("span", "checkbox");
				li.appendChild(checkbox);
				li.checkbox = checkbox;

				// 自定义图标
				var selfIcon = $.createElement("div", "selfIcon");
				li.appendChild(selfIcon);

				// 节点名称
				var a = $.createElement("a");
				a.innerText = a.title = this.name;
				li.appendChild(a);
				li.a = a;
				if( !this.isEnable() ) {
					this.disable();
				}

				if(tThis.treeType == _TREE_TYPE_SINGLE) {
					$(checkbox).addClass("hidden");
				}

				if(this.children.length > 0) {
	 				var ul = $.createElement("ul");
	 				ul.setAttribute("pID", this.id);
	 				li.appendChild(ul);
	 				li.ul = ul;

	 				this.opened = !this.opened;
	 				clickSwich(this);

	 				$(selfIcon).addClass("folder");
				}
				else { // is leaf
					$(switchIcon).addClass("node_leaf").css("cursor", "default");
					$(selfIcon).addClass("leaf");
				}

				// 添加事件
				var nThis = this;
				a.onclick = function(event) {
					nThis.active();

					event.node = nThis;
					eventNodeActived.fire(event);
				};
				a.ondblclick = function(event) {
					nThis.active();

					event.node = nThis;
					eventNodeDoubleClick.fire(event);
				};
				a.oncontextmenu = function(event) {
					nThis.active();

					// 触发右键激活节点事件
					var _event = $.Event.createEventObject();
					_event.treeNode = nThis;
					_event.clientX = event.clientX;
					_event.clientY = event.clientY;
					eventNodeRightClick.fire(_event);
				};

				$(switchIcon).click( function() { clickSwich(nThis); } );
				$(checkbox).click( function() { checkNode(nThis); } );

				return li;
			},
			
			disable: function() {
				this.disabled = "1";
				$(this.li.a).addClass("disable");
				setNodeState(this.li.node);
			},

			isEnable: function() {
				return this.disabled != "1";
			},

			active: function() {
				$.each(tThis.el.querySelectorAll("li"), function(i, li) {
					$(li.a).removeClass("active");
				});
				if(this.isEnable()) {
					$(this.li.a).addClass("active");
				}
			},
		};
		/********************************************* 定义树节点TreeNode end *********************************************/

		tThis.init();
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