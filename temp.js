/*********************************** 常用函数  start **********************************/

/* 对象类型 */
_TYPE_NUMBER = "number";
_TYPE_OBJECT = "object";
_TYPE_FUNCTION = "function";
_TYPE_STRING = "string";
_TYPE_BOOLEAN = "boolean";

/* 常用方法缩写 */
$$ = function(id) {
	return document.getElementById(id);
}

var bind = function(object, fun) {
	return function() {
		return fun.apply(object, arguments);
	}
}
 

/*********************************** xml文档、节点相关操作  start **********************************/

MSXML_DOCUMENT_VERSION = "Msxml2.DOMDocument.6.0";

/* 将字符串转化成xml节点对象 */
function loadXmlToNode(xml) {
	if(xml == null || xml == "" || xml == "undifined") {
		return null;
	}

	xml = xml.revertEntity();
	var xr = new XmlReader(xml);
	return xr.documentElement;
}

function getXmlDOM() {
	var xmlDom;
	if (Public.isIE()) {
		xmlDom = new ActiveXObject(MSXML_DOCUMENT_VERSION);
		xmlDom.async = false;
	}
	else {
		var parser = new DOMParser();
		xmlDom = parser.parseFromString("<null/>", "text/xml");
		xmlDom.parser = parser;
    } 
	return xmlDom;
}

var EMPTY_XML_DOM = getXmlDOM();

function loadXmlDOM(url) {
	var xmlDom;
	if (window.DOMParser) {
		var xmlhttp = new window.XMLHttpRequest();  
	    xmlhttp.open("GET", url, false);  
		try {  xmlhttp.responseType = 'msxml-document';  } catch (e) {  } 
	    xmlhttp.send(null);  
	    xmlDom = xmlhttp.responseXML.documentElement;  
	}
	else { // < IE10
		xmlDom = new ActiveXObject(MSXML_DOCUMENT_VERSION);
		xmlDom.async = false;
		xmlDom.load(url);
    } 
	return xmlDom;
}

function XmlReader(text) {
	this.xmlDom = null;

	if (Public.isIE()) {
		this.xmlDom = new ActiveXObject(MSXML_DOCUMENT_VERSION);
		this.xmlDom.async = false;
		this.xmlDom.loadXML(text); 
	}
	else {
		var parser = new DOMParser();
		this.xmlDom = parser.parseFromString(text, "text/xml"); 
    } 

	this.documentElement = this.xmlDom.documentElement || this.xmlDom;
}

XmlReader.prototype.loadXml = function(text) {
	if (Public.isIE()) {
		this.xmlDom.loadXML(text); 
	}
	else { 
		var parser = new DOMParser();
		this.xmlDom = parser.parseFromString(text, "text/xml");
    } 
}

XmlReader.prototype.createElement = function(name) {
	var node = this.xmlDom.createElement(name);
	var xmlNode = new XmlNode(node);
	return xmlNode;
}

XmlReader.prototype.createCDATA = function(data) {
	var xmlNode;
	data = String(data).convertCDATA();
	if(window.DOMParser) {
		var tempReader = new XmlReader("<root><![CDATA[" + data + "]]></root>");
		var xmlNode = new XmlNode(tempReader.documentElement.firstChild);
	}
	else {
		xmlNode = new XmlNode(this.xmlDom.createCDATASection(data));
	}
	return xmlNode;
}

 XmlReader.prototype.createElementCDATA = function(name, data) {
	var xmlNode   = this.createElement(name);
	var cdataNode = this.createCDATA(data);
	xmlNode.appendChild(cdataNode);
	return xmlNode;
}

/* 获取解析错误 */
XmlReader.prototype.getParseError = function() {
	var parseError = null;
	if(window.DOMParser) {

	} 
	else {
		if( this.xmlDom.parseError.errorCode != 0 ) {
			parseError = this.xmlDom.parseError;
		}
	}
	return parseError;
}

XmlReader.prototype.toString = function() {
	var str = [];
	str[str.length] = "[XmlReader Object]";
	str[str.length] = "xml:" + this.toXml();
	return str.join("\r\n");
}

XmlReader.prototype.toXml = function() {
	if (Public.isIE()) {
		return this.xmlDom.xml;
	}
	else {
		var xmlSerializer = new XMLSerializer();
        return xmlSerializer.serializeToString(this.xmlDom.documentElement);
	}
}

