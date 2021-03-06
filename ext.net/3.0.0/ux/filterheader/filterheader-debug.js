﻿Ext.define("Ext.net.FilterHeader", {
    extend : "Ext.util.Observable",
    alias  : "plugin.filterheader",

    autoReload   : true,
    updateBuffer : 500,
    filterParam  : "filterheader",
    remote       : false,
    //ignoreHiddenColumn : false,
    //caseSensitive : false,
    //decimalSeparator : ".",
    //clearTime : true,
    //dateFormat 
    //submitDateFormat 
    //value

    statics: {
        behaviour: {
            caseSensitive    : false,
            decimalSeparator : ".",
            clearTime        : true,
            //dateFormat 
            //submitDateFormat

            isRemote: function () {
                var plugin = Ext.net.FilterHeader.behaviour.plugin;

                return plugin && plugin.remote;
            },

            getOption: function (name) {
                var plugin = Ext.net.FilterHeader.behaviour.plugin;

                if (plugin && Ext.isDefined(plugin[name])) {
                    return plugin[name];
                }

                return Ext.net.FilterHeader.behaviour[name];
            },

            getStrValue: function (value) {
                return Ext.net.FilterHeader.behaviour.getOption("caseSensitive") || !value || Ext.net.FilterHeader.behaviour.isRemote() ? value : value.toLowerCase();
            },

            getNumericValue: function (value) {
                value = parseFloat(String(value).replace(Ext.net.FilterHeader.behaviour.getOption("decimalSeparator"), '.'));
                return isNaN(value) ? null : value;
            },

            getDateValue: function (value, format) {
                var date = Ext.Date.parse(value, Ext.net.FilterHeader.behaviour.getOption("dateFormat") || format || "c");
                return Ext.isDate(date) ? (Ext.net.FilterHeader.behaviour.getOption("clearTime") ? Ext.Date.clearTime(date, true) : date) : null;
            },

            getBehaviourByName: function (groupName, behaviourName) {
                var group = Ext.net.FilterHeader.behaviour[groupName];

                if (group) {
                    var i, len;
                    for (i = 0, len = group.length; i < len; i++) {
                        if (group[i].name == behaviourName) {
                            return group[i];
                        }
                    }
                }

                return null;
            },

            getBehaviour: function (groupName, value) {
                var group = Ext.net.FilterHeader.behaviour[groupName];

                if (group) {
                    var i, len;
                    for (i = 0, len = group.length; i < len; i++) {
                        if (group[i].is(value)) {
                            return group[i];
                        }
                    }
                }

                return null;
            },

            addBehaviour: function (groupName, behaviour, replace) {
                if (!behaviour.name) {
                    throw "Please define a name for behaviour";
                }

                var oldBhv = Ext.net.FilterHeader.behaviour.getBehaviourByName(groupName, behaviour.name);

                if (oldBhv && replace !== true) {
                    throw "Behaviour with name '" + behaviour.name + "' already exists";
                }

                var group = Ext.net.FilterHeader.behaviour[groupName];

                if (oldBhv) {
                    Ext.Array.replace(group, Ext.Array.indexOf(group, oldBhv), 1, [behaviour]);
                }
                else if (Ext.isNumber(replace)) {
                    Ext.Array.insert(group, replace, [behaviour]);
                }
                else {
                    group.push(behaviour);
                }
            },

            removeBehaviour: function (groupName, behaviourName) {
                var oldBhv = Ext.net.FilterHeader.behaviour.getBehaviourByName(groupName, behaviourName);

                if (!oldBhv) {
                    throw "Behaviour with name '" + behaviourName + "' is not found";
                }

                Ext.Array.remove(Ext.net.FilterHeader.behaviour[groupName], oldBhv);

                return oldBhv;
            },

            string: [
                {
                    is: function (value) {
                        return false;
                    },

                    getValue: function (value) {
                        return { value: Ext.net.FilterHeader.behaviour.getStrValue(value), valid: true };
                    },

                    match: function (recordValue, matchValue) {
                        return Ext.net.StringUtils.startsWith(Ext.net.FilterHeader.behaviour.getStrValue(recordValue) || "", matchValue);
                    },

                    isValid: function (value) {
                        return true;
                    },

                    serialize: function (value) {
                        return {
                            type: "string",
                            op: "+",
                            value: value
                        };
                    }
                },
                {
                    name: "+",

                    is: function (value) {
                        return value[0] === "+";
                    },

                    getValue: function (value) {
                        return { value: Ext.net.FilterHeader.behaviour.getStrValue(value).substring(1), valid: this.isValid(value) };
                    },

                    match: function (recordValue, matchValue) {
                        return Ext.net.StringUtils.startsWith(Ext.net.FilterHeader.behaviour.getStrValue(recordValue) || "", matchValue);
                    },

                    isValid: function (value) {
                        return value.length > 1;
                    },

                    serialize: function (value) {
                        return {
                            type: "string",
                            op: "+",
                            value: value
                        };
                    }
                },

                {
                    name: "-",

                    is: function (value) {
                        return value[0] === "-";
                    },

                    getValue: function (value) {
                        return { value: Ext.net.FilterHeader.behaviour.getStrValue(value).substring(1), valid: this.isValid(value) };
                    },

                    match: function (recordValue, matchValue) {
                        return Ext.net.StringUtils.endsWith(Ext.net.FilterHeader.behaviour.getStrValue(recordValue) || "", matchValue);
                    },

                    isValid: function (value) {
                        return value.length > 1;
                    },

                    serialize: function (value) {
                        return {
                            type: "string",
                            op: "-",
                            value: value
                        };
                    }
                },

                {
                    name: "=",

                    is: function (value) {
                        return value[0] === "=";
                    },

                    getValue: function (value) {
                        return { value: Ext.net.FilterHeader.behaviour.getStrValue(value).substring(1), valid: this.isValid(value) };
                    },

                    match: function (recordValue, matchValue) {
                        return Ext.net.FilterHeader.behaviour.getStrValue(recordValue) == matchValue;
                    },

                    isValid: function (value) {
                        return value.length > 1;
                    },

                    serialize: function (value) {
                        return {
                            type: "string",
                            op: "=",
                            value: value
                        };
                    }
                },

                {
                    name: "*",

                    is: function (value) {
                        return value[0] === "*";
                    },

                    getValue: function (value) {
                        return { value: Ext.net.FilterHeader.behaviour.getStrValue(value).substring(1), valid: this.isValid(value) };
                    },

                    match: function (recordValue, matchValue) {
                        return recordValue && (Ext.net.FilterHeader.behaviour.getStrValue(recordValue).indexOf(matchValue) > -1);
                    },

                    isValid: function (value) {
                        return value.length > 1;
                    },

                    serialize: function (value) {
                        return {
                            type: "string",
                            op: "*",
                            value: value
                        };
                    }
                },

                {
                    name: "!",

                    is: function (value) {
                        return value[0] === "!";
                    },

                    getValue: function (value) {
                        return { value: Ext.net.FilterHeader.behaviour.getStrValue(value).substring(1), valid: this.isValid(value) };
                    },

                    match: function (recordValue, matchValue) {
                        return recordValue && (Ext.net.FilterHeader.behaviour.getStrValue(recordValue).indexOf(matchValue) < 0);
                    },

                    isValid: function (value) {
                        return value.length > 1;
                    },

                    serialize: function (value) {
                        return {
                            type: "string",
                            op: "!",
                            value: value
                        };
                    }
                }
            ],

            numeric: [
                {
                    is: function (value) {
                        return false;
                    },

                    getValue: function (value) {
                        var bhv_value = Ext.net.FilterHeader.behaviour.getNumericValue(value);
                        return { value: bhv_value, valid: bhv_value !== null || Ext.isEmpty(value) };
                    },

                    match: function (recordValue, matchValue) {
                        return recordValue === matchValue;
                    },

                    isValid: function (value) {
                        return Ext.net.FilterHeader.behaviour.getNumericValue(value) !== null || Ext.isEmpty(value);
                    },

                    serialize: function (value) {
                        return {
                            type: "number",
                            op: "=",
                            value: value
                        };
                    }
                },

                {
                    name: "compare",

                    map: {
                        ">": "gt",
                        "<": "lt",
                        ">=": "gte",
                        "<=": "lte"
                    },

                    is: function (value) {
                        var parts = value.split(/(>=|<=|>|<)/i);
                        return parts.length > 1;
                    },

                    getValue: function (value) {
                        var nums = value.split(/(>=|<=|>|<)/i),
                            num,
                            valid = Ext.isEmpty(value),
                            tmp = [];

                        Ext.each(nums, function (num) {
                            num = num.trim();
                            if (!Ext.isEmpty(num, false)) {
                                tmp.push(num);
                            }
                        });

                        nums = tmp;
                        v = {};

                        if (nums.length == 1) {
                            if (!(nums[0][0] == ">" || nums[0][0] == "<")) {
                                num = Ext.net.FilterHeader.behaviour.getNumericValue(nums[0]);

                                if (Ext.isNumber(num)) {
                                    v.eq = num;
                                    valid = true;
                                }
                            }
                        }
                        else {
                            if (nums[0] == ">" || nums[0] == "<" || nums[0] == "<=" || nums[0] == ">=") {
                                num = Ext.net.FilterHeader.behaviour.getNumericValue(nums[1]);

                                if (Ext.isNumber(num)) {
                                    v[this.map[nums[0]]] = num;
                                    valid = true;
                                }
                            }

                            if (nums[2] == ">" || nums[2] == "<" || nums[2] == "<=" || nums[2] == ">=") {
                                num = Ext.net.FilterHeader.behaviour.getNumericValue(nums[3]);

                                if (Ext.isNumber(num)) {
                                    v[this.map[nums[2]]] = num;
                                    valid = true;
                                }
                                else {
                                    valid = false;
                                }
                            }
                        }

                        return { value: v, valid: valid };
                    },

                    match: function (recordValue, matchValue) {
                        if (matchValue.lt !== undefined && recordValue >= matchValue.lt) {
                            return false;
                        }
                        if (matchValue.gt !== undefined && recordValue <= matchValue.gt) {
                            return false;
                        }
                        if (matchValue.lte !== undefined && recordValue > matchValue.lte) {
                            return false;
                        }
                        if (matchValue.gte !== undefined && recordValue < matchValue.gte) {
                            return false;
                        }
                        if (matchValue.eq !== undefined && recordValue !== matchValue.eq) {
                            return false;
                        }

                        return true;
                    },

                    isValid: function (value) {
                        return this.getValue(value, field).valid;
                    },

                    serialize: function (value) {
                        return {
                            type: "number",
                            op: "compare",
                            value: value
                        };
                    }
                }
            ],

            date: [
                {
                    is: function (value) {
                        return false;
                    },

                    getValue: function (value, field) {
                        var date = Ext.net.FilterHeader.behaviour.getDateValue(value, field.column.format);

                        return { value: date, valid: date !== null || Ext.isEmpty(value) };
                    },

                    match: function (recordValue, matchValue) {
                        var recordDate = recordValue && (Ext.net.FilterHeader.behaviour.getOption("clearTime") ? Ext.Date.clearTime(recordValue, true).getTime() : recordValue.getTime());
                        return recordDate === (matchValue && matchValue.getTime());
                    },

                    isValid: function (value, field) {
                        return Ext.net.FilterHeader.behaviour.getDateValue(value, field.column.format) !== null || Ext.isEmpty(value);
                    },

                    serialize: function (value) {
                        return {
                            type: "date",
                            op: "=",
                            value: Ext.Date.format(value, Ext.net.FilterHeader.behaviour.getOption("submitDateFormat") || "Y-m-d")
                        };
                    }
                },

                {
                    name: "compare",

                    map: {
                        ">": "gt",
                        "<": "lt",
                        ">=": "gte",
                        "<=": "lte"
                    },

                    is: function (value) {
                        var parts = value.split(/(>=|<=|>|<)/i);
                        return parts.length > 1;
                    },

                    getValue: function (value, field) {
                        var dates = value.split(/(>=|<=|>|<)/i),
                            date,
                            valid = Ext.isEmpty(value),
                            tmp = [];

                        Ext.each(dates, function (dt) {
                            dt = dt.trim();
                            if (!Ext.isEmpty(dt, false)) {
                                tmp.push(dt);
                            }
                        });

                        dates = tmp;
                        v = {};

                        if (dates.length == 1) {
                            if (!(dates[0][0] == ">" || dates[0][0] == "<")) {
                                date = Ext.net.FilterHeader.behaviour.getDateValue(dates[0], field.column.format);

                                if (Ext.isDate(num)) {
                                    v.eq = num;
                                    valid = true;
                                }
                            }
                        }
                        else {
                            if (dates[0] == ">" || dates[0] == "<" || dates[0] == "<=" || dates[0] == ">=") {
                                date = Ext.net.FilterHeader.behaviour.getDateValue(dates[1], field.column.format);

                                if (Ext.isDate(date)) {
                                    v[this.map[dates[0]]] = date;
                                    valid = true;
                                }
                            }

                            if (dates[2] == ">" || dates[2] == "<" || dates[2] == "<=" || dates[2] == ">=") {
                                date = Ext.net.FilterHeader.behaviour.getDateValue(dates[3], field.column.format);

                                if (Ext.isDate(date)) {
                                    v[this.map[dates[2]]] = date;
                                    valid = true;
                                }
                                else {
                                    valid = false;
                                }
                            }
                        }

                        return { value: v, valid: valid };
                    },

                    match: function (recordValue, matchValue) {
                        var recordDate = recordValue && (Ext.net.FilterHeader.behaviour.getOption("clearTime") ? Ext.Date.clearTime(recordValue, true).getTime() : recordValue.getTime());

                        if (matchValue.lt !== undefined && recordDate >= matchValue.lt.getTime()) {
                            return false;
                        }
                        if (matchValue.gt !== undefined && recordDate <= matchValue.gt.getTime()) {
                            return false;
                        }
                        if (matchValue.lte !== undefined && recordDate > matchValue.lte.getTime()) {
                            return false;
                        }
                        if (matchValue.gte !== undefined && recordDate < matchValue.gte.getTime()) {
                            return false;
                        }
                        if (matchValue.eq !== undefined && recordDate !== matchValue.eq.getTime()) {
                            return false;
                        }

                        return true;
                    },

                    isValid: function (value) {
                        return this.getValue(value, field).valid;
                    },

                    serialize: function (value) {
                        var serValue = {},
                            format = Ext.net.FilterHeader.behaviour.getOption("submitDateFormat") || "Y-m-d";

                        if (value.lt !== undefined) {
                            serValue.lt = Ext.Date.format(value.lt, format);
                        }
                        if (value.gt !== undefined) {
                            serValue.gt = Ext.Date.format(value.gt, format);
                        }
                        if (value.lte !== undefined) {
                            serValue.lte = Ext.Date.format(value.lte, format);
                        }
                        if (value.gte !== undefined) {
                            serValue.gte = Ext.Date.format(value.gte, format);
                        }
                        if (value.eq !== undefined) {
                            serValue.eq = Ext.Date.format(value.eq, format);
                        }

                        return {
                            type: "date",
                            op: "compare",
                            value: serValue
                        };
                    }
                }
            ],

            boolean: [
                {
                    is: function (value) {
                        return false;
                    },

                    getValue: function (value, field) {
                        var bool = null;
                        if (value === 1 || value === "1" || value === "true" || value === "True") {
                            bool = true;
                        }
                        else if (value === 0 || value === "0" || value === "false" || value === "False") {
                            bool = false;
                        }
                        return { value: bool, valid: bool !== null || Ext.isEmpty(value) };
                    },

                    match: function (recordValue, matchValue) {
                        return recordValue === matchValue;
                    },

                    isValid: function (value, field) {
                        return this.getValue(value, field).valid;
                    },

                    serialize: function (value) {
                        return {
                            type: "boolean",
                            op: "=",
                            value: value
                        };
                    }
                }
            ]
        }
    },

    init: function (grid) {
        this.grid = grid;
        grid.filterHeader = this;
        this.view = grid.getView();
        this.store = grid.store;
        this.fields = [];
        this.prevFilters = {};
        this.onFieldChange = Ext.Function.createBuffered(this.onFieldChange, this.updateBuffer, this);

        if (this.remote) {
            this.store.on("before" + (this.store.buffered ? "prefetch" : "load"), this.onBeforeLoad, this);
        }

        (this.view.normalView || this.view).on("viewready", this.initColumns, this);
    },

    initColumns: function () {
        var columns = this.grid.headerCt.getGridColumns();
        Ext.each(columns, function (column) {
            this.addColumnField(column);
        }, this);

        this.grid.headerCt.on("add", this.onColumnAdd, this);
        this.grid.headerCt.on("remove", this.onColumnRemove, this);

        if (this.value) {
            this.setValue(this.value);
            delete this.value;
        }
    },

    addColumnField: function (column) {
        this.initField(this.extractField(column), column);
    },

    removeColumnField: function (column) {
        var field = this.extractField(column);
        if (field && (!field.isXType("displayfield") || field.filterFn)) {
            Ext.Array.remove(this.fields, field);
            delete field.column;
            field.un("change", this.onFieldChange, this);
            delete this.filterFn;
        }
    },

    initField: function (field, column) {
        if (field && (!field.isXType("displayfield") || field.filterFn)) {
            this.fields.push(field);
            field.column = column;
            field.filterRow = this;
            field.on("change", this.onFieldChange, this);

            if (!field.filterFn) {
                field.filterFn = Ext.Function.bind(this.smartFilterValue, this);
                field.isSmart = true;
            }

            delete this.filterFn;
        }
    },

    getValue: function (includeEmpty) {
        var value = {};

        Ext.each(this.fields, function (field) {
            var filterValue = field.getFilterValue ? field.getFilterValue() : field.getValue();
            if (!Ext.isEmpty(filterValue) || includeEmpty === true) {
                value[field.column.dataIndex] = filterValue;
            }
        });

        return value;
    },

    setValue : function (value) {
        var _old = this.autoReload,
            valid = true;
        this.autoReload = false;

        Ext.each(this.fields, function(field) {     
            field.setValue(value[field.column.dataIndex]);

            if (!this.isSmartFilterValid(field)) {
                valid = false;
            }
        }, this);

        this.autoReload = _old;
        if (valid) {
            this.runFiltering();
        }
    },

    onColumnAdd: function (headerCt, column) {
        this.addColumnField(column);
    },

    onColumnRemove: function (headerCt, column) {
        this.removeColumnField(column);
    },

    extractField: function (column) {
        var ctr = column.items.get(0);
        return ctr && ctr.items.get(0);
    },

    onFieldChange: function (field, value) {
        if (this.isSmartFilterValid(field)) {
            this.runFiltering();
        }
    },

    runFiltering: function () {
        if (!this.autoReload) {
            return;
        }

        var changed = false;
        Ext.each(this.fields, function (field) {
            var value = field.getFilterValue ? field.getFilterValue() : field.getValue(),
                eq = false,
                dataIndex = field.column.dataIndex,
                prevValue = this.prevFilters[dataIndex];

            if (Ext.isEmpty(value, false) && !Ext.isDefined(prevValue)) {
                return;
            }

            if (Ext.isDate(value) && Ext.isDate(prevValue)) {
                eq = value.getTime() !== prevValue.getTime();
            }
            else {
                eq = value !== prevValue;
            }

            if (eq) {
                changed = true;
                this.prevFilters[dataIndex] = value;
            }
        }, this);

        if (changed) {
            this.applyFilter();
        }
    },

    applyFilter: function () {
        if (this.fireEvent("beforefilter", this) !== false) {
            if (this.remote) {
                this.applyRemoteFilter();
            } else {
                var store = this.grid.getStore();
                store.clearFilter(true);
                store.filterBy(this.getRecordFilter());
            }
            this.fireEvent("filter", this);
        }
    },

    applyRemoteFilter: function () {
        var store = this.store;
        if (store.buffered) {
            store.data.clear();
        }

        store.loadPage(1);
    },

    onBeforeLoad: function (store, options) {
        var params = options.getParams() || {},
            values = this.getFilterValues();

        delete params[this.filterParam];

        if (values == null) {
            return false;
        }

        params[this.filterParam] = Ext.encode(values);
        options.setParams(params);
    },

    getFilterValues: function () {
        var values = {};

        Ext.each(this.fields, function (field) {
            var val = field.getFilterValue ? field.getFilterValue() : field.getValue(),
                type,
                dataIndex = field.column.dataIndex,
                bhv;

            if (!Ext.isEmpty(val, false)) {
                if (field.isSmart && Ext.isString(val) && field.lastFilterValue) {
                    if (!this.isSmartFilterValid(field)) {
                        return;
                    }
                    bhv = field.lastFilterValue.behaviour;

                    type = this.getFieldType(field);
                    val = bhv.serialize(field.lastFilterValue.convertedValue.value, dataIndex);

                    values[dataIndex] = val;
                }
                else {
                    if (!Ext.isEmpty(val, false)) {
                        values[dataIndex] = {
                            type: this.getFieldType(field),
                            op: "=",
                            dataIndex: dataIndex,
                            value: val
                        };
                    }
                }
            }
        }, this);

        return values;
    },

    getRecordFilter: function () {
        if (this.filterFn) {
            return this.filterFn;
        }

        var f = [],
            len;

        Ext.each(this.fields, function (field) {
            var me = this;

            f.push(function (record) {
                var fn = me.filterAuto,
                    value = field.getFilterValue ? field.getFilterValue() : field.getValue(),
                    dataIndex = field.column.dataIndex;

                if (field.filterFn) {
                    fn = field.filterFn;
                }
                else if (Ext.isDate(value)) {
                    fn = me.filterDate;
                }
                else if (Ext.isNumber(value)) {
                    fn = me.filterNumber;
                }
                else if (Ext.isString(value)) {
                    fn = me.filterString;
                }

                return fn(value, dataIndex, record, null, field);
            });
        }, this);

        len = f.length;

        this.filterFn = function (record) {
            for (var i = 0; i < len; i++) {
                if (!f[i](record)) {
                    return false;
                }
            }
            return true;
        };

        return this.filterFn;
    },

    clearFilter: function () {
        var _oldautoReload = this.autoReload;

        this.prevFilters = {};
        this.autoReload = false;

        Ext.each(this.fields, function (field) {
            if (Ext.isFunction(field.reset)) {
                field.reset();
            }
        }, this);

        this.autoReload = _oldautoReload;

        if (this.remote) {
            this.applyRemoteFilter();
        } else {
            this.grid.store.clearFilter();
        }
    },

    filterString: function (value, dataIndex, record) {
        var val = record.get(dataIndex);

        if (Ext.isNumber(val)) {
            if (!Ext.isEmpty(value, false) && val != value) {
                return false;
            }

            return true;
        }

        if (typeof val != "string") {
            return value.length == 0;
        }

        return this.stringFilterBehaviour(val, value);
    },

    stringFilterBehaviour: function (value, matchValue) {
        return Ext.net.StringUtils.startsWith(value.toLowerCase(), matchValue.toLowerCase());
    },

    filterDate: function (value, dataIndex, record) {
        var val = Ext.Date.clearTime(record.get(dataIndex), true).getTime();

        if (!Ext.isEmpty(value, false) && val != Ext.Date.clearTime(value, true).getTime()) {
            return false;
        }
        return true;
    },

    filterNumber: function (value, dataIndex, record) {
        var val = record.get(dataIndex);

        if (!Ext.isEmpty(value, false) && val != value) {
            return false;
        }

        return true;
    },

    filterAuto: function (value, dataIndex, record) {
        var val = record.get(dataIndex);

        if (!Ext.isEmpty(value, false) && val != value) {
            return false;
        }

        return true;
    },

    getFieldType: function (field) {
        var modelField = this.grid.store.getFieldByName(field.column.dataIndex),
            type = modelField && modelField.type ? modelField.type : null;

        return type;
    },

    isSmartFilterValid: function (field) {
        var value = field.getFilterValue ? field.getFilterValue() : field.getValue();
        if (field.isSmart && Ext.isString(value)) {
            this.selectSmartFilter(this.getFieldType(field), null, value, field);
            return field.lastFilterValue.valid;
        }

        return Ext.isFunction(field.isValid) ? field.isValid() : true;
    },

    smartFilterValue: function (value, dataIndex, record, type, field) {
        var recordValue = record && record.get(dataIndex),
            isEmpty = Ext.isEmpty(value, false);

        if (isEmpty) {
            return true;
        }

        if (!type && (recordValue == null || !Ext.isDefined(recordValue))) {
            return false;
        }

        return this.selectSmartFilter(type, recordValue, value, field);
    },

    selectSmartFilter: function (type, recordValue, value, field) {
        Ext.net.FilterHeader.behaviour.plugin = this;

        if (type == "boolean" || type == "bool" || Ext.isBoolean(recordValue)) {
            return this.smartFilterBoolean(recordValue, value, field);
        }
        else if (type == "date" || Ext.isDate(recordValue)) {
            return this.smartFilterDate(recordValue, value, field);
        }
        else if (type == "int" || type == "float" || Ext.isNumber(recordValue)) {
            return this.smartFilterNumber(recordValue, value, field);
        }
        else /*if (type == "string" || Ext.isString(recordValue))*/ {
            return this.smartFilterString(recordValue, value, field);
        }

        delete Ext.net.FilterHeader.behaviour.plugin;

        return false;
    },

    smartFilterBoolean: function (recordValue, value, field) {
        var v,
            bhv_value,
            bhv;

        if (field.lastFilterValue && field.lastFilterValue.value == value) {
            v = field.lastFilterValue.convertedValue;
            bhv = field.lastFilterValue.behaviour;
        }
        else {
            bhv = Ext.net.FilterHeader.behaviour.getBehaviour("boolean", value);

            if (!bhv) {
                bhv = Ext.net.FilterHeader.behaviour.defaultBooleanBehaviour;
            }

            bhv_value = bhv.getValue(value, field);
            v = { value: bhv_value.value };
            field.lastFilterValue = { value: value, behaviour: bhv, convertedValue: v, valid: bhv_value.valid };
        }

        return field.lastFilterValue.valid ? bhv.match(recordValue, v.value) : true;
    },

    smartFilterDate: function (recordValue, value, field) {
        var v,
            bhv_value,
            bhv;

        if (field.lastFilterValue && field.lastFilterValue.value == value) {
            v = field.lastFilterValue.convertedValue;
            bhv = field.lastFilterValue.behaviour;
        }
        else {
            bhv = Ext.net.FilterHeader.behaviour.getBehaviour("date", value);

            if (!bhv) {
                bhv = Ext.net.FilterHeader.behaviour.defaultDateBehaviour;
            }

            bhv_value = bhv.getValue(value, field);
            v = { value: bhv_value.value };
            field.lastFilterValue = { value: value, behaviour: bhv, convertedValue: v, valid: bhv_value.valid };
        }

        return field.lastFilterValue.valid ? bhv.match(recordValue, v.value) : true;
    },

    smartFilterNumber: function (recordValue, value, field) {
        var v,
            bhv_value,
            bhv;

        if (field.lastFilterValue && field.lastFilterValue.value == value) {
            v = field.lastFilterValue.convertedValue;
            bhv = field.lastFilterValue.behaviour;
        }
        else {
            bhv = Ext.net.FilterHeader.behaviour.getBehaviour("numeric", value);

            if (!bhv) {
                bhv = Ext.net.FilterHeader.behaviour.defaultNumericBehaviour;
            }

            bhv_value = bhv.getValue(value, field);
            v = { value: bhv_value.value };
            field.lastFilterValue = { value: value, behaviour: bhv, convertedValue: v, valid: bhv_value.valid };
        }

        return field.lastFilterValue.valid ? bhv.match(recordValue, v.value) : true;
    },

    smartFilterString: function (recordValue, value, field) {
        var v,
            bhv_value,
            bhv;

        if (field.lastFilterValue && field.lastFilterValue.value == value) {
            v = field.lastFilterValue.convertedValue;
            bhv = field.lastFilterValue.behaviour;
        }
        else {
            bhv = Ext.net.FilterHeader.behaviour.getBehaviour("string", value);

            if (!bhv) {
                bhv = Ext.net.FilterHeader.behaviour.defaultStringBehaviour;
            }

            bhv_value = bhv.getValue(value, field);
            v = { value: bhv_value.value };
            field.lastFilterValue = { value: value, behaviour: bhv, convertedValue: v, valid: bhv_value.valid };
        }

        if (Ext.isEmpty(v.value, false)) {
            return true;
        }

        recordValue = recordValue && Ext.net.FilterHeader.behaviour.getStrValue(recordValue);
        return field.lastFilterValue.valid ? bhv.match(recordValue, v.value) : true;
    }
}, function () {
    this.behaviour.defaultStringBehaviour = this.behaviour.string[0];
    this.behaviour.defaultNumericBehaviour = this.behaviour.numeric[0];
    this.behaviour.defaultDateBehaviour = this.behaviour.date[0];
    this.behaviour.defaultBooleanBehaviour = this.behaviour.boolean[0];
});