;(function ($, factory) {

    $.Grid = factory($);

    var GridCache = new Collection();

    $.G = function(gridId, data) {
 		var grid = GridCache.get(gridId);
		if( grid == null || data ) {
			grid = new $.Grid($("#" + gridId)[0], data);
			GridCache.add(grid.id, grid);	
		}
		
		return grid;
	}

})(tssJS, function ($) {

    'use strict';

    var 
    scrollbarSize = 17,
	cellHeight = 22,  // 数据行高

	GridTemplate = function(xmlDom) {
		this.declare = xmlDom.querySelector("declare");
		this.script  = xmlDom.querySelector("script");
		this.columns = this.declare.querySelectorAll("column");
		this.dataRows = xmlDom.querySelectorAll("data row");

		this.columnsMap = {};
		this.columns.each(function(index, column) {
			this.columnsMap[column.getAttribute("name")] = column;
		});

		this.hasHeader    = this.declare.getAttribute("header") == "checkbox";
		this.needSequence = this.declare.getAttribute("sequence") != "false";
	};

	GridTemplate.prototype = {
		toHTML: function(template, startNum, gridID) {
			var htmls = [], thead = [], tbody = [];

			thead.push('<thead><tr>');
			if(this.hasHeader) {
				thead.push('<td class="column"><input type="checkbox" id="checkAll"/></td>');
			}
			if(this.needSequence) {
				thead.push('<td class="column" name="sequence">序号</td>');
			}
			$.each(this.columnsMap, function(name, column) {
				var caption  = column.getAttribute("caption");
			 	var width    = column.getAttribute("width");
				width = width ? ' width="' + width + '" ' : '';
				var _class   = ' class=' + column.getAttribute("display") == "none" ?  "hidden" : "column";
				var sortable = column.getAttribute("sortable") == "true" ? 'sortable="true"' : '';
				var align = ' align="' + getAlign(column) + '" ';
				thead.push('<td name="' + name + '" ' + width + align + _class + sortable + '>' + caption + '</td>');
			});
			thead.push("</tr></thead>");
 
 			tbody.push('<tbody class="cell">');
 			this.dataRows.each(function(i, row) {
				var index = startNum + i + 1;
				tbody.push("<tr _index="" + index + "" >");

				if(this.hasHeader) {
					tbody.push('<td align="center" mode="cellheader" name="cellheader">');
					tbody.push('	<input class="selectHandle" name="' + gridID + '_cb" type="checkbox" >');
					tbody.push("</td>")
				}
				if(this.needSequence) {
					tbody.push('<td align="center" mode="cellsequence" name="cellsequence">' + index + '</td>');
				}

				for(var name in this.columnsMap) {
					var column = this.columnsMap[name];
					var value = row.getAttribute(name);
					value = value || "";
					
					var _class = "";
					if(column.getAttribute("display") == "none") {
						_class = 'class="hidden"';
					} 
					else if(column.getAttribute("highlightCol") == "true") {
						_class = 'class="highlightCol"';
					}

					var align = 'align="' + getAlign(column) + '"';
					tbody.push('<td name="' + name + '" ' + _class + align + '>' + value + '</td>');
				}

				tbody.push("</tr>");
 			});
			tbody.push("</tbody>");

		    htmls.push("<table>");
			htmls.push(thead.join(""));
			htmls.push(tbody.join(""));
			htmls.push("</table>");
			return htmls.join("");
		}

		function getAlign(column) {
			var align = column.getAttribute("align");
			if(align) {
				return align;
			}

			switch(column.getAttribute("mode")) {
				case "number":
					return "right";
				case "boolean":
				case "date":
					return "center";
				default:
					return "left";
			}
		}
	}; 

	var Grid = function(element, data) {
		this.id = element.id;
		this.element = element;

		this.gridBox = $.createElement("div");
		this.element.append(this.gridBox);

		this.gridBox.style.width = element.getAttribute("width")  || "100%";
		var pointHeight = element.getAttribute("height");
		if( pointHeight ) {
			this.gridBox.style.height = this.windowHeight = pointHeight;
		} else {
			this.gridBox.style.height = element.clientHeight; // hack 固定住grid高度，以免在IE部分版本及FF里被撑开
			this.windowHeight = Math.max(element.offsetHeight, 500);
		}

		this.pageSize = Math.floor(this.windowHeight / cellHeight);
		
		this.load(data);	

		// 添加Grid事件处理
		this.addGridEvent();	
	};

	Grid.prototype = {
		load: function(data, append) {
			if("object" != typeof(data) || data.nodeType != _XML_NODE_TYPE_ELEMENT) {
				alert("传入的Grid数据有问题。")	
			} 

			// 初始化变量
			var startNum = append ? this.totalRowsNum : 0;	

			this.template = new GridTemplate(data.node);	
			var gridTableHtml = this.template.toHTML(startNum, this.id); // 解析成Html
			
			if(append) {
				var tempParent = $.createElement("div");
				$(tempParent).html(gridTableHtml);
				var newRows = tempParent.childNodes[0].tBodies[0].rows;
				for(var i=0; i < newRows.length; i++) {
					var cloneRow = newRows[i].cloneNode(true);
					this.tbody.appendChild(cloneRow);
				}
			}
			else {
				$(this.gridBox).html(gridTableHtml);
				this.tbody = this.gridBox.querySelector("tbody");
				var thList = this.gridBox.querySelectorAll("thead tr");	
				
				Element.ruleObjList = []; // 先清空原来的拖动条
				for( var i = 0; i < thList.length; i++ ) {
					Element.attachColResizeII(thList[i]);

					// 给表头添加双击、拖动等事件
					// 设置隐藏列事件，双击隐藏列
					// 拖动改变列宽
				}
			}
			
			var table  = this.gridBox.querySelector("table");
			this.rows  = this.tbody.rows;
			this.totalRowsNum = this.rows.length;
			for(var i = startNum; i < this.totalRowsNum; i++) {
				this.processDataRow(this.rows[i]); // 表格行TR
			}
			
			bindSortHandler(table); // table
		}, 

		/* 处理数据行,将值解析成下拉列表值、图片、选择框等 */
		processDataRow: function(curRow) {
			$(curRow).hover(
				function() { 
					this.addClass("rolloverRow"); 
			 	}, 
				function() { 
					this.removeClass("rolloverRow");
				} 
			);
			
			var cells = curRow.cells;
			for(var j=0; j < cells.length; j++) {
				var cell = cells[j];
				var columnName = cell.getAttribute("name");
				var columnNode = this.template.columnsMap[columnName]; 
				if( columnName == null || columnName == "cellsequence" || columnName == "cellheader" || columnNode == null)  {
					continue;
				}

				var value = cell.innerText;
				var mode = columnNode.getAttribute("mode") || "string";
				switch( mode ) {
					case "string":
						var editor = columnNode.getAttribute("editor");
						var editortext = columnNode.getAttribute("editortext");
						var editorvalue = columnNode.getAttribute("editorvalue");
						if(editor == "comboedit" && editorvalue && editortext) {
							var listNames  = editortext.split("|");
							var listValues = editorvalue.split("|");
							listValues.each(function(n, optionValue) {
								if(value == optionValue) {
									value = listNames[n];
								}
							});
						}
						
						nobrNodeInCell.innerText = value;
						cell.setAttribute("title", value);								
						break;
					case "number":  
					case "date":
						cell.setAttribute("title", value);
						break;         
					case "function":                          
						break;    
					case "image":          
						cell.innerHTML = "<img src='" + value + "'/>";
						break;    
					case "boolean":      
						var checked = (value =="true") ? "checked" : "";
						cell.innerHTML = "<form><input class='selectHandle' type='radio' " + checked + "/></form>";
						cell.querySelector("input").disabled = true;
						break;
				}							
			}	
		},

		/*
		 * 根据页面上的行数，获取相应的Row对象
		 * 参数：	index	行序号
		 * 返回值：	Row对象
		 */
		getRowByIndex: function(index) {
			for(var i = 0; i < this.rows.length; i++) {
				var row = this.rows[i];
				if(row.getAttribute("_index") == index) {
					return row;
				}
			}
		},

		// 获取选中行中指定列的值
		getRowAttributeValue: function(attrName) {
			var rowIndex = this.element.selectRowIndex; 
			if(rowIndex) {
				var row = this.getRowByIndex(rowIndex);
				return row.getAttribute(attrName);
			}
		},

		// 获取某一列的值
		getColumnValues: function(columnName) {
			var values = [];
			this.rows.each(function(i, row) {
				values[i] = row.getAttribute(columnName);
			});
			return values;
		},

		// 新增一行
		insertRow: function(map) {
			var rowIndex = this.totalRowsNum ++ ;
			var newRow = this.tbody.insertRow(rowIndex);

			var thList = this.gridBox.querySelectorAll("table thead tr");
			thList.each(function(i, th) {
				var columnName = th.getAttribute("name");
				
				var cell = newRow.insertCell(i);
				cell.setAttribute( "name", columnName );
				
				var column = this.template.columnsMap[columnName];
				if(column && column.getAttribute("display") == "none" ) {
					$(cell).addClass("hidden");
				} 
				else {
					$(cell).addClass("column");
				}

				if(columnName == "sequence") {
					cell.innerText = this.totalRowsNum;
				}

				if(map[columnName]) { {
					cell.innerText = map[columnName];
				}
			});
 
			this.processDataRow(newRow);
		},

		// 删除单行
		deleteRow: function(row) {
			this.tbody.removeChild(row);
		},

		deleteRowByIndex: function(rowIndex) {
			var row = this.getRowByIndex(rowIndex);
			this.deleteRow(row);
		},

		deleteSelectedRow: function() {
			var rowIndex = this.element.selectRowIndex;
			this.deleteRowByIndex(rowIndex);
		},
			
		// 更新单行记录的某个属性值
		modifyRow: function(row, attrName, value) {
			row.setAttribute(attrName, propertyValue);
			this.processDataRow(row);
		},

		modifyRowByIndex: function(rowIndex, attrName, value) {
			var row = this.getRowByIndex(rowIndex);
			this.modifyRow(row, attrName, value);
		},

		modifySelectedRow: function(attrName, value) {
			var rowIndex = this.element.selectRowIndex;
			this.modifyRowByIndex(rowIndex, attrName, value);
		},

		getHighlightRow: function() {
			return this.tbody.querySelector(".rolloverRow");
		},

		// 添加Grid事件处理
		addGridEvent: function() {			
			var oThis = this;

			this.gridBox.onscroll = function() {
				 // 判断是否到达底部 
				 if(this.scrollHeight - this.scrollTop <= this.clientHeight) {
					var eventFirer = new $.EventFirer(oThis.element, "onScrollToBottom");
					eventFirer.fire($.Event.createEventObject());
				 }
			};

			this.element.onmousewheel = function() {
				this.gridBox.scrollTop += -Math.round(window.event.wheelDelta / 120) * cellHeight;
			};
			
			this.element.onkeydown = function() {
				switch (event.keyCode) {
				    case 33:	//PageUp
						oThis.gridBox.scrollTop -= oThis.pageSize * cellHeight;
						return false;
				    case 34:	//PageDown
						oThis.gridBox.scrollTop += oThis.pageSize * cellHeight;
						return false;
				    case 35:	//End
						oThis.gridBox.scrollTop = oThis.gridBox.offsetHeight - oThis.windowHeight;
						return false;
				    case 36:	//Home
						oThis.gridBox.scrollTop = 0;
						return false;
				    case 37:	//Left
						oThis.gridBox.scrollLeft -= 10;
						return false;
				    case 38:	//Up
						oThis.gridBox.scrollTop -= cellHeight;
						return false;
				    case 39:	//Right
						oThis.gridBox.scrollLeft += 10;
						return false;
				    case 40:	//Down
						oThis.gridBox.scrollTop += cellHeight;
						return false;
				}
			};
		 
			this.element.onclick = function() { // 单击行
				fireClickRowEvent(this, event, "onClickRow");
			};

			this.element.ondblclick = function() { // 双击行
				fireClickRowEvent(this, event, "onDblClickRow");
			};

			this.element.oncontextmenu = function() {
				fireClickRowEvent(this, event, "onRightClickRow"); // 触发右键事件
			};

		    // 触发自定义事件
			function fireClickRowEvent(gridElement, event, firerName) {
				var _srcElement = event.srcElement;
				if( notOnGridHead(_srcElement) ) { // 确保点击处不在表头
					var trObj = _srcElement;
					while( trObj.tagName.toLowerCase() != "tr" ) {
						trObj = trObj.parentElement;
					}

					if(trObj && trObj.getAttribute("_index") ) {
						var rowIndex = parseInt( trObj.getAttribute("_index") );
						var oEvent = $.Event.createEventObject();
						oEvent.result = {
							rowIndex: rowIndex
						};

						gridElement.selectRowIndex = rowIndex;
						var eventFirer = new $.EventFirer(gridElement, firerName);
						eventFirer.fire(oEvent);  // 触发右键事件
					}	
				}		
			}
			
			// 确保点击处不在表头
			function notOnGridHead(srcElement) { 
				return !isContainTag(srcElement, "THEAD");
			}
			
			function isContainTag(obj, tag) {
		        while( obj ) {
					if (obj.tagName == tag) {
						return true;
					}
		            obj = obj.parentElement;
		        }
				return false;
		    }
		}
	};

    return Grid;
});


;(function($){

	/*
	 *	翻页工具条
	 *	参数：	object:pageBar      工具条对象
				XmlNode:pageInfo        XmlNode实例
				function:callback       回调函数
	 */
	$.createGridToolBar = function(pageBar, pageInfo, callback) {
		pageBar.init = function() {
			this.innerHTML = ""; // 清空内容

			var totalpages = pageBar.getTotalPages();
			var curPage = pageBar.getCurrentPage();

			var str = [];
			str[str.length] = '<span class="button refresh" id="GridBtRefresh" title="刷新"></span>';
			str[str.length] = '<span class="button first"   id="GridBtFirst"   title="第一页"></span>';
			str[str.length] = '<span class="button prev"    id="GridBtPrev"    title="上一页"></span>';
			str[str.length] = '<span class="button next"    id="GridBtNext"    title="下一页"></span>';
			str[str.length] = '<span class="button last"    id="GridBtLast"    title="最后一页"></span>';
			
			str[str.length] = '<select id="GridPageList">';
			for(var i=1; i <= totalpages; i++) {
				str[str.length] = '  <option value="' + i + '"' + (curPage == i ? ' selected' : '') + '>' + i + '</option>';
			}
			str[str.length] = "</select>";

			this.innerHTML = str.join("");
 
			$("#GridBtRefresh").click(function() {
				var curPage = pageBar.getCurrentPage();
				pageBar.gotoPage(curPage);
			});
			$("#GridBtFirst").click(function() {
				pageBar.gotoPage("1");
			});
			$("#GridBtLast").click(function() {
				var lastpage = pageBar.getLastPage();
				pageBar.gotoPage(lastpage);
			});
			$("#GridBtNext").click(function() {
				var curPage  = pageBar.getCurrentPage();
				var lastpage = pageBar.getLastPage();
				if(curPage < lastpage) {
					pageBar.gotoPage(curPage + 1);
				}
			});
			$("#GridBtPrev").click(function() {
				var curPage = pageBar.getCurrentPage();
				if(curPage > 1) {
					pageBar.gotoPage(curPage - 1);
				}
			});
			$.Event.addEvent($("#GridPageList")[0], "change", function() {
				pageBar.gotoPage(this.value);
			});
		}
		
		pageBar.getCurrentPage = function() {
			var currentpage = pageInfo.getAttribute("currentpage");
			return currentpage ? parseInt(currentpage) : 1;
		}
		
		pageBar.getLastPage = function() {
			var lastpage = this.getTotalPages();
			return lastpage ? parseInt(lastpage) : 1;
		}
		
		pageBar.getTotalPages = function() {
			var totalpages = pageInfo.getAttribute("totalpages");
			return totalpages ? parseInt(totalpages) : 1;
		}
		
		pageBar.gotoPage = function(page) {
			callback(page); // 转到指定页
		}
		
		pageBar.init();
	};

	$.showGrid = function(serviceUrl, dataNodeName, editRowFuction, gridName, page, requestParam, pageBar) {
		pageBar  = pageBar  || $$("gridToolBar");
		gridName = gridName || "grid";
		page     =  page || "1";

		var p = requestParam || new HttpRequestParams();
		p.url = serviceUrl + "/" + page;

		var request = new HttpRequest(p);
		request.onresult = function() {
			if($$(gridName).getAttribute("height") == null) {
				$$(gridName).setAttribute("height", $$(gridName).clientHeight); // hack for IE11
			}
			
			$G(gridName, this.getNodeValue(dataNodeName)); 
	 
			var gotoPage = function(page) {
				request.paramObj.url = serviceUrl + "/" + page;
				request.onresult = function() {
					$G(gridName, this.getNodeValue(dataNodeName)); 
				}				
				request.send();
			}

			var pageInfoNode = this.getNodeValue(XML_PAGE_INFO);			
			initGridToolBar(pageBar, pageInfoNode, gotoPage);
			
			var gridElement = $$(gridName); 
			gridElement.onDblClickRow = function(eventObj) {
				editRowFuction();
			}
			gridElement.onRightClickRow = function() {
				gridElement.contextmenu.show(event.clientX, event.clientY);
			}   
			gridElement.onScrollToBottom = function () {			
				var currentPage = pageBar.getCurrentPage();
				if(pageBar.getTotalPages() <= currentPage) return;

				var nextPage = parseInt(currentPage) + 1; 
				request.paramObj.url = serviceUrl + "/" + nextPage;
				request.onresult = function() {
					$G(gridName).load(this.getNodeValue(dataNodeName), true);

					var pageInfoNode = this.getNodeValue(XML_PAGE_INFO);
					initGridToolBar(pageBar, pageInfoNode, gotoPage);
				}				
				request.send();
			}
		}
		request.send();
	}

})(tssJS);

function bindSortHandler(table) {
	this.rows  = table.tBodies[0].rows;
	this.tags  = table.tHead.rows[0].cells;
	var defaultClass = [];
	for(var i=0; i < this.tags.length; i++) {
		defaultClass[i] = this.tags[i].className;
	}
	
	// 将数据行和列转换成二维数组
	this._2DArray = [];
	for(var i=0; i < this.rows.length; i++) {
		this._2DArray[i] = [];
		for(var j=0; j < this.tags.length; j++) {
			var cell = this.rows[i].cells[j];
			this._2DArray[i].push(cell.innerHTML);
		}
	}
	
	for(var i=0; i < this.tags.length; i++) {
		var tag = this.tags[i];
		var sortable = tag.getAttribute("sortable");
		if( sortable == "true") {
			tag._colIndex = i;
			$.Event.addEvent(tag, "click", bind(tag, sortHandler));
		}		
	}

	var oThis = this;
	var direction = 1;
	function sortHandler() {
		for(var i=0; i < oThis.tags.length; i++) {
			oThis.tags[i].className = defaultClass[i];
		}

		if(direction == 1) {
			Element.removeClass(cell, "desc");
			Element.addClass(this, "asc");
		} else {
			Element.removeClass(cell, "asc");
			Element.addClass(this, "desc");			
		}
		sort(direction, this._colIndex);
		direction = direction * -1;

		//去掉所有的html标记 
		function killHTML(str) {
			return str.replace(/<[^>]+>/g, "");
		}

		function sort(direction, columnIndex) {
			this._2DArray.sort(function(a, b) {
				var x = killHTML( a[columnIndex] ).replace(/,/g, '');
				var y = killHTML( b[columnIndex] ).replace(/,/g, '');
				var compareValue;
				if( isNaN(x) ) {
					compareValue = x.localeCompare(y);
				}
				else {
					compareValue = Number(x) - Number(y);
				}
				return compareValue * direction;
			});

			// 设置排序列的样式
			for (var i = 0; i < this.rows.length; i++) {
				for (var j = 0; j < this.tags.length; j++) {
					var cell = this.rows[i].cells[j];
					Element.removeClass(cell, "sorting");
				}
				Element.addClass(this.rows[i].cells[columnIndex], "sorting");
			}

			// 将排序后的二维数组重新输出到对应的行和列中
			for (var i = 0; i < this.rows.length; i++) {
				for (var j = 0; j < this.tags.length; j++) {
					var cell = this.rows[i].cells[j];
					cell.innerHTML = this._2DArray[i][j];
				}
			}
		}
	}
}

// 删除选中Grid行
function delGridRow(url, gridName) {
	if( !confirm("您确定要删除该行记录吗？") ) return;
	
	var grid = $G(gridName || "grid");
	var userID = grid.getRowAttributeValue("id");
	if( userID ) {
		Ajax({
			url : url + userID,
			method : "DELETE",
			onsuccess : function() { 
				grid.deleteSelectedRow();
			}
		});	
	}
}