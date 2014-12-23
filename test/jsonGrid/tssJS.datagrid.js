;(function ($, factory) {

    $.DataGrid = factory();

    $.DG = function(id, data, template) {
        var grid = GridCache[id];
        if( grid == null || data ) {
            grid = new $.DataGrid($1(id), data, template);
            GridCache[id] = grid;  
        }
        
        return grid;
    }

})(tssJS, function() {

    'use strict';


});