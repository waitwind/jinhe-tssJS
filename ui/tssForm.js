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
	
		this.dataNode =  $("data", dataXML)[0];
		if(this.dataNode == null) {				
			this.dataNode = $.XML.createElement("data");
			this.sourceXML.appendChild(this.dataNode);
		}
		
		this.rowNode = $("row", this.dataNode)[0];;
		if(this.rowNode == null) {
			this.rowNode = $.XML.createElement("row"));
			this.dataNode.appendChild(this.rowNode);	
		}
		
		var oThis = this;
		this.fieldsMap = {};
		$("column", this.declare).each( function(i, column) {
			oThis.fieldsMap[column.getAttribute("name")] = column;
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
						var column = this.fieldsMap[binding];
						if(column == null) {
							htmls.push($.XML.toXml(childNode));
							continue;
						}

						var mode    = column.getAttribute("mode");
						var editor  = column.getAttribute("editor");
						var caption = column.getAttribute("caption");
						var value   = this.getFieldValue(binding);
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
		this.fieldObjMap = {};

		this.load(data);
	};

	Form.prototype = {

		load: function(dataXML) {
			if("object" != typeof(dataXML) || dataXML.nodeType != $.XML._NODE_TYPE_ELEMENT) {
				return alert("传入的Form数据有问题，请检查。");
			}
			
			this.template = new XMLTemplate(dataXML);	
			this.box.innerHTML = this.template.toHTML(); 

			// 绑定各个字段输入框对应的编辑方式
			this.attachEditor();
		
			// 绑定事件
			this.box.onselectstart = function() {
				event.cancelBubble = true; // 拖动选择事件取消冒泡
			}

			var form = this.box.querySelector("form");
			if(form) {
				$.Event.addEvent(form, "submit", this.checkForm);
			}

			// 自动聚焦
			if(this.editable != "false") {
				this.setFocus();
			}		
		},
 
		attachEditor: function() {
			var fieldsMap = this.template.fieldsMap;
			for(var fieldName in fieldsMap) {
				var column = fieldsMap[fieldName];

				// 取layout中绑定该column的element，如无，则column无需展示。
				var fieldEl = $1(fieldName);
				if( fieldEl == null) {
					continue;
				}

				var fieldObj;
				var fieldType = column.getAttribute("mode");
				switch(fieldType) {
					case "string":
						var colEditor = column.getAttribute("editor");
						if(colEditor == "comboedit") {
							fieldObj = new Mode_ComboEdit(fieldName, this);
						}
						else {
							fieldObj = new Mode_String(fieldName, this);
						}
						break;
					case "number":
						fieldObj = new Mode_String(fieldName, this);
						break;
					case "date":
					case "function":
						fieldObj = new Mode_Function(fieldName, this);
						break;
					case "hidden":
						fieldObj = new Mode_Hidden(fieldName, this);
						break;
				}

				fieldObj.saveAsDefaultValue();
				this.fieldObjMap[fieldName] = fieldObj;

				if(column.getAttribute('empty') == "false") {
					$.insertHtml('afterEnd', fieldEl.nextSibling || fieldEl, "<span style='color:red;margin-left:3px;margin-right:5px;'>*</span>");
				}
			}

			this.setEditable();
		},
 
		checkForm: function() {
			for(var fieldName in this.fieldObjMap) {
				var fieldObj = this.fieldObjMap[fieldName];
				if( !fieldObj.validate() ) {
					return false;
				}
			}

			$$("xml").value = $.XML.toXml(this.template.dataNode);
			return true;
		},

		setEditable: function(status) {
			status = status || this.editable;

			$("buttonBox").css("display", status == "true" ? "block": "none");

			var oThis = this, firstEditableField;
			$.each(this.fieldObjMap, function(name, fieldObj) {
				var _status = status;

				// 如果column上默认定义为不可编辑，则永远不可编辑
				if (oThis.getFieldConfig(name, "editable") == "false") {
					_status = "false";
				} 

				if(firstEditableField == null && _status == "true") {
					firstEditableField = fieldObj;
				}

				fieldObj.setEditable(_status);
			});

			if(firstEditableField) {
				firstEditableField.setFocus();
			}
		},

		setColumnEditable: function(name, value) {
			var fieldObj = this.fieldObjMap[name];
			if( fieldObj ) {
				fieldObj.setEditable(value);
			}
		},

		/* 设置row节点上与field column对应的值 */
		setFieldValue: function(name, value) {
			var rowNode = this.template.rowNode;
			var node = rowNode.querySelector(name);
			if( node == null ) { 
				rowNode.appendChild(node = $.XML.createNode(name)); // 创建单值节点
			}

			var CDATANode = node.firstChild;
			if( CDATANode == null ) {
				node.appendChild(CDATANode = $.XML.createCDATA(value));
			} else {
				$.XML.setText(CDATANode, value);
			}

			var eventOndatachange = new EventFirer(this.box, "ondatachange");
			var eventObj = createEventObject();
			eventObj.id = this.id + "_" + name;
			eventOndatachange.fire(eventObj);  // 触发事件
		},

		// 将界面数据更新到Form模板的data/row/里
		updateData: function(el) {
			var newValue;
			if(event.propertyName == "checked") {
				newValue = el.checked == true ? 1 : 0;
			}
			else if(el.tagName.toLowerCase() == "select") {
				newValue = el._value;            
			}
			else {
				newValue = el.value;
			}

			var oldValue = this.getData(el.id);
			if( $.isNullOrEmpty(newValue) && $.isNullOrEmpty(oldValue) ) {
				return;
			}
			if(newValue != oldValue) {
				this.setFieldValue(el.id, newValue);
			}
		},

		// 将数据设置到界面输入框上显示，同时更新到data/row/里
		updateDataExternal: function(name, value) {
			this.setFieldValue(name, value);
			
			// 更改页面显示数据
			var fieldObj = this.fieldObjMap[name];
			if(fieldObj) {
				fieldObj.setValue(value);
			}
		},

		getData: function(name) {
			return this.template.getFieldValue(name);
		},

		showCustomErrorInfo: function(name, str) {
			var fieldObj = this.fieldObjMap[name];
			if( fieldObj ) {
				showErrorInfo(str, fieldObj.el);
			}
		},

		getFieldConfig: function(name, attrName) {
			var field = this.template.fieldsMap[name];
			if( field == null ) {
				return alert("指定的字段[" + name + "]不存在");
			}
			return field.getAttribute(attrName);
		},

		getXmlDocument: function() {
			return this.template.sourceXML;
		}
	};

	// 普通文本输入框
	var StringField = function(fieldName, form) {
		this.el = $1(fieldName);
		this.el._value = this.el.value; // 备份原值

		var oThis = this;
		this.el.onblur = function() {
			if("text" == this.type) { // 判断input的类型
				this.value = this.value.trim(); // 去掉前后的空格
			}

			form.updateData(this);
		};

		this.el.onpropertychange = function() {
			if(window.event.propertyName == "value") {
				var maxLength = parseInt(this.getAttribute('maxLength'));

				// 超出长度则截掉
				if(this.value.length > maxLength) {
					restore(this, this.value.substring(0, maxLength));
				}
				else{
					this._value = this.value;
				}
			}
		};
	};

	StringField.prototype = {
		setValue : function(value) {
			this.el._value = this.el.value = value;
		},

		validate: validate,
		
		setEditable : function(status) {
			this.el.editable = status || this.el.getAttribute("editable");

			var disabled = (this.obj.editable == "false");
			this.el.className = disabled ? "string_disabled" : "string";

			if(this.el.tagName == "textarea") {
				this.el.readOnly = disabled;  // textarea 禁止状态无法滚动显示所有内容，所以改为只读
			} else {
				this.el.disabled = disabled;        
			}
		},

		saveAsDefaultValue : function() {
			this.el.defaultValue = this.el.value;
		},

		setFocus : setFocus
	};

	// 自定义方法输入值类型
	var FunctionField = function(fieldName, form) {
		this.el = $$(fieldName);
		this.el._value = this.el.value; // 备份原值
		this.isdate = (this.el.getAttribute("mode").toLowerCase() == "date");
	 
		if( !this.el.disabled ) {
			if(this.isdate) {
				if(this.picker == null) {
					this.picker = new $.Calendar( {
				        field: $1(this.el.id),
				        firstDay: 1,
				        minDate: new Date('2000-01-01'),
				        maxDate: new Date('2020-12-31'),
				        yearRange: [2000,2020],
				        format: 'yyyy-MM-dd'
				    });
				}
			}
			else { 
				var funcIcon = $.createElement("span", "functionIcon"); // 添加点击按钮
				this.el.parentNode.appendChild(funcIcon);
 
 				var cmd = this.el.getAttribute("cmd");
				funcIcon.onclick = function() {
					$.execCommand(cmd);
				};
			}
		}	

		this.el.onblur = function() {
			form.updateData(this);
		};
	};
 
	FunctionField.prototype = {
		setValue : function(value) {
			this.el._value = this.el.value = value;
		},

		validate: validate,
		
		setEditable : function(status) {
			this.el.disabled  = (status == "false");
			this.el.className = (this.el.disabled ? "function_disabled" : "function");

			// function图标
			if(!this.isdate) {
				this.el.nextSibling.disabled  = this.el.disabled;
				this.el.nextSibling.className = (this.el.disabled ? "bt_disabled" : "");
				this.el.readOnly = true;
			}
			
			this.el.editable = status;
		},

		saveAsDefaultValue : function() {
			this.el.defaultValue = this.el.value;
		},

		setFocus : setFocus
	}


// 下拉选择框，单选或多选
var Mode_ComboEdit = function(fieldName, xform) {
	this.obj = $$(fieldName);
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
		xform.setFieldValue(this.obj.id, valueList[0]);
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


function Mode_Hidden(fieldName, xform) {
	this.obj = $$(fieldName);
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

			map[name] = $.XML.getText(nodes[i]);
		}
	}
	return map;
}
