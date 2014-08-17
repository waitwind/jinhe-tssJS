;(function ($, factory) {

    $.Grid = factory($);

    var GridCache = {};

    $.G = function(gridId, data) {
 		var grid = GridCache[gridId];
		if( grid == null || data ) {
			grid = new $.Grid($("#" + gridId)[0], data);
			GridCache[grid.id] = grid;	
		}
		
		return grid;
	}

})(tssJS, function ($) {

    'use strict';

    var cellHeight = 22,  // 数据行高

	getAlign = function(column) {
		var align = column.getAttribute("align");
		if(align) {
			return align;
		}

		switch(column.getAttribute("mode")) {
			case "number":
				return "right";
			case "boolean":
			case "date":
			default:
				return "center";
		}
	},

	getCellValue = function(tr, colName) {
		var cells = curRow.cells;
		for(var j=0; j < cells.length; j++) {
			var cell = cells[j];
			if( cell.getAttribute("name") == colName ) {
				return cell.getAttribute("value");
			}
		}
	},

	bindSortHandler = function(table) {
		var rows = [];
		$.each(table.querySelectorAll("tbody tr"), function(i, row) {
			rows[i] = row;
		});

		var tags = table.querySelectorAll("thead tr td");
		var direction = 1;
	 
		$.each(tags, function(i, tag) {
			var sortable = tag.getAttribute("sortable");
			if( sortable == "true") {
				tag._colIndex = i;

				$(tag).click(function() {
					// 先清除已有的排序
					$.each(tags, function(i, _tag) {
						$(_tag).removeClass("desc").removeClass("asc");
					});
					$(this).addClass(direction == 1 ? "asc" : "desc");

					var columnIndex = this._colIndex;
					rows.sort(function(row1, row2) {
						var x = row1.cells[columnIndex].innerText;
						var y = row2.cells[columnIndex].innerText;
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
					rows.each(function(i, row) {
						$.each(row.cells, function(j, cell){
							if(j == columnIndex) {
								$(cell).addClass("sorting");
							} else {
								$(cell).removeClass("sorting");
							}
						});

						row.setAttribute("_index", i + 1);
					});

					direction = direction * -1;
				});
			}	
		});
	},

	GridTemplate = function(xmlDom) {
		this.declare = xmlDom.querySelector("declare");
		this.script  = xmlDom.querySelector("script");
		this.columns = this.declare.querySelectorAll("column");
		this.dataRows = xmlDom.querySelectorAll("data row");

		var columnsMap = {};
		$.each(this.columns, function(index, column) {
			columnsMap[column.getAttribute("name")] = column;
		});
		this.columnsMap = columnsMap;

		this.hasHeader    = this.declare.getAttribute("header") == "checkbox";
		this.needSequence = this.declare.getAttribute("sequence") != "false";
	};

	GridTemplate.prototype = {
		toHTML: function(startNum) {
			var htmls = [], thead = [], tbody = [];

			thead.push('<thead><tr>');
			if(this.hasHeader) {
				thead.push('<td name="cellheader"><input type="checkbox" id="checkAll"/></td>');
			}
			if(this.needSequence) {
				thead.push('<td name="sequence">序号</td>');
			}
			$.each(this.columnsMap, function(name, column) {
				var caption = column.getAttribute("caption");
			 	var width   = column.getAttribute("width");
				var style = (width ? ' style="width:' + width + '"': '');
				var _class   = column.getAttribute("display")  == "none" ? ' class="hidden"' : '';
				var sortable = column.getAttribute("sortable") == "true" ? ' sortable="true"' : '';
				thead.push('<td name="' + name + '" ' + _class + style + sortable + '>' + caption + '</td>');
			});
			thead.push("</tr></thead>");
 
 			var oThis = this;
 			tbody.push('<tbody>');
 			$.each(this.dataRows, function(i, row) {
				var index = startNum + i + 1;
				tbody.push('<tr _index="' + index + '">');

				if(oThis.hasHeader) {
					tbody.push('<td></td>');
				}
				if(oThis.needSequence) {
					tbody.push('<td></td>');
				}

				var columnsMap = oThis.columnsMap;
				for(var name in columnsMap) {
					var value  = row.getAttribute(name) || "";
					tbody.push('<td name="' + name + '" value="' + value + '">' + value + '</td>');
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
	}; 

	var Grid = function(element, data) {
		this.id = element.id;
		this.element = element;

		this.gridBox = $.createElement("div");
		this.element.appendChild(this.gridBox);

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
			if("object" != typeof(data) || data.nodeType != $.XML._NODE_TYPE_ELEMENT) {
				alert("传入的Grid数据有问题。")	
			} 

			// 初始化变量
			var startNum = append ? this.totalRowsNum : 0;	

			this.template = new GridTemplate(data);	
			var gridTableHtml = this.template.toHTML(startNum); // 解析成Html
			
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
				
				// Element.ruleObjList = []; // 先清空原来的拖动条
				for( var i = 0; i < thList.length; i++ ) {
					// 给表头添加双击、拖动等事件
					// 设置隐藏列事件，双击隐藏列
					// 拖动改变列宽
					// Element.attachColResizeII(thList[i]);
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
					$(curRow).addClass("rolloverRow"); 
			 	}, 
				function() { 
					$(curRow).removeClass("rolloverRow");
				} 
			);
			
			var cells = curRow.cells;
			for(var j=0; j < cells.length; j++) {
				var cell = cells[j];

				if(this.template.hasHeader && j == 0) {
					cell.setAttribute("name", "cellheader");
					cell.innerHTML = '<input name="' + this.id + '_cb" type="checkbox" >';
					continue;
				} else if(this.template.needSequence && j <= 1) {
					cell.setAttribute("name", "sequence");
					cell.innerText = curRow.getAttribute("_index");
					continue;
				}

				this.processDataCell(cell);						
			}	
		},

		processDataCell: function(cell) {
			var colName = cell.getAttribute("name");
			var column = this.template.columnsMap[colName]; 
			if( colName == null || column == null) {
				return;
			} 

			if(column.getAttribute("display") == "none") {
				$(cell).addClass("hidden");
			} 
			else if(column.getAttribute("highlight") == "true") {
				$(cell).addClass("highlightCol");
			}
			$(cell).css("text-align", getAlign(column));

			var value = cell.getAttribute("value") || cell.innerText;
			var mode  = column.getAttribute("mode") || "string";
			switch( mode ) {
				case "string":
					var editor = column.getAttribute("editor");
					var editortext = column.getAttribute("editortext");
					var editorvalue = column.getAttribute("editorvalue");
					if(editor == "comboedit" && editorvalue && editortext) {
						var listNames  = editortext.split("|");
						var listValues = editorvalue.split("|");
						listValues.each(function(n, optionValue) {
							if(value == optionValue) {
								value = listNames[n];
							}
						});
					}
					
					cell.innerText = cell.title = value;							
					break;
				case "number":  
				case "date":
					cell.title = value;
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
		getColumnValue: function(columnName) {
			var value;
			var rowIndex = this.element.selectRowIndex; 
			if(rowIndex) {
				var row = this.getRowByIndex(rowIndex);
				$.each(row.cells, function(i, cell) {
					if(cell.getAttribute("name") == columnName) {
						value = cell.getAttribute("value");
					}
				});
			}
			return value;
		},

		// 获取某一列的值
		getColumnValues: function(columnName) {
			var values = [];
			$.each(this.rows, function(i, row) {
				$.each(row.cells, function(j, cell) {
					if(cell.getAttribute("name") == columnName) {
						values[i] = cell.getAttribute("value");
					}
				});
			});
			return values;
		},

		// 新增一行
		insertRow: function(map) {
			var trList = this.gridBox.querySelectorAll("table tbody tr");
			var lastRow = trList[trList.length - 1];

			var newRow = this.tbody.insertRow(this.totalRowsNum ++);
			newRow.setAttribute("_index", parseInt(lastRow.getAttribute("_index")) + 1);

			var thList = this.gridBox.querySelectorAll("table thead td");
			$.each(thList, function(i, th) {
				var colName = th.getAttribute("name");
				
				var cell = newRow.insertCell(i);
				cell.setAttribute( "name", colName );

				if(map[colName]) {
					cell.innerText = map[colName];
				}
			});
 
			this.processDataRow(newRow);
		},

		// 删除单行
		deleteRow: function(row) {
			this.tbody.removeChild(row);
			this.totalRowsNum --;
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
			var oThis = this;
			$.each(row.cells, function(i, cell) {
				if(cell.getAttribute("name") == attrName) {
					cell.setAttribute("value", value);
					oThis.processDataCell(cell);
				}
			});
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
				oThis.gridBox.scrollTop += -Math.round(window.event.wheelDelta / 120) * cellHeight;
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
	$.initGridToolBar = function(pageBar, pageInfo, callback) {
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
			$.Event.addEvent($1("GridPageList"), "change", function() {
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
		pageBar  = pageBar  || $1("gridToolBar");
		gridName = gridName || "grid";
		page     =  page || "1";
		var XML_PAGE_INFO = "PageInfo";

		var request = new $.HttpRequest(p);
		request.url = serviceUrl + "/" + page;
		request.params = requestParam || [];

		request.onresult = function() {
			var grid = $1(gridName);
			if(grid.getAttribute("height") == null) {
				grid.setAttribute("height", grid.clientHeight); // hack for IE11
			}
			
			$.G(gridName, this.getNodeValue(dataNodeName)); 
	 
			var gotoPage = function(page) {
				request.url = serviceUrl + "/" + page;
				request.onresult = function() {
					$.G(gridName, this.getNodeValue(dataNodeName)); 
				}				
				request.send();
			}

			var pageInfoNode = this.getNodeValue(XML_PAGE_INFO);			
			initGridToolBar(pageBar, pageInfoNode, gotoPage);
			
			grid.onDblClickRow = function(eventObj) {
				editRowFuction();
			}
			grid.onRightClickRow = function() {
				this.contextmenu.show(event.clientX, event.clientY);
			}   
			grid.onScrollToBottom = function () {			
				var currentPage = pageBar.getCurrentPage();
				if(pageBar.getTotalPages() <= currentPage) return;

				var nextPage = parseInt(currentPage) + 1; 
				request.url = serviceUrl + "/" + nextPage;
				request.onresult = function() {
					$.G(gridName).load(this.getNodeValue(dataNodeName), true);

					var pageInfoNode = this.getNodeValue(XML_PAGE_INFO);
					$.initGridToolBar(pageBar, pageInfoNode, gotoPage);
				}				
				request.send();
			}
		}
		request.send();
	};

	// 删除选中Grid行
	$.delGridRow = function(url, gridName) {
		if( !confirm("您确定要删除该行记录吗？") ) return;
		
		var grid = $.G(gridName || "grid");
		var objectID = grid.getRowAttributeValue("id");
		if( objectID ) {
			$.ajax({
				url : url + objectID,
				method : "DELETE",
				onsuccess : function() { 
					grid.deleteSelectedRow();
				}
			});	
		}
	}

})(tssJS);
