;(function ($, factory) {

    $.DataGrid = factory();

    $.fn.extend({
    	datagrid: function(info) {
    		var el = this[0];
    		var id = el.id;
	        var grid = GridCache[id];
	        if( grid == null || info.data ) {
	            grid = new $.DataGrid(el, info);
	            GridCache[id] = grid;  
	        }
	        
	        return grid;
	    }
    });

    $.DG = function(id, info) {
        var grid = GridCache[id];
        if( grid == null || info.data ) {
            grid = new $.DataGrid($1(id), info);
            GridCache[id] = grid;  
        }
        
        return grid;
    }

})(tssJS, function() {

    'use strict';

    var Column = function(info) {
		this.name  = info.name;
		this.label = info.label;
		this.type  = info.type || "string";
		this.width = (info.width || "120px").trim();
		this.align = info.align || "center"
		this.formatter = info.formatter;
		this.styler = info.styler;

		if( /^\d*$/.test(this.width) ) {
			this.width += "px";
		}

		if(this.align == null) {
			switch(this.type) {
            case "number":
                this.align = "right";
                break;
            case "string":
            default:
                this.align = "center";
                 break;
       	 	}
		}
		
    };

    Column.prototype = {
 
    };

    var DataGrid = function(el, info) {
    	this.el = el;
    	$(this.el).html("").css("width", info.width || "100%");

    	var pointHeight = info.height;
        if( pointHeight == null ) {
            pointHeight = this.el.clientHeight || this.el.parentNode.clientHeight; 
        }
        $(this.el).css("height", pointHeight + "px"); // hack 固定住grid高度，以免在IE部分版本及FF里被撑开

    	// Grid控件上禁用默认右键
        (this.el.parentNode || document).oncontextmenu = function(_event) {
            $.Event.cancel(_event || window.event);
        }

		var _columns = {};
        (info.columns || []).each(function(index, column) {
            _columns[column.name] = column;
        });
        this.columns = _columns;

        this.rowStyler = info.rowStyler;

        this.url = info.url;
        this.queryParams = info.queryParams;
        if(this.url) {
        	var oThis = this;
        	$.ajax({
        		url: oThis.url,
        		params: oThis.queryParams,
        		type: "json",
        		waiting: true,
        		ondata: function() {
        			oThis.data = this.getResponseJSON();
        		}
        	});
        }
        else {
        	this.data = info.data;
        }

        
    };

    DataGrid.prototype = {
    	toHTML: function() {
    		var htmls = [], thead = [], tbody = [];

    		thead.push('<thead><tr>');
    		$.each(this.columns, function(name, column) {
                var width   = column.getAttribute("width");
                var style = (width ? ' style="width:' + width + '"': '');
                thead.push('<td name="' + column.name + '" ' + style + '>' + column.label + '</td>');
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
                    var _class = columnsMap[name].getAttribute("display")  == "none" ? ' class="hidden"' : '';
                    tbody.push('<td name="' + name + '" value="' + value + '" ' + _class + '>' + value + '</td>');
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
    }

    return DataGrid;

});