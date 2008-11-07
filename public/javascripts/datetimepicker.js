var datePickerController;

(function(){
	
	// Defaults should the locale file not load
	datePicker.months       = ["January","February","March","April","May","June","July","August","September","October","November","December"];
	datePicker.fullDay      = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
	datePicker.titles       = ["Previous month","Next month","Previous year","Next year", "Today", "Show Calendar"];
	
	function datePicker(options) {
		this.defaults						= {};
		for(opt in options) { this[opt] = this.defaults[opt] = options[opt]; };
		
		this.date								= new Date();
		this.timer							= 1;
		this.pause							= 1000;
		this.timerSet						= false;
		this.fadeTimer					= null;
		this.interval						= new Date();
		this.firstDayOfWeek			= this.defaults.firstDayOfWeek = this.dayInc = this.monthInc = this.yearInc = this.opacity = this.opacityTo = 0;
		this.dateSet						= null;
		this.visible						= false;
		this.disabledDates			= [];
		this.enabledDates				= [];
		this.nbsp								= String.fromCharCode( 160 );
		this.timePicker					= options.timePicker;
		var o = this;
		
		o.events = {
			onblur:function(e) {
				 o.removeKeyboardEvents(); 
			},
			onfocus:function(e) {
				o.addKeyboardEvents();
			},
			onkeydown:function(e) {
				o.stopTimer();
				if(!o.visible) return false;
				
				if(e == null) e = document.parentWindow.event;
				var kc = e.keyCode ? e.keyCode : e.charCode;

				if ( kc == 13 ) {
					// close (return)
					var td = document.getElementById(o.id + '-date-picker-hover');
					if(!td || td.className.search(/out-of-range|day-disabled/) != -1) return o.killEvent(e);
					o.returnFormattedDate();
					o.hide();
					return o.killEvent(e);
				} else if ( kc == 27 ) {
					// close (esc)
					o.hide();
					return o.killEvent(e);
				} else if( kc == 32 || kc == 0 ) {
					// today (space)
					o.date = new Date();
					o.updateTable();
					return o.killEvent(e);
				};
				
				if (( kc > 49 && kc < 56 ) || ( kc > 97 && kc < 104 )) {
					if ( kc > 96 ) kc -= ( 96 - 48 );
					kc -= 49;
					o.firstDayOfWeek = (o.firstDayOfWeek + kc) % 7;
					o.updateTable();
					return o.killEvent(e);
				};
				
				if ( kc < 37 || kc > 40 ) return true;
								
				var d = new Date( o.date ).valueOf();
				if ( kc == 37 ) {
					
					// cltr + left = previous month
					if ( e.ctrlKey ) {
						d = o.date.clone().addMonths(1);
					} else {
						d = o.date.clone().addDays(1);
					};
					
				} else if ( kc == 38 ) {
					// ctrl + up = next year
					if ( e.ctrlKey ) {
						d = o.date.clone().addYears(1);
					} else {
						d = o.date.clone().addWeeks(-1);
					};
				} else if ( kc == 40 ) {
					// ctrl + down = prev year
					if( e.ctrlKey ) {
						d = o.date.clone().addYears(-1);
					} else {
						d = o.date.clone().addWeeks(1);
					};
				};
				
				var tmpDate = new Date(d);
				if(o.outOfRange(tmpDate)) return o.killEvent(e);
				
				var cacheDate = o.date.clone();
				o.date = tmpDate;
				
				if(cacheDate.getFullYear() != o.date.getFullYear() || cacheDate.getMonth() != o.date.getMonth()) {
					o.updateTable();
				} else {
					o.disableTodayButton();
					var tds = o.table.getElementsByTagName('td');
					var txt;
					var start = o.date.getDate() - 6;
					if(start < 0) start = 0;
					
					for(var i = start, td; td = tds[i]; i++) {
						txt = Number(td.firstChild.nodeValue);
						if(isNaN(txt) || txt != o.date.getDate()) continue;
						o.removeHighlight();
						td.id = o.id + "-date-picker-hover";
						td.className = td.className.replace(/date-picker-hover/g, "") + " date-picker-hover";
					};
				};
				return o.killEvent(e);
			},
			gotoToday:function(e){
				o.date = new Date();
				o.updateTable();
				return o.killEvent(e);
			},
			onmousedown:function(e){
				if ( e == null ) e = document.parentWindow.event;
				var el = e.target != null ? e.target : e.srcElement;
				
				var found = false;
				while(el.parentNode) {
					if(el.id && (el.id == "fd-" + o.id || el.id == "fd-but-" + o.id)) {
						found = true
						break;
					};
					try {
						el = el.parentNode;
					} catch(err) {
						break;
					};
				};
				if(found) return true;
				o.stopTimer();
				datePickerController.hideAll();
			},
			onmouseover:function(e){
				o.stopTimer();
				var txt = this.firstChild.nodeValue;
				if(this.className == "out-of-range" || txt.search(/^[\d]+$/) == -1) return;
				
				o.removeHighlight();
				
				this.id = o.id + "-date-picker-hover";
				this.className = this.className.replace(/date-picker-hover/g, "") + " date-picker-hover";
				
				o.date.setDate(this.firstChild.nodeValue);
				o.disableTodayButton();
			},
			onclick:function(e) {
				if(o.opacity != o.opacityTo || this.className.search(/out-of-range|day-disabled/) != -1) return false;
				if( e == null) e = document.parentWindow.event;
				
				var el = e.target != null ? e.target : e.srcElement;
				while( el.nodeType != 1 ) el = el.parentNode;
				var d = new Date( o.date );
				var txt = el.firstChild.data;
				if( txt.search(/^[\d]+$/) == -1 ) return;
				var n = Number( txt );
				if( isNaN(n) ) { return true; };
				d.setDate( n );
				
				if (o.timePicker) {
					var hourSelect = document.getElementById(o.id + '-sel-hr');
					var minuteSelect = document.getElementById(o.id + '-sel-min');
					var meridiemSelect = document.getElementById(o.id + '-sel-meridiem');
					
					var hour = parseInt(hourSelect.options[hourSelect.selectedIndex].value);
					var minute = minuteSelect.options[minuteSelect.selectedIndex].value;
					var meridiem = meridiemSelect.options[meridiemSelect.selectedIndex].value;
					
					if (meridiem == 'pm') hour += 12;
					d.setHours(hour);
					d.setMinutes(minute);
					hourSelect = minuteSelect = meridiemSelect = hour = minute = meridiem = null;
				};
				
				o.date = d;
				o.returnFormattedDate();
				if( !o.staticPos ) o.hide();
				o.stopTimer();
				return o.killEvent(e);
			},
			incDec:function(e) {
				if ( e == null ) e = document.parentWindow.event;
				var el = e.target != null ? e.target : e.srcElement;
				
				if( el && el.className && el.className.search('fd-disabled') != -1 ) return false;
				datePickerController.addEvent(document, "mouseup", o.events.clearTimer);
				o.timerInc		= 800;
				o.dayInc			= arguments[1];
				o.yearInc			= arguments[2];
				o.monthInc		= arguments[3];
				o.timerSet		= true;
				
				o.updateTable();
				return true;
			},
			clearTimer: function(e) {
				o.stopTimer();
				o.timerInc		= 1000;
				o.yearInc			= 0;
				o.monthInc		= 0;
				o.dayInc			= 0;
				datePickerController.removeEvent(document, "mouseup", o.events.clearTimer);
			}
		};
		o.stopTimer = function() {
			o.timerSet = false;
			window.clearTimeout( o.timer );
		};
		o.removeHighlight = function() {
			if( document.getElementById( o.id + "-date-picker-hover" ) ){
				document.getElementById(o.id + "-date-picker-hover").className = document.getElementById(o.id + "-date-picker-hover").className.replace("date-picker-hover", "");
				document.getElementById(o.id + "-date-picker-hover").id = "";
			};
		};
		o.reset = function() {
			for(def in o.defaults) { o[def] = o.defaults[def]; };
		};
		o.setOpacity = function(op) {
			o.div.style.opacity = op/100;
			o.div.style.filter = 'alpha(opacity=' + op + ')';
			o.opacity = op;
		};
		o.fade = function() {
			window.clearTimeout(o.fadeTimer);
			o.fadeTimer = null;
			delete(o.fadeTimer);
			
			var diff = Math.round( o.opacity + ((o.opacityTo - o.opacity) / 4) );
			o.setOpacity(diff);
			
			if( Math.abs( o.opacityTo - diff ) > 3 && !o.noTransparency ) {
				o.fadeTimer = window.setTimeout( o.fade, 50 );
			} else {
				o.setOpacity( o.opacityTo );
				if( o.opacityTo == 0 ) {
					o.div.style.display = "none";
					o.visible = false;
				} else {
					o.visible = true;
				};
			};
		};
		o.killEvent = function(e) {
			e = e || document.parentWindow.event;
			
			if( e.stopPropagation ) {
				e.stopPropagation();
				e.preventDefault();
			};
			
			return false;
		};
		o.getElem = function() {
			return document.getElementById(o.id.replace(/^fd-/, '')) || false;
		};
		o.setRangeLow = function(range) {
			if(String(range).search(/^(\d\d?\d\d)(0[1-9]|1[012])(0[1-9]|[12][0-9]|3[01])$/) == -1) range = '';
			o.low = o.defaults.low = range;
			if(o.staticPos) o.updateTable(true);
		};
		o.setRangeHigh = function(range) {
			if(String(range).search(/^(\d\d?\d\d)(0[1-9]|1[012])(0[1-9]|[12][0-9]|3[01])$/) == -1) range = '';
			o.high = o.defaults.high = range;
			if(o.staticPos) o.updateTable(true);
		};
		o.setDisabledDays = function(dayArray) {
			o.disabledDays = o.defaults.disabledDays = dayArray;
			if(o.staticPos) o.updateTable(true);
		};
		o.setDisabledDates = function(dateArray) {
			var fin = [];
			for(var i = dateArray.length; i--;) {
				if(dateArray[i].match(/^(\d\d\d\d|\*\*\*\*)(0[1-9]|1[012]|\*\*)(0[1-9]|[12][0-9]|3[01])$/) == -1) fin[fin.length] = dateArray[i];
			};
			if(fin.length) {
				o.disabledDates = fin;
				o.enabledDates = [];
				if(o.staticPos) o.updateTable(true);
			};
		};
		o.getDisabledDates = function(y, m) {
			if(o.enabledDates.length) return o.getEnabledDates(y, m);
			var obj = {};
			var d = Date.getDaysInMonth(y, m - 1);
			m = m < 10 ? "0" + String(m) : m;
			for(var i = 0; i < o.disabledDates.length; i++) {
				var tmp = o.disabledDates[i].replace("****", y).replace("**", m);
				if(tmp < Number(String(y) + m + "01") || tmp > Number(y + String(m) + d)) continue;
				obj[tmp] = 1;
			};
			return obj;
		};
		o.getEnabledDates = function(y, m) {
			var obj = {};
			var d = Date.getDaysInMonth(y, m - 1);
			m = m < 10 ? "0" + String(m) : m;
			var day, tmp, de, me, ye, disabled;
			for(var dd = 1; dd <= d; dd++) {
				day = dd < 10 ? "0" + String(dd) : dd;
				disabled = true;
				for(var i = o.enabledDates.length; i-- ;) {
					tmp = o.enabledDates[i];
					ye = String(o.enabledDates[i]).substr(0, 4);
					me = String(o.enabledDates[i]).substr(4, 2);
					de = String(o.enabledDates[i]).substr(6, 2);
					
					if(ye == y && me == m && de == day) {
						disabled = false;
						break;
					}
					
					if(ye == "****" || me == "**" || de == "**") {
						if(ye == "****") tmp = tmp.replace(/^\*\*\*\*/, y);
						if(me == "**") tmp = tmp = tmp.substr(0, 4) + String(m) + tmp.substr(6, 2);
						if(de == "**") tmp = tmp.replace(/\*\*/, day);
						
						if(tmp == String(y + String(m) + day)) {
							disabled = false;
							break;
						};
					};
				};
				if(disabled) obj[String(y + String(m) + day)] = 1;
			};
			return obj;
		};
		o.setFirstDayOfWeek = function(e) {
			if ( e == null ) e = document.parentWindow.event;
			var elem = e.target != null ? e.target : e.srcElement;
			if(elem.tagName.toLowerCase() != "th") {
				while(elem.tagName.toLowerCase() != "th") elem = elem.parentNode;
			};
			var cnt = 0;
			while(elem.previousSibling) {
				elem = elem.previousSibling;
				if(elem.tagName.toLowerCase() == "th") cnt++;
			};
			o.firstDayOfWeek = (o.firstDayOfWeek + cnt) % 7;
			o.updateTableHeaders();
			return o.killEvent(e);
		};
		o.truePosition = function(element) {
			var pos = o.cumulativeOffset(element);
			if(window.opera) { return pos; }
			var iebody = (document.compatMode && document.compatMode != "BackCompat") ? document.documentElement : document.body;
			var dsocleft = document.all ? iebody.scrollLeft : window.pageXOffset;
			var dsoctop  = document.all ? iebody.scrollTop : window.pageYOffset;
			var posReal	 = o.realOffset(element);
			return [pos[0] - posReal[0] + dsocleft, pos[1] - posReal[1] + dsoctop];
		};
		o.realOffset = function(element) {
			var t = 0; l = 0;
			do {
				t += element.scrollTop || 0;
				l += element.scrollLeft || 0;
				element = element.parentNode;
			} while (element);
			return [l, t];
		};
		o.cumulativeOffset = function(element) {
			var t = 0, l = 0;
			do {
				t += element.offsetTop  || 0;
				l += element.offsetLeft || 0;
				element = element.offsetParent;
			} while(element);
			return [l, t];
		};
		o.resize = function() {
			if (!o.created || !o.getElem()) return;
			
			o.div.style.visibility = "hidden";
			if(!o.staticPos) { o.div.style.left = o.div.style.top = "0px"; }
			o.div.style.display = "block";
			
			var osh = o.div.offsetHeight;
			var osw = o.div.offsetWidth;
			
			o.div.style.visibility = "visible";
			o.div.style.display = "none";
			
			if(!o.staticPos) {
				var elem = document.getElementById('fd-but-' + o.id);
				var pos = o.truePosition(elem);
				var trueBody = (document.compatMode && document.compatMode != "BackCompat") ? document.documentElement : document.body;
				var scrollTop = window.devicePixelRatio || window.opera ? 0 : trueBody.scrollTop;
				var scrollLeft = window.devicePixelRatio || window.opera ? 0 : trueBody.scrollLeft;
				
				if(parseInt(trueBody.clientWidth + scrollLeft) < parseInt(osw + pos[0])) {
					o.div.style.left = Math.abs(parseInt((trueBody.clientWidth + scrollLeft) - osw)) + "px";
				} else {
					o.div.style.left = pos[0] + "px";
				};
				
				if(parseInt(trueBody.clientHeight + scrollTop) < parseInt(osh + pos[1] + elem.offsetHeight + 2)) {
					o.div.style.top = Math.abs(parseInt(pos[1] - (osh + 2))) + "px";
				} else {
					o.div.style.top = Math.abs(parseInt(pos[1] + elem.offsetHeight + 2)) + "px";
				};
			};
		};
		o.equaliseDates = function() {
			var clearDayFound = false;
			var tmpDate;
			for(var i = o.low; i <= o.high; i++) {
				tmpDate = String(i);
				if(!o.disableDays[new Date(tmpDate.substr(0, 4), tmpDate.substr(6, 2), tmPdate.substr(4, 2)).getDay - 1]) {
					clearDayFound = true;
					break;
				};
			};
			if(!clearDayFound) o.disableDays = o.defaults.disableDays = [0, 0, 0, 0, 0, 0, 0];
		};
		o.outOfRange = function(tmpDate) {
			if(!o.low && !o.high) return false;
			
			var level = false;
			if(!tmpDate) {
				level = true;
				tmpDate = o.date;
			};
			
			var d = tmpDate.toString('dd');
			var m = tmpDate.toString('MM');
			var y = tmpDate.toString('YYYY');
			
			var dt = String(y) + String(m) + String(d);
			
			if(o.low && parseInt(dt) < parseInt(o.low)) {
				if(!level) return true;
				o.date = new Date(o.low);
				return false;
			};
			if(o.high && parseInt(dt) > parseInt(o.high)) {
				if(!level) return true;
				o.date = new Date(o.high);
			};
			return false;
		};
		o.createButton = function() {
			if(o.staticPos) { return true; };
			
			var but;
			
			if(!document.getElementById('fd-but-' + o.id)) {
				var inp = o.getElem();
				
				but = document.createElement('a');
				but.href = "#";
				
				var span = document.createElement('span');
				span.appendChild(document.createTextNode(String.fromCharCode( 160 )));
				
				but.className = "date-picker-control";
				but.title = (typeof(fdLocale) == "object" && options.locale && fdLocale.titles.length > 5) ? fdLocale.titles[5] : "";
				
				but.id = "fd-but-" + o.id;
				but.appendChild(span);
				
				if(inp.nextSibling) {
					inp.parentNode.insertBefore(but, inp.nextSibling);
				} else {
					inp.parentNode.appendChild(but);
				};
			} else {
				but = document.getElementById('fd-but' + o.id);
			};
			
			but.onclick = but.onpress = function(e) {
				e = e || window.event;
				var inpId = this.id.replace('fd-but-', '');
				try { var dp = datePickerController.getDatePicker(inpId); } catch(err) { return false; };
				
				if(e.type == "press") {
					var kc = e.keyCode != null ? e.keyCode : e.charCode;
					if(kc != 13) { return true; };
					if(dp.visible) {
						hideAll();
						return false;
					};
				};
				
				if(!dp.visible) {
					datePickerController.hideAll(inpId);
					dp.show();
				} else {
					datePickerController.hideAll();
				};
				return false;
			};
			but = null;
		},
		o.create = function() {
			function createTH(details) {
				var th = document.createElement('th');
				if(details.thClassName) th.className = details.thClassName;
				if(details.colspan) {
					th.setAttribute('colspan', details.colspan);
				};
				return th;
			};
			
			function createThAndButton(tr, obj) {
				for(var i = 0, details; details = obj[i]; i++) {
					var th = createTH(details);
					tr.appendChild(th);
					var but = document.createElement('span');
					but.className = details.className;
					but.id = o.id + details.id;
					but.appendChild(document.createTextNode(details.text));
					but.title = details.title || "";
					if(details.onmousedown) but.onmousedown = details.onmousedown;
					if(details.onclick) but.onclick = details.onclick;
					if(details.onmouseout) but.onmouseout = details.onmouseout;
					th.appendChild(but);
				};
			};
			
			if(typeof(fdLocale) == "object" && o.locale) {
				datePicker.titles = fdLocale.titles;
				datePicker.months = fdLocale.months;
				datePicker.fullDay = fdLocale.fullDay;
				if(fdLocale.dayAbbr) datePicker.dayAbbr = fdLocale.dayAbbr;
				if(fdLocale.firstDayOfWeek) o.firstDayOfWeek = o.defaults.firstDayOfWeek = fdLocale.firstDayOfWeek;
			};
			
			o.div = document.createElement('div');
			o.div.style.zIndex = 9999;
			o.div.id = "fd-" + o.id;
			o.div.className = "datePicker";
			
			if(!o.staticPos) {
				document.getElementsByTagName('body')[0].appendChild(o.div);
			} else {
				elem = o.getElem();
				if(!elem) {
					o.div = null;
					return;
				};
				o.div.className += " staticDP";
				o.div.setAttribute("tabIndex", "0");
				o.div.onfocus = o.events.onfocus;
				o.div.onblur = o.events.onblur;
				elem.parentNode.insertBefore(o.div, elem.nextSibling);
				if(o.hideInput && elem.type && elem.type == "text") elem.setAttribute("type", "hidden");
			};
			
			var tr, row, col, tableHead, tableBody;
			o.table = document.createElement('table');
			o.div.appendChild( o.table );
			
			tableHead = document.createElement('thead');
			o.table.appendChild( tableHead );
			
			tr = document.createElement('tr');
			tableHead.appendChild(tr);
			
			o.titleBar = createTH({thClassName:"date-picker-title", colspan:7});
			tr.appendChild( o.titleBar );
			tr = null;
			
			var span = document.createElement('span');
			span.className = "month-display";
			o.titleBar.appendChild(span);
			
			span = document.createElement('span');
			span.className = "year-display";
			o.titleBar.appendChild(span);
			
			span = null;
			
			tr = document.createElement('tr');
			tableHead.appendChild(tr);
			
			createThAndButton(tr, [{className: "prev-but", id: "-prev-year-but", text:"\u00AB", title:datePicker.titles[2], onmousedown:function(e) { o.events.incDec(e, 0, -1, 0); }, onmouseout:o.events.clearTimer }, {className:"prev-but", id:"-prev-month-but", text:"\u2039", title:datePicker.titles[0], onmousedown:function(e) { o.events.incDec(e, 0, 0, -1); }, onmouseout:o.events.clearTimer }, {colspan: 3, className: "today-but", id:"-today-but", text:datePicker.titles.length > 4 ? datePicker.titles[4] : "Today", onclick:o.events.gotoToday}, {className:"next-but", id:"-next-month-but", text: "\u203A", title:datePicker.titles[1], onmousedown:function(e) { o.events.incDec(e,0,0,1); }, onmouseout:o.events.clearTimer }, {className:"next-but", id:"-next-year-but", text:"\u00BB", title:datePicker.titles[3], onmousedown:function(e) { o.events.incDec(e,0,1,0); }, onmouseout:o.events.clearTimer }]);
			
			tableBody = document.createElement('tbody');
			o.table.appendChild( tableBody );
			
			for(var rows = 0; rows < 7; rows++) {
				row = document.createElement('tr');
				
				if(rows != 0) tableBody.appendChild(row);
				else					tableHead.appendChild(row);
				
				for(var cols = 0; cols < 7; cols++) {
					col = (rows == 0) ? document.createElement('th') : document.createElement('td');
					row.appendChild(col);
					if(rows != 0) {
						col.appendChild(document.createTextNode(o.nbsp));
						col.onmouseover = o.events.onmouseover;
						col.onclick = o.events.onclick;
					} else {
						col.className = "date-picker-day-header";
						col.scope = "col";
					};
					col = null;
				};
				row = null;
			};
			
			// table headers
			var but;
			var ths = o.table.getElementsByTagName('thead')[0].getElementsByTagName('tr')[2].getElementsByTagName('th');
			for(var y = 0; y < 7; y++ ) {
				if( y > 0 ) {
					but = document.createElement('span');
					but.className = "fd-day-header";
					but.onclick = ths[y].onclick = o.setFirstDayOfWeek;
					but.appendChild(document.createTextNode(o.nbsp));
					ths[y].appendChild(but);
					but = null;
				} else {
					ths[y].appendChild(document.createTextNode(o.nbsp));
				};
			};
			
			// add timepicker
			if (o.timePicker) {
				var row = document.createElement('tr');
				var col = document.createElement('td');
						col.setAttribute('colspan', 7);

				var selectHour = document.createElement('select');
						selectHour.id = o.id + '-sel-hr';
						for( var i = 1; i < 13; i++ ) {
							optionTag = document.createElement('option');
							optionTag.innerHTML = optionTag.value = i;
							if(o.date.getHours() == i) {
								optionTag.selected = true;
							};
							selectHour.appendChild(optionTag);
							optionTag = null;
						};
				col.appendChild(selectHour);
				col.appendChild(document.createTextNode(o.nbsp + o.nbsp));

				var selectMinute = document.createElement('select');
						selectMinute.id = o.id + '-sel-min';
						for( var i = 0; i < 60; i++ ){
							optionTag = document.createElement('option');
							optionTag.value = i;
							optionTag.innerHTML = (o.date.getMinutes() < 10 ? "0" + o.date.getMinutes() : o.date.getMinutes());
							if (o.date.getMinutes() == i) {
								optionTag.selected = true;
							};
							selectMinute.appendChild(optionTag);
							optionTag = null;
						};
				col.appendChild(selectMinute);
				col.appendChild(document.createTextNode(o.nbsp + o.nbsp));

				var meridiems = [ 'am', 'pm' ];
				var selectMeridiem = document.createElement('select');
						selectMeridiem.id = o.id + '-sel-meridiem';
						for (var i = 0; i < 2; i++) {
							optionTag = document.createElement('option');
							optionTag.value = optionTag.innerHTML = meridiems[i];
							if (o.date.getHours() < 12 && meridiems[i] == 'am') {
								optionTag.selected = true;
							};
							if (o.date.getHours() >= 12 && meridiems[i] == 'pm') {
								optionTag.selected = true;
							};
							selectMeridiem.appendChild(optionTag);
							optionTag = null;
						};
				col.appendChild(selectMeridiem);
				row.appendChild(col);
				tableBody.appendChild(row);

				row = col = selectHour = selectMinute = selectMeridiems = meridiems = null;
			};
			
			o.ths = o.table.getElementsByTagName('thead')[0].getElementsByTagName('tr')[2].getElementsByTagName('th');
			o.trs = o.table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
			
			o.updateTableHeaders();
			
			tableBody = tableHead = tr = createThAndButton = createTH = null;
			
			if(o.low && o.high && (o.high - o.low < 7)) { o.equaliseDates(); };
			o.created = true;
			if( o.staticPos ) {
				var yyN = document.getElementById(o.id);
				datePickerController.addEvent(yyN, "change", o.changeHandler);
				o.show();
			} else {
				o.createButton();
				o.resize();
				o.fade();
			};
		};
		o.changeHandler = function() {
			o.setDateFromInput();
			o.updateTable();
		};
		o.setDateFromInput = function() {
			o.dateSet = null;
			
			var elem = o.getElem();
			if(!elem) return;
			
			var date = Date.parse(elem.value);
			var today = new Date();
			
			if(o.timePicker && date.getMinutes() == 0 && date.getHours() == 0 && today.getHours() != 0) {
				date.setHours(today.getHours());
				date.setMinutes(today.getMinutes());
			};
			
			var badDate = false;
			if(!date) {
				badDate = true;
				date = new Date();
			};
			
			o.date = date;
		};
		o.setSelectIndex = function(elem, index) {
			var len = elem.options.length;
			index = Number(index);
			for(var opt = 0; opt < len; opt++) {
				if(elem.options[opt].value == index) {
					elem.selectedIndex = opt;
					return;
				};
			};
		},
		o.returnFormattedDate = function() {
			var elem = o.getElem();
			if(!elem) return;
			
			var dd							= o.date
			var yyyy  					= o.date.getFullYear();
			var mm							= o.date.toString("MM");
			var disabledDates		= o.getDisabledDates(yyyy, mm);
			var weekDay					= ( o.date.getDay() + 6 ) % 7;
			
			if(!(o.disableDays[weekDay] || String(yyyy) + o.date.getMonth() + o.date.getDay() in disabledDates)) {
				// FIXME
				if (o.timePicker) {
					elem.value = o.date.toString('dddd MMMM d, yyyy h:mm tt');
				} else {
					elem.value = o.date.toString('dddd MMMM d, yyyy');
				};

				if (!elem.type || elem.type && elem.type != "hidden") { elem.focus(); }
				if(o.staticPos) {
					o.dateSate = new Date( o.date );
					o.updateTable();
				};
				
				if(document.createEvent) {
					var onchangeEvent = document.createEvent('HTMLEvents');
					onchangeEvent.initEvent('change', true, false);
					elem.dispatchEvent(onchangeEvent);
				} else if(document.createEventObject) {
					elem.fireEvent('onchange');
				};
			};
		};
		o.disableTodayButton = function() {
			var today = new Date();
			document.getElementById(o.id + "-today-but").className = document.getElementById(o.id + "-today-but").className.replace("fd-disabled", "");
			if(o.outOfRange(today) || (o.date.getDate() == today.getDate() && o.date.getMonth() == today.getMonth() && o.date.getFullYear() == today.getFullYear())) {
				document.getElementById(o.id + "-today-but").className += " fd-disabled";
				document.getElementById(o.id + "-today-but").onclick = null;
			} else {
				document.getElementById(o.id + "-today-but").onclick = o.events.gotoToday;
			};
		};
		o.updateTableHeaders = function() {	
			var d, but;
			var ths = o.ths;
			for ( var y = 0; y < 7; y++ ) {
				d = (o.firstDayOfWeek + y) % 7;
				ths[y].title = d;		// FIXME
				
				if ( y > 0 ) {
					but = ths[y].getElementsByTagName("span")[0];
					but.removeChild(but.firstChild);
					but.appendChild(document.createTextNode(datePicker.dayAbbr ? datePicker.dayAbbr[d] : datePicker.fullDay[d].charAt(0)));
					but.title = datePicker.fullDay[d];
					but = null;
				} else {
					ths[y].removeChild(ths[y].firstChild);
					ths[y].appendChild(document.createTextNode(datePicker.dayAbbr ? datePicker.dayAbbr[d] : datePicker.fullDay[d].charAt(0)));
				};
			};
			o.updateTable();
		};
		o.updateTable = function(noCallBack) {
			if(o.timerSet) {
				var d = o.date.clone().add({days: o.dayInc, months: o.monthInc, years: o.yearInc})
				o.date = d;
			};
			
			if(!noCallBack && "onupdate" in datePickerController && typeof(datePickerController.onupdate) == "function") datePickerController.onupdate(o);
			
			o.outOfRange();
			o.disableTodayButton();
			
			var tmpDate = new Date( o.date ).moveToFirstDayOfMonth().add({days: 1});
			var tdm = tmpDate.getMonth();
			var tdy = tmpDate.getFullYear();
			
			var disabledDates = o.getDisabledDates(o.date.getFullYear(), o.date.getMonth() + 1);
			var today = new Date();
			
			var b = document.getElementById(o.id + "-prev-year-but");
			b.className = b.className.replace("fd-disabled", "");
			if(o.outOfRange(tmpDate.clone().addYears(-1))) {
				b.className += " fd-disabled";
				if(o.yearInc == -1) o.stopTimer();
			};
			
			b = document.getElementById(o.id + "-prev-month-but");
			b.className = b.className.replace("fd-disabled", "");
			if(o.outOfRange(tmpDate.clone().addMonths(-1))) {
				b.className += " fd-disabled";
				if(o.monthInc == -1) o.stopTimer();
			};
			
			// next buttons
			b = document.getElementById(o.id + "-next-year-but");
			b.className = b.className.replace("fd-disabled", "");
			if(o.outOfRange(tmpDate.clone().addYears(1))) {
				b.className += " fd-disabled";
				if(o.yearInc == 1) o.stopTimer();
			};
			
			b = document.getElementById(o.id + "-next-month-but");
			b.className = b.className.replace("fd-disabled", "");
			if(o.outOfRange(tmpDate.clone().addMonths(1))) {
				b.className =+ " fd-disabled";
				if(o.monthInc == 1) o.stopTimer();
			};
			
			b = null;
			
			// title bar
			var span = o.titleBar.getElementsByTagName("span");
			while(span[0].firstChild) span[0].removeChild(span[0].firstChild);
			while(span[1].firstChild) span[1].removeChild(span[1].firstChild);
			span[0].appendChild(document.createTextNode(o.date.toString('MMMM') + o.nbsp));
			span[1].appendChild(document.createTextNode(o.date.toString('YYYY')));
			
			tmpDate.setDate(1);
			
			var dt, cName, td, tds, i;
			var weekDay = ( tmpDate.getDay() + 6 ) % 7;
			var firstColIndex = (( (weekDay - o.firstDayOfWeek) + 7 ) % 7) - 1;
			var dpm = Date.getDaysInMonth(o.date.getFullYear(), o.date.getMonth());
			
			var c = "class";
			var stub = String(tdy) + (String(tdm + 1).length < 2 ? "0" + (tdm + 1) : tdm + 1);
			for(var row = 0; row < 6; row++) {
				tds = o.trs[row].getElementsByTagName('td');
				for(var col = 0; col < 7; col++) {
					td = tds[col];
					td.removeChild(td.firstChild);
					
					td.setAttribute("id", "");
					td.setAttribute("title", "");
					
					i = (row * 7) + col;
					if(i > firstColIndex && i <= (firstColIndex + dpm)) {
						dt = i - firstColIndex;
						tmpDate.setDate(dt);
						td.appendChild(document.createTextNode(dt));
						
						if(o.outOfRange(tmpDate)) {
							td.setAttribute(c, "out-of-range");
						} else {
							cName = [];
							weekDay = ( tmpDate.getDay() + 6 ) % 7;
							if(dt == today.getDate() && tdm == today.getMonth() && tdy == today.getFullYear()) {
								cName.push("date-picker-today");
							};
							
							if(o.dateSet != null && o.dateSet.getDate() == dt && o.dateSet.getMonth() == tdm && o.dateSet.getFullYear() == tdy) {
								cName.push("date-picker-selected-date");
							};
							
							if(o.disableDays[weekDay] || stub + String(dt < 10 ? "0" + dt : dt) in disabledDates) {
								cName.push("day-disabled");
							} else if(o.highlightDays[weekDay]) {
								cName.push("date-picker-highlight");
							};
							
							if (o.date.getDate() == dt) {
								td.setAttribute("id", o.id + "-date-picker-hover");
								cName.push("date-picker-hover");
							};
							
							cName.push("dm-" + dt + '-' + (tdm + 1) + " " + " dmy-" + dt + '-' + (tdm + 1) + '-' + tdy);
							td.setAttribute(c, cName.join(' '));
							td.setAttribute("title", o.date.getMonth() + o.nbsp + dt + ", " + o.nbsp + o.date.getFullYear());
						};
					} else {
						td.appendChild(document.createTextNode(o.nbsp));
						td.setAttribute(c, "date-picker-unused");
					};
				};
			};
			
			if(o.timePicker) {
				var selectHour 		 = document.getElementById(o.id + '-sel-hr');
				var selectMinute 	 = document.getElementById(o.id + '-sel-min');
				var selectMeridiem = document.getElementById(o.id + '-sel-meridiem');
				
				if(o.date.getHours() < 12) {
					selectHour.options[(o.date.getHours() + 1)].selected = true;
					selectMeridiem.options[0].selected = true;
				} else {
					selectHour.options[(o.date.getHours() - 13)].selected = true;
					selectMeridiem.options[1].selected = true;
				};
				// FIXME
//				selectMinute.options[].selected = true;
			};
			
			if(o.timerSet) {
				o.timerInc = 50 + Math.round(((o.timerInc - 50) / 1.8));
				o.timer = window.setTimeout(o.updateTable, o.timerInc);
			};
		};
		o.addKeyboardEvents = function() {
			datePickerController.addEvent(document, "keypress", o.events.onkeydown);
			if(window.devicePixelRatio) {
				datePickerController.removeEvent(document, "keypress", o.events.onkeydown);
				datePickerController.addEvent(document, "keydown", o.events.onkeydown);
			};
		};
		o.removeKeyboardEvents = function() {
			datePickerController.removeEvent(document, "keypress", o.events.onkeydown);
			datePickerController.removeEvent(document, "keydown", o.events.onkeydown);
		};
		o.show = function() {
			var elem = o.getElem();
			if(!elem || o.visible ) return;
			
			o.reset();
			o.setDateFromInput();
			o.updateTable();
			
			if(!o.staticPos) o.resize();
			
			datePickerController.addEvent(o.staticPos ? o.table : document, "mousedown", o.events.onmousedown);
			
			if(!o.staticPos) { o.addKeyboardEvents(); };
			
			o.opacityTo = o.noTransparency ? 99 : 90;
			o.div.style.display = "block";
			
			o.fade();
			o.visible = true;
		};
		o.hide = function() {
			if(!o.visible) return;
			o.stopTimer();
			if(o.staticPos) return;
			
			datePickerController.removeEvent(document, "mousedown", o.events.onmousedown);
      datePickerController.removeEvent(document, "mouseup",  o.events.clearTimer);
      o.removeKeyboardEvents();

			o.opacityTo = 0;
      o.fade();
      o.visible = false;
      var elem = o.getElem();
      if(!elem.type || elem.type && elem.type != "hidden") { elem.focus(); };
		};
		o.destroy = function() {
       // Cleanup for Internet Explorer
       datePickerController.removeEvent(o.staticPos ? o.table : document, "mousedown", o.events.onmousedown);
       datePickerController.removeEvent(document, "mouseup",   o.events.clearTimer);
       o.removeKeyboardEvents();

       if(o.staticPos) {
	     	var yyN = document.getElementById(o.id);
				datePickerController.removeEvent(yyN, "change", o.changeHandler);
				
				o.div.onfocus = o.div.onblur = null;
			};

			var ths = o.table.getElementsByTagName("th");
			for(var i = 0, th; th = ths[i]; i++) {
				th.onmouseover = th.onmouseout = th.onmousedown = th.onclick = null;
			};

			var tds = o.table.getElementsByTagName("td");
			for(var i = 0, td; td = tds[i]; i++) {
				td.onmouseover = td.onclick = null;
			};

			var butts = o.table.getElementsByTagName("span");
			for(var i = 0, butt; butt = butts[i]; i++) {
				butt.onmousedown = butt.onclick = butt.onkeypress = null;
			};

			o.ths = o.trs = null;

			clearTimeout(o.fadeTimer);
			clearTimeout(o.timer);
			o.fadeTimer = o.timer = null;
			if(!o.staticPos && document.getElementById(o.id.replace(/^fd-/, 'fd-but-'))) {
              var butt = document.getElementById(o.id.replace(/^fd-/, 'fd-but-'));
              butt.onclick = butt.onpress = null;
      };
      
      if(o.div && o.div.parentNode) {
              o.div.parentNode.removeChild(o.div);
      };
      
      o.titleBar = o.table = o.div = null;
      o = null;
		};
		o.create();
	};
	
	datePickerController = function() {
		var datePickers = {};
		var uniqueId    = 0;

		var addEvent = function(obj, type, fn) {
			if( obj.attachEvent ) {
				obj["e"+type+fn] = fn;
				obj[type+fn] = function(){obj["e"+type+fn]( window.event );};
				obj.attachEvent( "on"+type, obj[type+fn] );
			} else {
				obj.addEventListener( type, fn, true );
			};
		};
	        
		var removeEvent = function(obj, type, fn) {
			try {
				if( obj.detachEvent ) {
					obj.detachEvent( "on"+type, obj[type+fn] );
					obj[type+fn] = null;
				} else {
					obj.removeEventListener( type, fn, true );
				};
			} catch(err) {};
		};
		
		var hideAll = function(exception) {
			var dp;
			for(dp in datePickers) {
				if(!datePickers[dp].created || datePickers[dp].staticPos) continue;
				if(exception && exception == datePickers[dp].id) { continue; };
				if(document.getElementById(datePickers[dp].id))  { datePickers[dp].hide(); };
			};
		};
		var cleanUp = function() {
			var dp;
			for(dp in datePickers) {
				if(!document.getElementById(datePickers[dp].id)) {
					if(!datePickers[dp].created) continue;
					datePickers[dp].destroy();
					datePickers[dp] = null;
					delete datePickers[dp];
				};
			};
		};
		var destroy = function() {
			for(dp in datePickers) {
				if(!datePickers[dp].created) continue;
				datePickers[dp].destroy();
				datePickers[dp] = null;
				delete datePickers[dp];
			};
			datePickers = null;
			datePicker.script = null;
			removeEvent(window, 'load', datePickerController.create);
			removeEvent(window, 'unload', datePickerController.destroy);
		};
		var joinNodeLists = function() {
			if(!arguments.length) { return []; }
			var nodeList = [];
			for (var i = 0; i < arguments.length; i++) {
				for (var j = 0, item; item = arguments[i][j]; j++) {
					nodeList[nodeList.length] = item;
				};
			};
			return nodeList;
		};
		var addDatePicker = function(inpId, options) {
			if(!(inpId in datePickers)) {
				datePickers[inpId] = new datePicker(options);
			};
		};
		var getDatePicker = function(inpId) {
			if(!(inpId in datePickers)) { throw "No datePicker has been created for the form element with an id of '" + inpId.toString() + "'"; };
			return datePickers[inpId];
		};
		var grepRangeLimits = function(sel) {
			var range = [];
			for(var i = 0; i < sel.options.length; i++) {
				if(sel.options[i].value.search(/^\d\d\d\d$/) == -1) { continue; };
				if(!range[0] || Number(sel.options[i].value) < range[0]) { range[0] = Number(sel.options[i].value); };
				if(!range[1] || Number(sel.options[i].value) > range[1]) { range[1] = Number(sel.options[i].value); };
			};
			return range;
		};
    var create = function(inp) {
			if(!(typeof document.createElement != "undefined" && typeof document.documentElement != "undefined" && typeof document.documentElement.offsetWidth == "number")) return;

      var inputs  = (inp && inp.tagName) ? [inp] : joinNodeLists(document.getElementsByTagName('input'), document.getElementsByTagName('select'));
      var regExp1 = /disable-days-([1-7]){1,6}/g;             // the days to disable
      var regExp2 = /no-transparency/g;                       // do not use transparency effects
      var regExp3 = /highlight-days-([1-7]){1,7}/g;           // the days to highlight in red
      var regExp4 = /range-low-(\d\d\d\d-\d\d-\d\d)/g;        // the lowest selectable date
      var regExp5 = /range-high-(\d\d\d\d-\d\d-\d\d)/g;       // the highest selectable date
			var regExp6 = /date-picker/g;														// date picker
      var regExp7 = /divider-(dot|slash|space|dash)/g;        // the character used to divide the date
      var regExp8 = /no-locale/g;                             // do not attempt to detect the browser language
      var regExp9 = /no-fade/g;                               // always show the datepicker
      var regExp10 = /hide-input/g;                           // hide the input
			var regExp11 = /time-picker/g;													// enable the time picker?
            
			for(var i=0, inp; inp = inputs[i]; i++) {
				if(inp.className && (inp.className.search(regExp6) != -1 || inp.className.search(/split-date/) != -1) && ((inp.tagName.toLowerCase() == "input" && (inp.type == "text" || inp.type == "hidden")) || inp.tagName.toLowerCase() == "select")) {
					if(inp.id && document.getElementById('fd-'+inp.id)) { continue; };
					if(!inp.id) { inp.id = "fdDatePicker-" + uniqueId++; };
					var options = {
						id:inp.id,
						low:"",
						high:"",
						divider:"/",
						format:"d-m-y",
						highlightDays:[0,0,0,0,0,1,1],
						disableDays:[0,0,0,0,0,0,0],
						locale:inp.className.search(regExp8) == -1,
						splitDate:0,
						noTransparency:inp.className.search(regExp2) != -1,
						staticPos:inp.className.search(regExp9) != -1,
						hideInput:inp.className.search(regExp10) != -1,
						timePicker:inp.className.search(regExp11) != -1
					};

					if(!options.staticPos) {
						options.hideInput = false;
					} else {
						options.noTransparency = true;
					};
                                                        
					// What divider to use, a "/", "-", "." or " "
					if(inp.className.search(regExp7) != -1) {
						var dividers = { dot:".", space:" ", dash:"-", slash:"/" };
						options.divider = (inp.className.search(regExp7) != -1 && inp.className.match(regExp7)[0].replace('divider-','') in dividers) ? dividers[inp.className.match(regExp7)[0].replace('divider-','')] : "/";
					};

					// The days to highlight
					if(inp.className.search(regExp3) != -1) {
						var tmp = inp.className.match(regExp3)[0].replace(/highlight-days-/, '');
						options.highlightDays = [0,0,0,0,0,0,0];
						for(var j = 0; j < tmp.length; j++) {
							options.highlightDays[tmp.charAt(j) - 1] = 1;
						};
					};

					// The days to disable
					if(inp.className.search(regExp1) != -1) {
						var tmp = inp.className.match(regExp1)[0].replace(/disable-days-/, '');
						options.disableDays = [0,0,0,0,0,0,0];
						for(var j = 0; j < tmp.length; j++) {
							options.disableDays[tmp.charAt(j) - 1] = 1;
						};
					};

					// The lower limit
					if(inp.className.search(/range-low-today/i) != -1) {
						options.low = datePickerController.dateFormat((new Date().getMonth() + 1) + "/" + new Date().getDate() + "/" + new Date().getFullYear(), true);
					} else if(inp.className.search(regExp4) != -1) {
						options.low = datePickerController.dateFormat(inp.className.match(regExp4)[0].replace(/range-low-/, ''), false);
						if(!options.low) {
							options.low = '';
						};
					};

					// The higher limit
					if(inp.className.search(/range-high-today/i) != -1 && inp.className.search(/range-low-today/i) == -1) {
						options.high = datePickerController.dateFormat((new Date().getMonth() + 1) + "/" + new Date().getDate() + "/" + new Date().getFullYear(), true);
					} else if(inp.className.search(regExp5) != -1) {
						options.high = datePickerController.dateFormat(inp.className.match(regExp5)[0].replace(/range-high-/, ''), false);
						if(!options.high) {
							options.high = '';
						};
					};
					
					// disable the input field
					inp.disabled = true;
					
					addDatePicker(inp.id, options);
				};
			};
		}
    
    return {
			addEvent:addEvent,
			removeEvent:removeEvent,
			create:create,
			destroy:destroy,
			cleanUp:cleanUp,
			addDatePicker:addDatePicker,
			getDatePicker:getDatePicker,
			datePickers:datePickers,
			hideAll:hideAll
		};
		}();
	})();

datePickerController.addEvent(window, 'load', datePickerController.create);
datePickerController.addEvent(window, 'unload', datePickerController.destroy);