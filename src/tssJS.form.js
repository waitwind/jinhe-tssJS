

/* Form组件 */
;(function ($, factory) {

    $.Form = factory($);

    var FormCache = {};

    $.F = function(id, data) {
        var form = FormCache[id];
        if( form == null && data == null ) {
            return null;
        }

        if( form == null || data ) {
            form = new $.Form($1(id));
            FormCache[form.id] = form;  

            form.load(data)
        }
        
        return form;
    };

    $.fn.extend({
        form: function(data) {
            if(this.length > 0) {
                return $.F(this[0].id, data);
            }
        }
    });

})(tssJS, function ($) {

    'use strict';

    var showErrorInfo = function(errorInfo, obj) {
        setTimeout(function() {
            if( $.Balloon ) {
                $(obj).notice(errorInfo);
            }
        }, 100);
    },

    setFocus = function(){
        try { this.el.focus(); } catch(e) { }
    },

    validate = function() {
        var empty     = this.el.getAttribute("empty");
        var errorInfo = this.el.getAttribute("errorInfo");
        var caption   = this.el.getAttribute("caption").replace(/\s/g, "");
        var inputReg  = this.el.getAttribute("inputReg");
        
        var value = this.el.value;
        if(value == "" && empty == "false") {
            errorInfo = "[" + caption.replace(/\s/g, "") + "] 不允许为空。";
        }
        if(inputReg && !eval(inputReg).test(value)) {
            errorInfo = errorInfo || "[" + caption + "] 格式不正确，请更正.";
        }

        if( errorInfo ) {
            showErrorInfo(errorInfo, this.el);

            if( !!this.isInstance ) {
                this.setFocus();
            }
            if( event ) {
                $.Event.cancel(event);
            }
            return false;
        }
        return true;
    },

    restore = function(el, value) {    
        var tempEvent = el.onpropertychange;
        if( tempEvent == null ) {
            clearTimeout(el.timeout);
            tempEvent = el._onpropertychange;
        }
        else {
            el._onpropertychange = tempEvent;
        }

        el.onpropertychange = null;
        el.timeout = setTimeout(function() {
            el.value = value;
            el.onpropertychange = tempEvent;
        }, 10);
    },

    fireOnChangeEvent = function(el, newValue) {
        var onchangeFunc = el.getAttribute("onchange");
        if(onchangeFunc) {
            onchangeFunc = onchangeFunc.replace(/\^/g, "'"); // 有些地方的配置無法直接使用引號（如JSON），用^代替，這裡替換回來
            var rightKH = onchangeFunc.indexOf(")");
            if(rightKH > 0) {
                onchangeFunc = onchangeFunc.substring(0, rightKH) + ", '" + newValue + "')"; 
            }
            else {
                onchangeFunc = onchangeFunc + "('" + newValue + "')";
            }

            eval(onchangeFunc);
        }
    },

    XMLTemplate = function(dataXML) {
        this.sourceXML = dataXML;
             
        this.declare = $("declare", dataXML)[0];
        this.layout  = $("layout", dataXML)[0]; 
        this.script  = $("script", dataXML)[0];
    
        this.dataNode =  $("data", dataXML)[0];
        if(this.dataNode == null) {             
            this.dataNode = $.XML.createNode("data");
            this.sourceXML.appendChild(this.dataNode);
        }
        
        this.rowNode = $("row", this.dataNode)[0];;
        if(this.rowNode == null) {
            this.rowNode = $.XML.createNode("row");
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
            var node = this.rowNode.querySelector(name.replace(/\./gi, "\\."));
            if( node ) {
                return $.XML.getText(node).convertEntry();
            }
            return null;
        },

        toHTML: function() {
            var htmls = [], oThis = this;
            htmls.push("<form class='tssForm' method='post'>");
            htmls.push('<table>');

            // 添加隐藏字段           
            $("column[mode='hidden']", this.declare).each( function(i, column){
                var name = column.getAttribute("name");
                var value = oThis.getFieldValue(name);
                value = value ? "value=\"" + value + "\"" : "";
                htmls.push('<input type="hidden" ' + value + ' id="' + name + '"/>');
            } );
            htmls.push('<input type="hidden" name="xml" id="xml"/>');

            var trList = this.layout.querySelectorAll("TR");
            for(var i=0; i < trList.length; i++) {
                var trNode = trList[i];
                htmls.push("<tr>");

                var tdList = trNode.querySelectorAll("TD");
                for(var j=0; j < tdList.length; j++) {
                    var tdNode = tdList[j];
                    htmls.push("<td "+ copyNodeAttribute(tdNode) +">");

                    var childNodes = tdNode.childNodes;
                    for(var n=0; n < childNodes.length; n++) {
                        var childNode = childNodes[n];
                        if(childNode.nodeType != $.XML._NODE_TYPE_ELEMENT) {
                            htmls.push(childNode.value);
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
                        else if(mode == "string" || mode == "number" || mode == "function" || mode == "date" || mode == "datetime") {
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
                $.each(column.attributes, function(i, attr){
                    var name  = attr.nodeName;
                    var value = attr.value;
                    if(value && value != "null") {
                        if(name == "name") {
                            name = "id";
                        }
                        returnVal += name + " = \"" + value + "\" ";
                    }
                } );
 
                return returnVal;
             }

             function copyNodeAttribute(node) {
                var returnVal = "";
                var hasBinding = node.getAttribute("binding") != null;
                $.each(node.attributes, function(i, attr){
                    if(attr.nodeName != "style" || !hasBinding) {
                        returnVal += attr.nodeName + "=\"" + attr.value + "\" ";
                    }
                    if(attr.nodeName == "style" && hasBinding) {
                        returnVal += "style=\"" + attr.value + "\" ";
                    }
                } );
                return returnVal;
             }
        }
    };
 
    var Form = function(element) {
        this.id   = element.id;
        this.box  = element;

        this.editable  = element.getAttribute("editable") || "true";
        this.fieldObjMap = {};
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
        },
 
        attachEditor: function() {
            var fieldsMap = this.template.fieldsMap;
            for(var fieldName in fieldsMap) {
                var field = fieldsMap[fieldName];

                // 取layout中绑定该field column的element，如无，则字段无需展示。
                var fieldEl = $1(fieldName);
                if( fieldEl == null) {
                    continue;
                }

                var fieldObj;
                var fieldType = field.getAttribute("mode");
                switch(fieldType) {
                    case "string":
                        var colEditor = field.getAttribute("editor");
                        if(colEditor == "comboedit") {
                            fieldObj = new ComboField(fieldName, this);
                        }
                        else {
                            fieldObj = new StringField(fieldName, this);
                        }
                        break;
                    case "number":
                        fieldObj = new StringField(fieldName, this);
                        break;
                    case "date":
                    case "function":
                        fieldObj = new FunctionField(fieldName, this);
                        break;
                    case "datetime":
                        fieldObj = new FunctionField(fieldName, this, true);
                        break;
                    case "hidden":
                        fieldObj = new HiddenFiled(fieldName, this);
                        break;
                }

                fieldObj.saveAsDefaultValue();
                this.fieldObjMap[fieldName] = fieldObj;

                if(field.getAttribute('empty') == "false") {
                    var requiredTag = $.createElement("span", "required");
                    $(requiredTag).html("*");
                    fieldEl.parentNode.appendChild(requiredTag);
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

            $(".buttonBox", this.box.parentNode).css("display", status == "true" ? "block": "none");

            var oThis = this, firstEditableField;
            $.each(this.fieldObjMap, function(name, fieldObj) {
                var _status = status;

                // 如果field column上默认定义为不可编辑，则永远不可编辑
                var mode = oThis.getFieldConfig(name, "mode");
                var editable = oThis.getFieldConfig(name, "editable");
                if ( editable == "false" ) {
                    _status = "false";
                } 

                if(firstEditableField == null && _status == "true" && mode != "hidden") {
                    firstEditableField = fieldObj;
                }

                fieldObj.setEditable(_status);
            });

            if(firstEditableField) {
                firstEditableField.setFocus();
            }
        },

        setFieldEditable: function(name, value) {
            var fieldObj = this.fieldObjMap[name];
            if( fieldObj ) {
                fieldObj.setEditable(value);
            }
        },

        /* 设置row节点上与field column对应的值 */
        setFieldValue: function(name, value) {
            var rowNode = this.template.rowNode;
            var node = rowNode.querySelector(name.replace(/\./gi, "\\."));
            if( node == null ) { 
                rowNode.appendChild(node = $.XML.createNode(name)); // 创建单值节点
            }

            var CDATANode = node.firstChild;
            if( CDATANode == null ) {
                node.appendChild(CDATANode = $.XML.createCDATA(value));
            } else {
                $.XML.setText(CDATANode, value);
            }

            var eventOndatachange = new $.EventFirer(this, "ondatachange");
            var ev = $.Event.createEventObject();
            ev.id = this.id + "_" + name;
            eventOndatachange.fire(ev);  // 触发事件
        },

        // 将界面数据更新到Form模板的data/row/里
        updateData: function(el) {
            var newValue;
            if(window.event && window.event.propertyName == "checked") {
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

            var disabled = (this.el.editable == "false");
            this.el.className = disabled ? "field_disabled" : "string";

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
    var FunctionField = function(fieldName, form, isDatetime) {
        this.el = $$(fieldName);
        this.el._value = this.el.value; // 备份原值
        this.isdate = (this.el.getAttribute("mode").toLowerCase() == "date") || isDatetime;
     
        if( !this.el.disabled ) {
            if(this.isdate) {
                if(this.picker == null) {
                    this.picker = new $.Calendar( {
                        field: $1(this.el.id),
                        firstDay: 1,
                        minDate: new Date('2000-01-01'),
                        maxDate: new Date('2030-12-31'),
                        yearRange: [2000,2030],
                        format: 'yyyy-MM-dd',
                        careTime: isDatetime
                    });
                }
            }
            else { 
                var funcIcon = $.createElement("span", "functionBt"); // 添加点击按钮
                if(this.el.nextSibling) {
                    this.el.parentNode.insertBefore(funcIcon, this.el.nextSibling);
                } else {
                    this.el.parentNode.appendChild(funcIcon);
                }               
 
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
            this.el.className = (this.el.disabled ? "field_disabled" : "function");

            // function图标
            if(!this.isdate) {
                this.el.nextSibling.className = (this.el.disabled ? "hidden" : "functionBt");
                this.el.readOnly = true;
            }
            
            this.el.editable = status;
        },

        saveAsDefaultValue : function() {
            this.el.defaultValue = this.el.value;
        },

        setFocus : setFocus
    };

    // 下拉选择框，单选或多选
    var ComboField = function(fieldName, form) {
        this.el = $1(fieldName);
        this.multiple = this.el.getAttribute("multiple") == "multiple";
        
        var valueNode = this.el.attributes["value"];
        this.el._value = valueNode ? valueNode.value : "";

        var selectedValues = this.value2List(this.el._value);
        var selectedIndex = [];

        var valueList = (this.el.getAttribute("editorvalue") || "").split('|');
        var textList  = (this.el.getAttribute("editortext")  || "").split('|');
        for(var i=0; i < valueList.length; i++) {
            var value = valueList[i];
            this.el.options[i] = new Option(textList[i], value);
     
            if( selectedValues[value] ) {
                this.el.options[i].selected = true;
                selectedIndex[selectedIndex.length] = i;
            }
        }
        if( selectedIndex.length > 0 ){
            this.el.defaultSelectedIndex = selectedIndex.join(",");
        } 
        else {
            this.el.defaultSelectedIndex = this.el.selectedIndex = -1;
        }

        if(this.multiple && this.el.getAttribute("height") == null) {
            this.el.style.height = Math.min(Math.max(valueList.length, 4), 4) * 18 + "px";
        }   

        // 当empty = false(表示不允许为空)时，下拉列表的默认值自动取第一项值
        if( this.el._value == "" &&  this.el.getAttribute('empty') == "false") {
            this.setValue(valueList[0]);
            form.setFieldValue(this.el.id, valueList[0]);
        }
        
        this.el.onchange = function() {
            var x = [];
            for(var i=0; i < this.options.length; i++) {
                var option = this.options[i];
                if(option.selected) {
                    x[x.length] = option.value;
                }
            }
            this._value = x.join(",");
            form.updateData(this);
            
            fireOnChangeEvent(this, this._value);
        }
    };

    ComboField.prototype = {
        value2List: function(value) {
            var valueList = {};
            if( !$.isNullOrEmpty(value) ) {
                value.split(",").each(function(i, item){
                    valueList[item] = true;
                })
            }           

            return valueList;
        },

        setValue: function(value) {
            var valueList = this.value2List(value);

            var noSelected = true;
            $.each(this.el.options, function(i, option){
                if(valueList[option.value]) {
                    option.selected = true;
                    noSelected = false;
                }
            });
 
            if(noSelected){
                this.el.selectedIndex = -1; 
            }

            this.el._value = value;
            fireOnChangeEvent(this.el, value);
        },

        setEditable: function(status) {
            this.el.disabled  = (status == "true" ? false : true);
            this.el.className = (status == "true" ? "comboedit" : "field_disabled");
            this.el.editable  = status;
        },

        validate: validate,

        saveAsDefaultValue: function() {
            var selectedIndex = [];
            for(var i=0; i < this.el.options.length; i++){
                var opt = this.el.options[i];
                if(opt.selected) {
                    selectedIndex[selectedIndex.length] = i;
                }
            }
            this.el.defaultSelectedIndex = selectedIndex.join(",");
        },

        setFocus: setFocus
    };
 
    // 隐藏hidden字段
    var HiddenFiled = function(fieldName, form) {
        this.el = $1(fieldName);
    };

    HiddenFiled.prototype = {
        setValue: function(s) {},
        setEditable: function(s) {},
        validate: function() { return true; },
        saveAsDefaultValue: function() {},
        setFocus: function() {}
    };

    return Form;
});