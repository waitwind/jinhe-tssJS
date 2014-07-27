



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

