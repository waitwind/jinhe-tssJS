;(function ($, factory) {

    $.Form = factory($);

    var FormCache = {};

    $.G = function(id, data) {
 		var form = FormCache[id];
 		if( form == null && data == null ) {
			return null;
		}

		if( form == null || data ) {
			form = new $.Form($1(id), data);
			FormCache[form.id] = form;	
		}
		
		return form;
	}

})(tssJS, function ($) {

    'use strict';

    var showErrorInfo = function(errorInfo, obj) {
		setTimeout(function() {
			// 页面全局Balllon对象
			if( $.Balloon ) {
				var balloon = new $.Balloon(errorInfo);
				balloon.dockTo(obj);
			}
		}, 100);
	},

	XMLTemplate = function(dataXML) {
		this.sourceXML = dataXML;
			 
		this.declare = $("declare", dataXML)[0];
		this.layout  = $("layout", dataXML)[0]; 
		this.script  = $("script", dataXML)[0];
	
		var dataNode =  $("data", dataXML)[0];
		if(dataNode == null) {				
			dataNode = $.XML.createElement("data");
			this.sourceXML.appendChild(dataNode);
		}
		
		this.rowNode = $("row", dataNode)[0];;
		if(this.rowNode == null) {
			this.rowNode = $.XML.createElement("row"));
			dataNode.appendChild(this.rowNode);	
		}
		
		var oThis = this;
		this.columnsMap = {};
		$("column", this.declare).each( function(i, column) {
			oThis.columnsMap[column.getAttribute("name")] = column;
		} );
	};

	XMLTemplate.prototype = {

		/* 获取row节点上与column对应的值 */
		getFieldValue: function(name) {
			var node = this.rowNode.querySelector(name);
			if( node ) {
				return $.XML.getText(node).convertEntry();
			}
			return null;
		},

		toHTML: function() {
			var htmls = [], oThis = this;
			htmls.push("<form class='tssform' method='post'>");
			htmls.push('<table>');

			// 添加隐藏字段			
			$("column[mode='hidden']", this.declare).each( function(i, column){
				var value = oThis.getFieldValue(name);
				value = value ? "value=\"" + value + "\"" : "";
				htmls.push('<input type="hidden" ' + value + ' id="' + name + '"/>');
			} );
			htmls.push('<input type="hidden" name="xml" id="xml"/>');

			var trList = this.layout.querySelectorAll("tr");
			for(var i=0; i < trList.length; i++) {
				var trNode = trList[i];
				htmls.push("<tr>");

				var tdList = trNode..querySelectorAll("td");
				for(var j=0; j < tdList.length; j++) {
					var tdNode = tdList[j];
					htmls.push("<td "+ copyNodeAttribute(tdNode) +">");

					var childNodes = tdNode.childNodes;
					for(var n=0; n < childNodes.length; n++) {
						var childNode = childNodes[n];
						if(childNode.nodeType != _XML_NODE_TYPE_ELEMENT) {
							htmls.push(childNode.nodeValue);
							continue;
						}

						var binding = childNode.getAttribute("binding");
						var column = this.columnsMap[binding];
						if(column == null) {
							htmls.push($.XML.toXml(childNode));
							continue;
						}

						var mode    = column.getAttribute("mode");
						var editor  = column.getAttribute("editor");
						var caption = column.getAttribute("caption");
						var value   = this.getColumnValue(binding);
						var _value  = (value ? " value=\"" + value + "\"" : " ");
						
						var nodeName = childNode.nodeName.toLowerCase(); // label、input、textarea等 
						if(nodeName == "label" && binding && binding != "") {
							htmls.push("<label id='label_" + binding + "'>" + caption + "</label>");
						}
						else if(mode == "string" && editor == 'comboedit') {
							htmls.push("<select " + copyNodeAttribute(childNode) + copyColumnAttribute(column) + _value + "></select>");
						}
						else if(mode == "string" && nodeName == 'textarea') {
							htmls.push("<textarea " + copyNodeAttribute(childNode) + copyColumnAttribute(column) + ">" + (value ? value : "") + "</textarea>");
						}
						else if(mode == "string" || mode == "number" || mode == "function" || mode == "date") {
							htmls.push("<input " + copyNodeAttribute(childNode) + copyColumnAttribute(column) + _value + "></input>");
						}
					}
					htmls.push("</td>");
				}	
				htmls.push("</tr>");
			 }

			 htmls.push("</table>");
			 htmls.push("</form>");
			 return htmls.join("");

			 // some private function define
			 function copyColumnAttribute(column) {
				var returnVal = " ";
				column.attributes.each( function(i, attr){
					var name  = attr.nodeName;
					var value = attr.nodeValue;
					if(value == null || value == "null") {
						continue;
					}

					if(name == "name") {
						name = "id";
					}
					returnVal += name + " = \"" + value + "\" ";
				} );
 
				return returnVal;
			 }

			 function copyNodeAttribute(node) {
				var returnVal = "";
				var hasBinding = node.getAttribute("binding") != null;
				column.attributes.each( function(i, attr){
					if(attr.nodeName != "style" || !hasBinding) {
						returnVal += attr.nodeName + "=\"" + attr.nodeValue + "\" ";
					}
					if(attr.nodeName == "style" && hasBinding) {
						returnVal += "style=\"" + attr.nodeValue + "\" ";
					}
				} );
				return returnVal;
			 }
		}
	};
 
	var Form = function(element, data) {
		this.id   = element.id;
		this.box  = element;

		this.editable  = element.getAttribute("editable") || "true";
		this.columnInstanceMap = {};

		this.load(data);
	};

	Form.prototype = {

		load: function(dataXML) {
			if("object" != typeof(dataXML) || dataXML.nodeType != $.XML._NODE_TYPE_ELEMENT) {
				return alert("传入的Form数据有问题，请检查。");
			}
			
			this.template = new XMLTemplate(dataXML);	
			this.box.innerHTML = this.template.toHTML(); 

			// 绑定各个column对应的编辑方式
			this.attachEditor();
		
			// 绑定事件
			this.attachEvents();

			// 自动聚焦
			if(this.editable != "false") {
				this.setFocus();
			}		
		}

		attachEvents = function() {
			this.element.onselectstart = function() {
				event.cancelBubble = true; // 拖动选择事件取消冒泡
			}

			var form = this.box.querySelector("form");
			if(form) {
				Event.attachEvent(form, "submit", this.checkForm);
			}
		}

		attachEditor = function() {
			var columnsMap = this.template.columnsMap;
			for(var colName in columnsMap) {
				var column = columnsMap[colName];

				// 取layout中绑定该column的元素，如果没有，则column无需展示。
				if($$(colName) == null) {
					continue;
				}

				var curInstance;
				var colMode   = column.getAttribute("mode");
				switch(colMode) {
					case "string":
						var colEditor = column.getAttribute("editor");
						if(colEditor == "comboedit") {
							curInstance = new Mode_ComboEdit(colName, this);
						}
						else {
							curInstance = new Mode_String(colName, this);
						}
						break;
					case "number":
						curInstance = new Mode_String(colName, this);
						break;
					case "date":
					case "function":
						curInstance = new Mode_Function(colName, this);
						break;
					case "hidden":
						curInstance = new Mode_Hidden(colName, this);
						break;
				}

				curInstance.saveAsDefaultValue();
				this.columnInstanceMap[colName] = curInstance;

				if(column.getAttribute('empty') == "false") {
					Element.insertHtml('afterEnd', $$(colName).nextSibling || $$(colName), "<span style='color:red;margin-left:3px;margin-right:5px;'>*</span>");
				}
			}

			this.setEditable();
		}
 
		checkForm = function() {
			hideErrorInfo();

			for(var colName in this.columnInstanceMap) {
				var curInstance = this.columnInstanceMap[colName];
				if( !curInstance.validate() ) {
					return false;
				}
			}

			$$("xml").value = this.template.data.xml;
			return true;
		}

		setEditable = function(status) {
			status = status || "true";
			this.element.editable = status;

			var buttonBox = $$("buttonBox");
			if(buttonBox) {
				buttonBox.style.display = (status == "true" ? "block": "none");
			}

			for(var colName in this.columnInstanceMap) {		
				 var _status = status;

				// 如果column上默认定义为不可编辑，则永远不可编辑
				if (this.getColumnAttribute(colName, "editable") == "false") {
					_status = "false";
				} 

				this.columnInstanceMap[colName].setEditable(_status);
			}

			this.setFocus();
		}

		setFocus = function(name) {
			if( name == null || name == "") {
				var column = this.template.declare.selectSingleNode("column[(@editable='true' or not(@editable)) and (@display!='none')]");
				if(column != null) {
					name = column.getAttribute("name");	
				}	
			}	

			var curInstance = this.columnInstanceMap[name];
			if( curInstance ) {
				curInstance.setFocus();
			}
		}

		setColumnEditable = function(name, value) {
			var curInstance = this.columnInstanceMap[name];
			if( curInstance ) {
				curInstance.setEditable(value);
			}
		}

		getData = function(name, replace) {
			var nodeValue = this.getColumnValue(name);
			if(replace == true) {
				nodeValue = nodeValue.replace(/\"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\'/g, "&#39;");
			}
			return nodeValue;
		}

		getColumnValue = function(name) {
			return this.template.getFieldValue();
		}

		/*
		 *  设置row节点上与column对应的值
		 *  参数：  string:name             列名
					string/array:value      值
		 */
		setColumnValue = function(name, value) {
			var rowNode = this.template.rowNode;
			var node = rowNode.selectSingleNode(name);
			if( node == null ) { 
				node = new XmlNode(EMPTY_XML_DOM.createElement(name)); // 创建单值节点
				rowNode.appendChild(node);
			}

			var CDATANode = node.firstChild;
			if( CDATANode == null ) {
				CDATANode = EMPTY_XML_DOM.createCDATASection(value);
				node.appendChild(CDATANode);
			}
			else {
				CDATANode.text = value;
				if (CDATANode.textContent || CDATANode.textContent == "") {
					CDATANode.textContent = value; // chrome
				}
			}

			var eventOndatachange = new EventFirer(this.element, "ondatachange");
			var eventObj = createEventObject();
			eventObj.id = this.id + "_" + name;
			eventOndatachange.fire(eventObj);  // 触发事件
		}

		// 将界面数据更新到XForm模板的data/row/里
		updateData = function(obj) {
			if(event.propertyName == "checked") {
				var newValue = obj.checked == true ? 1 : 0;
			}
			else if(obj.tagName.toLowerCase() == "select") {
				var newValue = obj._value;            
			}
			else {
				var newValue = obj.value;
			}

			var oldValue = this.getColumnValue(obj.id);
			if( isNullOrEmpty(newValue) && isNullOrEmpty(oldValue) ) {
				return;
			}
			if(newValue != oldValue) {
				this.setColumnValue(obj.id, newValue);
			}
		}

		// 将数据设置到界面输入框上显示，同时更新到data/row/里
		updateDataExternal = function(name, value) {
			this.setColumnValue(name, value);
			
			// 更改页面显示数据
			var colInstance = this.columnInstanceMap[name];
			if(colInstance) {
				colInstance.setValue(value);
			}
		}

		showCustomErrorInfo = function(name, str) {
			var instance = this.columnInstanceMap[name];
			if( instance ) {
				showErrorInfo(str, instance.obj);
			}
		}

		getColumnAttribute = function(name, attrName) {
			var column = this.template.columnsMap[name];
			if( column ) {
				return column.getAttribute(attrName);
			}
			else {
				return alert("指定的列[" + name + "]不存在");
			}
		}

		getXmlDocument = function() {
			return this.template.xmlDocument;
		}

		xml = function() {
			return xmlDoc.toString();
		}
	}




// 普通文本输入框
var Mode_String = function(colName, xform) {
	this.obj = $$(colName);
	this.obj._value = this.obj.value; // 备份原值

	var oThis = this;
	this.obj.onblur = function() {
		// 判断input的类型
		if("text" == this.type) { 
			this.value = this.value.replace(/(^\s*)|(\s*$)/g, ""); // 去掉前后的空格
		}

		xform.updateData(this);
	};

	this.obj.onpropertychange = function() {
		if(window.event.propertyName == "value") {
			var maxLength = parseInt(this.getAttribute('maxLength'));

			// 超出长度则截掉，中文算作两个字符
			if(this.value.replace(/[^\u0000-\u00FF]/g, "**").length > maxLength) {
				restore(this, this.value.substringB(0, maxLength));
			}
			else{
				this._value = this.value;
			}
		}
	};
}

Mode_String.prototype = {
	setValue : function(value) {
		this.obj._value = this.obj.value = value;
	},

	validate: validate,
	
	setEditable : function(status) {
		this.obj.editable = status || this.obj.getAttribute("editable");

		var disabled = (this.obj.editable == "false");
		this.obj.className = (disabled ? "string_disabled" : "string");

		if(this.obj.tagName == "textarea") {
			this.obj.readOnly = disabled;  // textarea 禁止状态无法滚动显示所有内容，所以改为只读
		} else {
			this.obj.disabled = disabled;        
		}
	},

	saveAsDefaultValue : function() {
		this.obj.defaultValue = this.obj.value;
	},

	setFocus : setFocus
}


// 自定义方法输入值类型
var Mode_Function = function(colName, xform) {
	this.obj = $$(colName);
	this.obj._value = this.obj.value; // 备份原值
	this.isdate = (this.obj.getAttribute("mode").toLowerCase() == "date");
 
	if( !this.obj.disabled ) {
		if(this.isdate) {
			if(this.picker == null) {
				this.picker = new Pikaday( {
			        field: document.getElementById(this.obj.id),
			        firstDay: 1,
			        minDate: new Date('2000-01-01'),
			        maxDate: new Date('2020-12-31'),
			        yearRange: [2000,2020],
			        format: 'yyyy-MM-dd'
			    });
			}
		}
		else {
			// 添加点击按钮
			var icon = xform._iconpath + 'function.gif';
			var html = '<img src="' + icon + '" style="width:20px;height:18px;border:0px;position:relative;top:4px;left:-21px;"/>';
			Element.insertHtml('afterEnd', this.obj, html);
			
			var tempThis = this;

			var btObj = this.obj.nextSibling; // 动态添加进去的按钮
			btObj.onclick = excuteCMD;
		}
	}	

	function excuteCMD() {
		var cmd = tempThis.obj.getAttribute("cmd");
		try {
			eval(cmd);
		} catch(e) {
			showErrorInfo("运行自定义JavaScript代码<" + cmd + ">出错，异常信息：" + e.description, tempThis.obj);
			throw(e);
		}
	}

	this.obj.onblur = function() {
		xform.updateData(this);
	};
}
 
Mode_Function.prototype = {
	setValue : function(value) {
		this.obj._value = this.obj.value = value;
	},

	validate: validate,
	
	setEditable : function(status) {
		this.obj.disabled  = (status == "false");
		this.obj.className = (this.obj.disabled ? "function_disabled" : "function");

		// function图标
		if(!this.isdate) {
			this.obj.nextSibling.disabled  = this.obj.disabled;
			this.obj.nextSibling.className = (this.obj.disabled ? "bt_disabled" : "");
			this.obj.readOnly = true;
		}
		
		this.obj.editable = status;
	},

	saveAsDefaultValue : function() {
		this.obj.defaultValue = this.obj.value;
	},

	setFocus : setFocus
}


// 下拉选择框，单选或多选
var Mode_ComboEdit = function(colName, xform) {
	this.obj = $$(colName);
    this.multiple = this.obj.getAttribute("multiple") == "multiple";
	
	var valueNode = this.obj.attributes["value"];
 	this.obj._value = valueNode ? valueNode.nodeValue : "";

	var selectedValues = {};
	if(this.obj._value != "") {
		var valueArr = this.obj._value.split(",");
		for(var i=0; i < valueArr.length; i++) {
			selectedValues[ valueArr[i] ] = true;
		}
	}

	var valueList = this.obj.getAttribute("editorvalue").split('|');
	var textList  = this.obj.getAttribute("editortext").split('|');
	var selectedIndex = [];
	for(var i=0; i < valueList.length; i++) {
		var value = valueList[i];
		this.obj.options[i] = new Option(textList[i], value);
 
		if( selectedValues[value] ) {
			this.obj.options[i].selected = true;
			selectedIndex[selectedIndex.length] = i;
		}
	}
	if( selectedIndex.length > 0 ){
		this.obj.defaultSelectedIndex = selectedIndex.join(",");
	} 
	else {
		this.obj.defaultSelectedIndex = this.obj.selectedIndex = -1;
	}

	if(this.multiple && this.obj.getAttribute("height") == null) {
		this.obj.style.height = Math.min(Math.max(valueList.length, 4), 4) * 18 + "px";
	}	

	// 当empty = false(表示不允许为空)时，下拉列表的默认值自动取第一项值
	if( this.obj._value == "" &&  this.obj.getAttribute('empty') == "false") {
		this.setValue(valueList[0]);
		xform.setColumnValue(this.obj.id, valueList[0]);
	}
	
	this.obj.onchange = function() {
		var x = [];
		for(var i=0; i < this.options.length; i++) {
			var option = this.options[i];
			if(option.selected) {
				x[x.length] = option.value;
			}
		}
		this._value = x.join(",");
		xform.updateData(this);
		
		fireOnChangeEvent(this, this._value);
	}
}

function fireOnChangeEvent(obj, newValue) {
	var onchangeFunc = obj.getAttribute("onchange");
	if(onchangeFunc) {
		var rightKH = onchangeFunc.indexOf(")");
		if(rightKH > 0) {
			onchangeFunc = onchangeFunc.substring(0, rightKH) + ", '" + newValue + "')"; 
		}
		else {
			onchangeFunc = onchangeFunc + "('" + newValue + "')";
		}

		eval(onchangeFunc);
	}
}

Mode_ComboEdit.prototype.setValue = function(value) {
	var valueList = {};
	var valueArray = value.split(",");
	for(var i = 0; i < valueArray.length; i++){
		valueList[valueArray[i]] = true;
	}

	var noSelected = true;
	for(var i=0; i < this.obj.options.length; i++){
		var opt = this.obj.options[i];
		if(valueList[opt.value]) {
			opt.selected = true;
			noSelected = false;
		}
	}

	if(noSelected){
		this.obj.selectedIndex = -1;	
	}

	this.obj._value = value;

	fireOnChangeEvent(this.obj, value);
}

Mode_ComboEdit.prototype.setEditable = function(status) {
	this.obj.disabled  = (status == "true" ? false : true);
	this.obj.className = (status == "true" ? "comboedit" : "comboedit_disabled");
	this.obj.editable  = status;
}

Mode_ComboEdit.prototype.validate = validate;

Mode_ComboEdit.prototype.saveAsDefaultValue = function() {
	var selectedIndex = [];
	for(var i=0; i < this.obj.options.length; i++){
		var opt = this.obj.options[i];
		if(opt.selected) {
			selectedIndex[selectedIndex.length] = i;
		}
	}
	this.obj.defaultSelectedIndex = selectedIndex.join(",");
}

Mode_ComboEdit.prototype.setFocus = setFocus;


function Mode_Hidden(colName, xform) {
	this.obj = $$(colName);
}
Mode_Hidden.prototype.setValue = function(s) {}
Mode_Hidden.prototype.setEditable = function(s) {}
Mode_Hidden.prototype.validate = function() { return true; }
Mode_Hidden.prototype.saveAsDefaultValue = function() {}
Mode_Hidden.prototype.setFocus = function() {}


function setFocus() {
	try {
		this.obj.focus();
	} catch(e) {
	}
}

function validate() {
	var empty     = this.obj.getAttribute("empty");
	var errorInfo = this.obj.getAttribute("errorInfo");
	var caption   = this.obj.getAttribute("caption").replace(/\s/g, "");
	var inputReg  = this.obj.getAttribute("inputReg");
	
	var value = this.obj.value;
	if(value == "" && empty == "false") {
		errorInfo = "[" + caption.replace(/\s/g, "") + "] 不允许为空。";
	}

	if(inputReg && !eval(inputReg).test(value)) {
		errorInfo = errorInfo || "[" + caption + "] 格式不正确，请更正.";
	}

	if( errorInfo ) {
		showErrorInfo(errorInfo, this.obj);

		if(this.isInstance != false) {
			if(this.setFocus) {
				this.setFocus();
			}
		}
		if( event ) {
			preventDefault(event);
		}
		return false;
	}

	return true;
}



function restore(obj, value) {    
	var tempEvent = obj.onpropertychange;
	if( tempEvent == null ) {
		clearTimeout(obj.timeout);
		tempEvent = obj._onpropertychange;
	}
	else {
		obj._onpropertychange = tempEvent;
	}

	obj.onpropertychange = null;
	obj.timeout = setTimeout(function() {
		obj.value = value;
		obj.onpropertychange = tempEvent;
	}, 10);
}

function xformExtractData(xformNode, needPrefix) {
	if( xformNode ) {
		var dataNode = xformNode.selectSingleNode(".//data");

		var prefix = null;
		if(needPrefix) {
			prefix = xformNode.selectSingleNode("./declare").getAttribute("prefix");
		}
		
		return dataNode2Map(dataNode, prefix);
	}
	return null;
}

function dataNode2Map(dataNode, prefix) {
	var map = {};
	if(dataNode && dataNode.nodeName == "data") {
		var rename = dataNode.getAttribute("name");
		var nodes = dataNode.selectNodes("./row/*");
		for(var i = 0; i < nodes.length; i++) {
			var name = rename || nodes[i].nodeName; // 从data节点上获取保存名，如果没有则用原名
			
			// 前缀，xform declare节点上设置，以便于把值设置到action的bean对象里
			if( prefix ) {
				name = prefix + "." + name;
			}

			map[name] = nodes[i].text;
		}
	}
	return map;
}
