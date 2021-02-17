/*! DataTables styling wrapper for Buttons
 * ©2018 SpryMedia Ltd - datatables2.net/license
 */

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery', 'datatables2.net-dt', 'datatables2.net-buttons'], function ($) {
            return factory($, window, document);
        });
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = function (root, $) {
            if (!root) {
                root = window;
            }

            if (!$ || !$.fn.dataTable) {
                $ = require('datatables2.net-dt')(root, $).$;
            }

            if (!$.fn.dataTable.Buttons) {
                require('datatables2.net-buttons')(root, $);
            }

            return factory($, root, root.document);
        };
    } else {
        // Browser
        factory(jQuery, window, document);
    }
}(function ($, window, document, undefined) {

    return $.fn.dataTable;

}));
