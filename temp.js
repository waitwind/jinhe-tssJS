

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


/*********************************** xml文档、节点相关操作  end **********************************/

