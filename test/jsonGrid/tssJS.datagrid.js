;(function ($, factory) {

    $.DataGrid = factory();

    var DataGridCache = {};

    $.fn.extend({
    	datagrid: function(info) {
    		var el = this[0];
    		var id = el.id;
	        var grid = DataGridCache[id];
	        if( grid == null || info.data ) {
	            grid = new $.DataGrid(el, info);
	            DataGridCache[id] = grid;  
	        }
	        
	        return grid;
	    }
    });

    $.extend({
        formatMoney: function(s, n) {   
            n = n > 0 && n <= 20 ? n : 2;   
            s = parseFloat((s + "").replace(/[^\d\.-]/g, "")).toFixed(n) + "";   
            var l = s.split(".")[0].split("").reverse(),   
            r = s.split(".")[1];   
            t = "";   
            for(i = 0; i < l.length; i ++ ) {   
                t += l[i] + ((i + 1) % 3 == 0 && (i + 1) != l.length ? "," : "");   
            }   
            return t.split("").reverse().join("") + "." + r;   
        }
    });

})(tssJS, function() {

    'use strict';

    var Column = function(info) {
		this.name  = info.name;
		this.label = info.label|| info.name;
		this.type  = info.type || "string";
		this.width = (info.width || "120px").trim();
		this.align = info.align;
		this.formatter = info.formatter;
		this.styler = info.styler;
		this.editable = info.editable || "false";

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
            _columns[column.name] = new Column(column);
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
        			oThis.createGrid();
        		}
        	});
        }
        else {
        	this.data = info.data;
        	this.createGrid();
        }
    };

    DataGrid.prototype = {
        createGrid: function() {
            this.toHTML();

            // 渲染样式 styler rowStyler
            this.appendStyle();

            // 添加事件、动作
            this.addEvent();
        },

    	toHTML: function() {
    		var htmls = [], thead = [], tbody = [];

    		thead.push('<thead><tr>');
    		$.each(this.columns, function(name, column) {
                var width   = column.width;
                var style = (width ? ' style="width:' + width + '"': '');
                thead.push('<td name="' + column.name + '" ' + style + '>' + column.label + '</td>');
            });
            thead.push("</tr></thead>");

            var oThis = this;
            tbody.push('<tbody>');
            $.each(oThis.data, function(i, row) {
                var index = i + 1;
                tbody.push('<tr _index="' + index + '">');

                $.each(oThis.columns, function(name, column) {
                    var value  = row[name] || "";
                    tbody.push('<td><div name="' + name + '" value="' + value + '" contenteditable="' + column.editable + '" ' + '>' + value + '</div></td>');
                });

                tbody.push("</tr>");
            });
            tbody.push("</tbody>");

            htmls.push("<table>");
            htmls.push(thead.join(""));
            htmls.push(tbody.join(""));
            htmls.push("</table>");

            $(this.el).html( htmls.join("") ).addClass("datagrid");
    	},

        appendStyle: function() {
            var oThis = this;
            $("tbody>tr", this.el).each(function(i, row){
                var rowValues = oThis.data[i];
                if( $.isFunction(oThis.rowStyler) ) {
                    oThis.rowStyler(i, row, rowValues);
                }

                $(row).hover(
                    function() { 
                        $(row).addClass("highlight"); 
                    }, 
                    function() { 
                        $(row).removeClass("highlight");
                    } 
                );

                $("td>div", row).each(function(j, cellDiv){
                    var name = cellDiv.getAttribute("name");
                    var column = oThis.columns[name];
                    if( $.isFunction(column.styler) ) {
                        var value = cellDiv.getAttribute("value");
                        column.styler(value, cellDiv);
                    }

                    if(column.align) {
                        $(cellDiv).css("textAlign", column.align);
                    }

                    var value = cellDiv.getAttribute("value");
                    if( $.isFunction(column.formatter) ) {
                        $(cellDiv).html( column.formatter(value, rowValues) );
                    }
                });
            });
        },

        addEvent: function() {
            var oThis = this;
            $("tbody>tr", this.el).each(function(i, row){
 
                $("td>div", row).each(function(j, cellDiv){
                    var name = cellDiv.getAttribute("name");
                    var column = oThis.columns[name];

                    var value = $(cellDiv).html();
                    var originalValye = cellDiv.getAttribute("value");
                    if(cellDiv.getAttribute("contenteditable") === "true") {
                        $(cellDiv).click(function(){
                            $(cellDiv).html(originalValye);
                        });
                        
                        // $(cellDiv).focus(function(){
                        //     value = $(cellDiv).html(); 
                        //     if( $.isFunction(column.formatter) ) {
                        //         $(cellDiv).html( column.formatter(value, rowValues) );
                        //     }
                        // });
                    }
                });
            });
        }
    }

    return DataGrid;

});