function xml2String(element) {
	if (Public.isIE()) {
		return element.xml;
	}
	else {
		var xmlSerializer = new XMLSerializer();
        return xmlSerializer.serializeToString(element);
	}
}

function getNodeText(node) {
	return node.text || node.textContent || ""; // 取节点值时，chrome里用textContent
}

/*
 *  XML节点类型
 */
_XML_NODE_TYPE_ELEMENT    = 1; // 元素
_XML_NODE_TYPE_ATTRIBUTE  = 2; // 属性
_XML_NODE_TYPE_TEXT		  = 3; // 文本
_XML_NODE_TYPE_CDATA	  = 4; 
_XML_NODE_TYPE_PROCESSING = 7;
_XML_NODE_TYPE_COMMENT    = 8; // 注释
_XML_NODE_TYPE_DOCUMENT   = 9; // 文档


/* XML Node */
function XmlNode(node) {
	this.node = node;
	this.nodeName = this.node.nodeName;
	this.nodeType = this.node.nodeType;
	this.nodeValue = this.node.nodeValue;
	this.text = getNodeText(this.node); // 取CDATA节点值时，chrome里用textContent
	this.firstChild = this.node.firstChild;
	this.lastChild = this.node.lastChild;
	this.childNodes = this.node.childNodes;
	this.attributes = this.node.attributes;
}

XmlNode.prototype.getAttribute = function(name) {
	if(_XML_NODE_TYPE_ELEMENT == this.nodeType) {
		return this.node.getAttribute(name);
	}
}

XmlNode.prototype.setAttribute = function(name, value, isCDATA) {
	if(_XML_NODE_TYPE_ELEMENT != this.nodeType) {
		return;
	}

	value = value || "";
	if(isCDATA == 1) {
		this.setCDATA(name, value);
	}
	else {
		this.node.setAttribute(name, value);
	}
}

/* 删除节点属性 */
XmlNode.prototype.removeAttribute = function(name) {
	if(_XML_NODE_TYPE_ELEMENT == this.nodeType) {
		return this.node.removeAttribute(name);
	}
}

XmlNode.prototype.getCDATA = function(name) {
	var node = this.node.getElementsByTagName(name)[0];

	if( node == null ) {
		node = this.selectSingleNode(name + "/node()");
	}
	if( node ) {
		var cdataValue = node.text;
		if(cdataValue == null) {
			cdataValue = node.textContent;
		}
		if(cdataValue == null) {
			cdataValue = "";
		}
		return cdataValue.revertCDATA();
	}
}

XmlNode.prototype.setCDATA = function(name, value) {
	var oldNode = this.selectSingleNode(name);
	if(oldNode == null) {
		var xmlReader = new XmlReader("<xml/>");
		var newNode = xmlReader.createElementCDATA(name, value);
		this.appendChild(newNode);
	}
	else {
		var CDATANode = oldNode.selectSingleNode("node()");
		CDATANode.removeNode();

		var xmlReader = new XmlReader("<xml/>");
		CDATANode = xmlReader.createCDATA(value);
		oldNode.appendChild(CDATANode);
	}
}

XmlNode.prototype.removeCDATA = function(name) {
	var node = this.selectSingleNode(name);
	if(node ) {
		node.removeNode(true);
	}
}

XmlNode.prototype.cloneNode = function(deep) {
	if(this.nodeType == _XML_NODE_TYPE_TEXT || this.nodeType == _XML_NODE_TYPE_CDATA) {
		return this;
	}

	var tempNode;
	if( Public.isIE() ) {
		tempNode = new XmlNode(this.node.cloneNode(deep));
	} 
	else {
		tempNode = new XmlNode(new XmlReader(this.toXml()).documentElement);
	}
	return tempNode;
}

XmlNode.prototype.getParent = function() {
	var xmlNode = null;
	if( this.node.parentNode) {
		xmlNode = new XmlNode(this.node.parentNode);
	}
	return xmlNode;
}

XmlNode.prototype.removeNode = function() {
	var parentNode = this.node.parentNode;
	if(parentNode ) {
		parentNode.removeChild(this.node);
	}
}

