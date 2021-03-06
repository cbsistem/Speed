﻿Ext.define('Ext.net.InputMask', {
    extend: 'Ext.AbstractPlugin', 
    alias: 'plugin.inputmask',

    defaultMaskSymbols: {
		"9": "[0-9]",
		"a": "[A-Za-z]",
		"*": "[A-Za-z0-9]"     
	},

    placeholder : "_",
    alwaysShow : false,
    clearWhenInvalid : true,
    allowInvalid : false,
    invalidMaskText : "",
    unmaskOnBlur : false,

    init : function(field) {
        this.callParent(arguments);

        this.ignoreChange = 0;
        this.maskSymbols = Ext.applyIf(this.maskSymbols || {}, this.defaultMaskSymbols);
        this.removeEmptyMaskSymbols();
        
        this.enable();                
    },

    enable : function () {
        this.callParent(arguments);

        var field = this.getCmp();

        field.blur();

        field.inputMask = this;
        field.enableKeyEvents = true;
                
        if(field.rendered){
            field.mon(field.inputEl, {
                scope: field,
                keyup: field.onKeyUp,
                keydown: field.onKeyDown,
                keypress: field.onKeyPress
            });
        }

       this.clearInitError();
        
        field.on("focus", this.onFocus, this);
        field.on("blur", this.onBlur, this);
        field.on("keydown", this.onKeyDown, this);
        field.on("keypress", this.onKeyPress, this);
        field.on("change", this.checkEmptyField, this);

        if(this.rendered){
            this.initPasteEvent();            
        }
        else{
            field.on("afterrender", this.initPasteEvent, this, {single : true});            
        }

        if(!this.allowInvalid) {
            this.fieldGetErrors = field.getErrors;
            field.getErrors = Ext.Function.bind(this.getErrors, this);
        }
                
        this.setMask(this.mask);
    },

    checkEmptyField : function (field, newValue, oldValue) {
        if(this.unmasked || this.ignoreChange){
            return;
        }

        if (Ext.isEmpty(newValue)) {
            this.clearBuffer(0, this.maskLength);
			if(field.hasFocus || (!field.hasFocus && this.alwaysShow)){
                this.writeBuffer();
            }
            if (field.hasFocus) {
                this.moveCaret(0);
            }
        }
    },

    disable : function () {
        this.callParent(arguments);

        var field = this.getCmp();

        field.blur();

        this.unmask();

        delete field.inputMask;

        if (this.originBeginLayout) {
            field.getComponentLayout().beginLayout = this.originBeginLayout;
        }

        if(field.rendered){
            field.mun(field.inputEl, {
                scope: field,
                keyup: field.onKeyUp,
                keydown: field.onKeyDown,
                keypress: field.onKeyPress
            });
        }

        field.un("focus", this.onFocus, this);
        field.un("blur", this.onBlur, this);
        field.un("keydown", this.onKeyDown, this);
        field.un("keypress", this.onKeyPress, this);   

        if(this.rendered){
            this.getCmp().inputEl.un((Ext.isIE ? "paste" : "input"), this.pasteHandler, this);
        }
        else{
            field.un("afterrender", this.initPasteEvent, this);            
        }

        if(this.fieldGetErrors) {
            field.getErrors = this.fieldGetErrors;
        }
    },

    clearInitError : function () {
        var me = this,
            field = me.getCmp(),
            layout = field.getComponentLayout(),
            originFn = layout.beginLayout;

        this.originBeginLayout = originFn;

        if (!field.preventMark) {
            field.preventMark = true;
            me.clearPreventMark = true;

            layout.beginLayout = function (ownerContext) {
                if(me.clearPreventMark) {
                   field.preventMark = false;    
                   originFn.call(layout, ownerContext);
                   field.preventMark = true;  
                }
                else{
                    originFn.call(layout, ownerContext);
                }
            };
        }
    },

    getErrors : function () {
        var field = this.getCmp(),
            errors = this.fieldGetErrors.call(field, field.processRawValue(field.getRawValue()));

        if(!this.isValueValid()){
            errors.push(this.invalidMaskText || field.invalidText);
        }

        return errors;
    },

    initPasteEvent : function () {
        this.getCmp().inputEl.on((Ext.isIE ? "paste" : "input"), this.pasteHandler, this, {delay:1});
    },

    pasteHandler : function (){
        if(this.unmasked){
            return;
        }
        var pos = this.validateMask(true);
        this.getCmp().selectText(pos, pos);
    },

    onFocus : function (field) {
        if (this.clearPreventMark) {
            Ext.Function.defer(function(){
                this.getCmp().preventMark = false;
                delete this.clearPreventMark;
            }, 1, this);            
        }

        if(this.unmaskOnBlur){
            this.setMask(this.mask);
        }

        if(this.unmasked){
            return;
        }

        if(!this.alwaysShow) {
            this.focusText = field.getValue();
			var pos = this.validateMask();
			this.writeBuffer();
				
            if(Ext.isIE) {
                this.moveCaret(pos);
            }
            else{
                Ext.Function.defer(this.moveCaret, 1, this, [pos]);
            }				
        }        
    },

    onBlur : function () {
        if(this.unmasked){
            return;
        }

        if(!this.alwaysShow) {
            this.validateMask();
        }
        else if(this.clearWhenInvalid && !this.isValueValid()){
            this.ignoreChange++;
            this.getCmp().setValue("");
			this.clearBuffer(0, this.maskLength);
			this.writeBuffer();
            this.ignoreChange--;
        }

        if(this.unmaskOnBlur){
            if(!this.isValueValid()){
                this.unmasked = true;                
                this.ignoreChange++;
                this.getCmp().setValue("");
			    this.clearBuffer(0, this.maskLength);
			    if(this.alwaysShow){
                   this.writeBuffer();
                }
                this.ignoreChange--;
            }
            else{
                this.unmask();
            }
        }
    },

    moveCaret : function (pos) {
        this.getCmp().selectText(pos == this.mask.length ? 0 : pos, pos);
    },

    removeEmptyMaskSymbols : function () {
        Ext.Object.each(this.maskSymbols, function(key, value){
            if(Ext.isEmpty(value)){
                delete this.maskSymbols[key];
            }
        });
    },

    setMask : function (mask) {
        var field = this.getCmp();

        this.unmasked = false;
			    
        this.mask = mask;
        this.regexes = [];
        this.placeholders = [];
		this.requiredPartEnd = mask.length;
		this.maskStart = null;
		this.maskLength = mask.length;
        this.focusText = field.getValue();

		Ext.each(mask.split(""), function(char, index) {
			if (char == '?') {
				this.maskLength--;
				this.requiredPartEnd = index;
			} else if (this.maskSymbols[char]) {
				this.regexes.push(new RegExp(this.maskSymbols[char].regex || this.maskSymbols[char]));
                this.placeholders.push(this.maskSymbols[char].placeholder || this.placeholder);
					    
                if(this.maskStart == null) {
					this.maskStart =  this.regexes.length - 1;
                }
			} else {
				this.regexes.push(null);
                this.placeholders.push(null);
			}
		}, this);     

        this.buffer = [];
                
        var i = 0,
            char,
            array = this.mask.split(""),
            len = array.length;

        for (; i < len; i++) {                    
            char = array[i];
            if (char != "?") {
                this.buffer.push(this.maskSymbols[char] ? (this.maskSymbols[char].placeholder || this.placeholder) : char) 
            }
        }

        this.validateMask();
        if(this.alwaysShow) {
            this.writeBuffer();
        }
    },

    getSelectedRange : function () {
        var caretPos = 0,
            field = this.getCmp(),
            dom = field.inputEl.dom,
            sel;
                
        if (document.selection) {
            var start = 0, 
                end = 0, 
                normalizedValue, 
                textInputRange, 
                len, 
                endRange,
                range = document.selection.createRange();

            if (range && range.parentElement() == dom) {
                len = dom.value.length;

                normalizedValue = dom.value.replace(/\r\n/g, "\n");
                textInputRange = dom.createTextRange();
                textInputRange.moveToBookmark(range.getBookmark());
                endRange = dom.createTextRange();
                endRange.collapse(false);
                if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                    start = end = len;
                } else {
                    start = -textInputRange.moveStart("character", -len);
                    start += normalizedValue.slice(0, start).split("\n").length - 1;
                    if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                        end = len;
                    } else {
                        end = -textInputRange.moveEnd("character", -len);
                        end += normalizedValue.slice(0, end).split("\n").length - 1;
                    }
                }
            }

            caretPos = {                    
                begin : start,
                end : end
            };
        }                
        else if (dom.selectionStart || dom.selectionStart == '0') {
            caretPos = {                    
                begin : dom.selectionStart,
                end : dom.selectionEnd
            };
        }

        return caretPos;
    },


    seekNext : function (pos) {
		while (++pos <= this.maskLength && !this.regexes[pos]);
		return pos;
	},

	seekPrev : function (pos) {
		while (--pos >= 0 && !this.regexes[pos]);
		return pos;
	},

	shiftL : function (begin,end) {
		if(begin<0) {
			return;
        }

		for (var i = begin, j = this.seekNext(end); i < this.maskLength; i++) {
			if (this.regexes[i]) {
				if (j < this.maskLength && this.regexes[i].test(this.buffer[j])) {
					this.buffer[i] = this.buffer[j];
					this.buffer[j] = this.placeholders[j] || this.placeholder;
				} else {
					break;
                }
				j = this.seekNext(j);
			}
		}

		this.writeBuffer();
		this.getCmp().selectText(Math.max(this.maskStart, begin), Math.max(this.maskStart, begin));
	},

	shiftR : function (pos) {
		for (var i = pos, c = this.placeholder; i < this.maskLength; i++) {
			if (this.regexes[i]) {
				var j = this.seekNext(i),
					t = this.buffer[i];

				this.buffer[i] = c;
				if (j < this.maskLength && this.regexes[j].test(t)){
					c = t;
				} else {
					break;
                }
			}
		}
	},

    onKeyDown : function (field, e) {
		if(this.unmasked){
            return;
        }

        var key = e.getKey();
				
		if (key == e.BACKSPACE || key == e.DELETE) {
			var pos = this.getSelectedRange(),
				begin = pos.begin,
				end = pos.end;

			if (end-begin == 0) {
				begin = key != e.DELETE ? this.seekPrev(begin) : (end = this.seekNext(begin-1));
				end = key == e.DELETE ? this.seekNext(end) : end;
			}

			this.clearBuffer(begin, end);
			this.shiftL(begin, end-1);
            e.stopEvent(); 
			return false;
		} else if (key == e.ESC) {
			field.setValue(this.focusText);
			field.selectText(0, this.validateMask());
            e.stopEvent(); 
			return false;
		}
	},

	onKeyPress : function (field, e) {				        
        if (e.ctrlKey && !e.altKey || this.unmasked) {
            return;
        }

        var key = e.getKey(),
            charCode = String.fromCharCode(e.getCharCode()),
            p,
            next,
            pos = this.getSelectedRange();

        if((Ext.isGecko || Ext.isOpera) && (e.isNavKeyPress() || key === e.BACKSPACE || (key === e.DELETE && e.button === -1))){
            return;
        }

        if((!Ext.isGecko && !Ext.isOpera) && e.isSpecialKey() && !charCode){
            return;
        } 

        if (key < 32) {
            return;
        }

		if (key) {
			if(pos.end - pos.begin != 0 ){
				this.clearBuffer(pos.begin, pos.end);
				this.shiftL(pos.begin, pos.end - 1);
			}

			p = this.seekNext(pos.begin - 1);
			if (p < this.maskLength) {						
				if (this.regexes[p].test(charCode)) {
					this.shiftR(p);
					this.buffer[p] = charCode;
					this.writeBuffer();
					next = this.seekNext(p);
                    field.selectText(next, next);
					//if (next >= this.maskLength) {								                                
                    //}
				}
			}
            e.stopEvent();
			return false;
		}
	},

    clearBuffer : function (start, end) {
		for (var i = start; i < end && i < this.maskLength; i++) {
			if (this.regexes[i]) {
				this.buffer[i] = this.placeholders[i];
            }
		}
	},

	writeBuffer : function () { 
        this.getCmp().setValue(this.buffer.join('')); 
        return this.getCmp().getValue();
    },

    isValueValid : function () {                
        var value = this.getCmp().getValue(),
			valid = true,
            lastMatch = -1,
            i,
            c,
            pos;

		for (i = 0, pos = 0; i < this.maskLength; i++) {
			if (this.regexes[i]) {
						
                while (pos++ < this.regexes.length) {
					c = value.charAt(pos - 1);
					if (this.regexes[i].test(c)) {
						lastMatch = i;
						break;
					}
				}

				if (pos > value.length) {
					break;
                }
			} else if (this.buffer[i] == value.charAt(pos) && i != this.requiredPartEnd) {
				pos++;
				lastMatch = i;
			}
		}

        if ((lastMatch + 1) < this.requiredPartEnd) {
			valid = false;                    
		}

		return valid;
    },

    validateMask : function (allow) {				
		var value = this.getCmp().getValue(),
			lastMatch = -1,
            i,
            c,
            pos;

		for (i = 0, pos = 0; i < this.maskLength; i++) {
			if (this.regexes[i]) {
				this.buffer[i] = this.placeholders[i];
						
                while (pos++ < this.regexes.length) {
					c = value.charAt(pos - 1);
					if (this.regexes[i].test(c)) {
						this.buffer[i] = c;
						lastMatch = i;
						break;
					}
				}

				if (pos > value.length) {
					break;
                }
			} else if (this.buffer[i] == value.charAt(pos) && i != this.requiredPartEnd) {
				pos++;
				lastMatch = i;
			}
		}

		if (!allow && (lastMatch + 1) < this.requiredPartEnd) {
			if(!this.alwaysShow) {
                this.ignoreChange++;
                this.getCmp().setValue("");
				this.clearBuffer(0, this.maskLength);
                this.ignoreChange--;
            }                    
		} else if (allow || lastMatch + 1 >= this.requiredPartEnd) {
			this.writeBuffer();
			if (!allow) {
                this.getCmp().setValue(this.getCmp().getValue().substring(0, lastMatch + 1));                        
            }
		}
		return (this.requiredPartEnd ? i : this.maskStart);
	},

    getUnmaskedValue : function () {        
        var i,
            c,
            placeholder,
            value = this.getCmp().getValue(),
            uValue = [];

        for (i = 0; i < this.maskLength; i++) {
			if (this.regexes[i]) {
                c = value.charAt(i);
                placeholder = this.placeholders[i];
                if(c && c != placeholder){
                    uValue.push(c);
                }
            }
        }

        return uValue.join("");
    },

    unmask : function () {
        this.unmasked = true;        
        this.getCmp().setValue(this.getUnmaskedValue());
    }
});