XmlNode.prototype.selectSingleNode = function(xpath) {
	var xmlNode = null;
	if(window.DOMParser && !Public.isIE()) {
		var ownerDocument;
		if(_XML_NODE_TYPE_DOCUMENT == this.nodeType) {
			ownerDocument = this.node;
		} else {
			ownerDocument = this.node.ownerDocument;
		}
		var xPathResult = ownerDocument.evaluate(xpath, this.node, ownerDocument.createNSResolver(ownerDocument.documentElement), 9);
		if (xPathResult && xPathResult.singleNodeValue) {
			xmlNode = new XmlNode(xPathResult.singleNodeValue);
		}    
	} 
	else {
		var node = this.node.selectSingleNode(xpath);
		if(node ) {
			xmlNode = new XmlNode(node);
		}
	}
	return xmlNode;
}

/*
 *	查询多个节点
 *	参数：	string:xpath		xpath
 *	返回值：array:xmlNodes      XmlNode实例数组
 */
XmlNode.prototype.selectNodes = function(xpath) {
	var xmlNodes = [];
	if(window.DOMParser && !Public.isIE()) {
		var ownerDocument = null;
		if(_XML_NODE_TYPE_DOCUMENT == this.nodeType) {
			ownerDocument = this.node;
		} else {
			ownerDocument = this.node.ownerDocument;
		}
		var xPathResult = ownerDocument.evaluate(xpath, this.node, ownerDocument.createNSResolver(ownerDocument.documentElement), XPathResult.ORDERED_NODE_ITERATOR_TYPE);
		if (xPathResult) {
			var oNode = xPathResult.iterateNext() ;
			while(oNode) {
				xmlNodes[xmlNodes.length] = new XmlNode(oNode);
				oNode = xPathResult.iterateNext();
			}
		}
	} 
	else {
		var nodes = this.node.selectNodes(xpath);
		for(var i = 0; i < nodes.length; i++) {
			xmlNodes[xmlNodes.length] = new XmlNode(nodes[i]);
		}
	}
	return xmlNodes;
}

XmlNode.prototype.appendChild = function(xmlNode) {
	if(xmlNode instanceof XmlNode) {
		this.node.appendChild(xmlNode.node);
	}
	else {
		this.node.appendChild(xmlNode);
	}

	this.nodeValue = this.node.nodeValue;
	this.text = this.node.text;
	this.firstChild = this.node.firstChild;
	this.lastChild = this.node.lastChild;
	this.childNodes = this.node.childNodes;
}

XmlNode.prototype.getFirstChild = function() {
	if(this.firstChild) {
		var node = new XmlNode(this.firstChild);
		return node;
	}
	return null;
}

XmlNode.prototype.getLastChild = function() {
	if(this.lastChild) {
		var node = new XmlNode(this.lastChild);
		return node;
	}
	return null;
}

// 交换子节点
XmlNode.prototype.replaceChild = function(newNode, oldNode) {
	var oldParent = oldNode.getParent();
	if(oldParent && oldParent.equals(this)) {
		try { 
			this.node.replaceChild(newNode.node, oldNode.node);
		}
		catch (e)
		{ }
	}
}
		

// 交换节点
XmlNode.prototype.swapNode = function(xmlNode) {
	var parentNode = this.getParent();
	if( parentNode ) {
		parentNode.replaceChild(xmlNode, this);
	}
}

/* 获取前一个兄弟节点 */
XmlNode.prototype.getPrevSibling = function() {
	var xmlNode = null;
	if( this.node.previousSibling ) {
		xmlNode = new XmlNode(this.node.previousSibling);
	}
	return xmlNode;
}

/* 获取后一个兄弟节点 */
XmlNode.prototype.getNextSibling = function() {
	if( this.node.nextSibling ) {
		var node = new XmlNode(this.node.nextSibling);
		return node;
	}
	return null;
}

XmlNode.prototype.equals = function(xmlNode) {
	return xmlNode && this.node == xmlNode.node;
}

XmlNode.prototype.toString = function() {
	var str = [];
	str[str.length] = "[XmlNode]";
	str[str.length] = "nodeName:" + this.nodeName;
	str[str.length] = "nodeType:" + this.nodeType;
	str[str.length] = "nodeValue:" + this.nodeValue;
	str[str.length] = "xml:" + this.toXml();
	return str.join("\r\n");
}

XmlNode.prototype.toXml = function() {
	if (Public.isIE()) {
		return this.node.xml
	}
	else {
		var xs = new XMLSerializer();
		return xs.serializeToString(this.node);
	}
}

/*********************************** xml文档、节点相关操作  end **********************************/

