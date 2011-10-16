/*
jQuery.bookingsTimeline v.0.0.1
Copyright (c) 2011 Laurynas Butkus - laurynas.butkus@gmail.com
Copyright (c) 2010 JC Grubbs - jc.grubbs@devmynd.com
MIT License Applies
*/

/*
Options
-----------------
showWeekends: boolean
data: object
cellWidth: number
cellHeight: number
slideWidth: number
dataUrl: string
start: string or date
end: string or date
focus: string or date
behavior: {
	clickable: boolean,
	draggable: boolean,
	resizable: boolean,
	onClick: function,
	onDrag: function,
	onResize: function
}
*/

(function (jQuery) {

	jQuery.fn.bookingsTimeline = function () {

		var args = Array.prototype.slice.call(arguments);

		if (args.length == 1 && typeof (args[0]) == "object") {
			build.call(this, args[0]);
		}

		if (args.length == 2 && typeof (args[0]) == "string") {
			handleMethod.call(this, args[0], args[1]);
		}
	};

	function build(options) {

		var els = this;
		var defaults = {
			showWeekends: true,
			cellWidth: 21,
			cellHeight: 31,
			slideWidth: 400,
			vHeaderWidth: 100,
			behavior: {
				clickable: true,
				draggable: true,
				resizable: true
			},
			monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
			start: null,
			end: null,
			focus: null
		};

		var opts = jQuery.extend(true, defaults, options);

		if (opts.data) {
			build();
		} else if (opts.dataUrl) {
			jQuery.getJSON(opts.dataUrl, function (data) { opts.data = data; build(); });
		}

		function build() {

			var minDays = Math.floor((opts.slideWidth / opts.cellWidth) + 5);
			var startEnd = DateUtils.getBoundaryDatesFromData(opts.data, minDays);
			var startDate = Date.parse(opts.start);
			var endDate = Date.parse(opts.end);

			opts.start = (startDate && startDate < startEnd[0]) ? startDate : startEnd[0];
			opts.end = (endDate > startEnd[1]) ? endDate : startEnd[1];

			els.each(function () {

				var container = jQuery(this);
				var div = jQuery("<div>", { "class": "bookingstimeline" });
				new Chart(div, opts).render();
				container.append(div);

				var w = jQuery("div.bookingstimeline-vtheader", container).outerWidth() +
					jQuery("div.bookingstimeline-slide-container", container).outerWidth();
				container.css("width", (w + 5) + "px");

				if ($.browser.msie) {
					// IE overflow fix - coz it puts the scrollbar inside the box without expanding the box to include it.
					var blocks = $("div.bookingstimeline-slide-container", container);
					blocks.height(blocks.height() + 20);
				}

				focusDate(opts.focus);

				new Behavior(container, opts).apply();

				if (opts.onLoad)
					opts.onLoad(container);
			});
		}

		function focusDate(date) {
			date = Date.parse(date);

			var offset = DateUtils.daysBetween(opts.start, date) * opts.cellWidth;

			jQuery("div.bookingstimeline-slide-container").scrollLeft(offset);
		}
	}

	function handleMethod(method, value) {

		if (method == "setSlideWidth") {
			var div = $("div.bookingstimeline", this);
			div.each(function () {
				var vtWidth = $("div.bookingstimeline-vtheader", div).outerWidth();
				$(div).width(vtWidth + value + 1);
				$("div.bookingstimeline-slide-container", this).width(value);
			});
		}
	}

	var Chart = function (div, opts) {

		function render() {
			addVtHeader(div, opts.data, opts.cellHeight);

			var slideDiv = jQuery("<div>", {
				"class": "bookingstimeline-slide-container",
				"css": { "width": opts.slideWidth + "px" }
			});

			dates = getDates(opts.start, opts.end);
			addHzHeader(slideDiv, dates, opts.cellWidth);
			addGrid(slideDiv, opts.data, dates, opts.cellWidth, opts.showWeekends);
			addBlockContainers(slideDiv, opts.data);
			addBlocks(slideDiv, opts.data, opts.cellWidth, opts.start);
			div.append(slideDiv);
			applyLastClass(div.parent());
			focus(opts.focus);
		}

		// Creates a 3 dimensional array [year][month][day] of every day 
		// between the given start and end dates
		function getDates(start, end) {
			var dates = [];
			dates[start.getFullYear()] = [];
			dates[start.getFullYear()][start.getMonth()] = [start]
			var last = start;
			while (last.compareTo(end) == -1) {
				var next = last.clone().addDays(1);
				if (!dates[next.getFullYear()]) { dates[next.getFullYear()] = []; }
				if (!dates[next.getFullYear()][next.getMonth()]) {
					dates[next.getFullYear()][next.getMonth()] = [];
				}
				dates[next.getFullYear()][next.getMonth()].push(next);
				last = next;
			}
			return dates;
		}

		function addVtHeader(div, data, cellHeight) {
			var headerDiv = jQuery("<div>", { "class": "bookingstimeline-vtheader" });
			for (var i = 0; i < data.length; i++) {
				var itemDiv = jQuery("<div>", { "class": "bookingstimeline-vtheader-item" });
				itemDiv.append(jQuery("<div>", {
					"class": "bookingstimeline-vtheader-item-name",
					"css": { "height": cellHeight + "px" }
				}).append(data[i].name));
				headerDiv.append(itemDiv);
			}
			div.append(headerDiv);
		}

		function addHzHeader(div, dates, cellWidth) {
			var headerDiv = jQuery("<div>", { "class": "bookingstimeline-hzheader" });
			var monthsDiv = jQuery("<div>", { "class": "bookingstimeline-hzheader-months" });
			var daysDiv = jQuery("<div>", { "class": "bookingstimeline-hzheader-days" });
			var totalW = 0;
			for (var y in dates) {
				for (var m in dates[y]) {
					var w = dates[y][m].length * cellWidth;
					totalW = totalW + w;
					monthsDiv.append(jQuery("<div>", {
						"class": "bookingstimeline-hzheader-month",
						"css": { "width": (w - 1) + "px" }
					}).append(opts.monthNames[m] + "/" + y));
					for (var d in dates[y][m]) {
						daysDiv.append(jQuery("<div>", { "class": "bookingstimeline-hzheader-day" })
							.append(dates[y][m][d].getDate()));
					}
				}
			}
			monthsDiv.css("width", totalW + "px");
			daysDiv.css("width", totalW + "px");
			headerDiv.append(monthsDiv).append(daysDiv);
			div.append(headerDiv);
		}

		function addGrid(div, data, dates, cellWidth, showWeekends) {
			var gridDiv = jQuery("<div>", { "class": "bookingstimeline-grid" });
			var rowDiv = jQuery("<div>", { "class": "bookingstimeline-grid-row" });
			for (var y in dates) {
				for (var m in dates[y]) {
					for (var d in dates[y][m]) {
						var cellDiv = jQuery("<div>", { "class": "bookingstimeline-grid-row-cell" });
						if (DateUtils.isWeekend(dates[y][m][d]) && showWeekends) {
							cellDiv.addClass("bookingstimeline-weekend");
						}
						rowDiv.append(cellDiv);
					}
				}
			}
			var w = jQuery("div.bookingstimeline-grid-row-cell", rowDiv).length * cellWidth;
			rowDiv.css("width", w + "px");
			gridDiv.css("width", w + "px");
			for (var i = 0; i < data.length; i++) {
				gridDiv.append(rowDiv.clone());
			}
			div.append(gridDiv);
		}

		function addBlockContainers(div, data) {
			var blocksDiv = jQuery("<div>", { "class": "bookingstimeline-blocks" });
			for (var i = 0; i < data.length; i++) {
				blocksDiv.append(jQuery("<div>", { "class": "bookingstimeline-block-container" }));
			}
			div.append(blocksDiv);
		}

		function addBlocks(div, data, cellWidth, start) {
			var rows = jQuery("div.bookingstimeline-blocks div.bookingstimeline-block-container", div);
			var rowIdx = 0;
			for (var i = 0; i < data.length; i++) {
				for (var j = 0; j < data[i].series.length; j++) {
					var series = data[i].series[j];
					var size = DateUtils.daysBetween(series.start, series.end);
					var offset = DateUtils.daysBetween(start, series.start);
					var block = jQuery("<div>", {
						"class": "bookingstimeline-block",
						"title": series.title ? series.title : series.name + ", " + size + " nights",
						"css": {
							"width": ((size * cellWidth) - 9) + "px",
							"left": ((offset * cellWidth) + 3) + "px"
						}
					});
					addBlockData(block, data[i], series);
					if (data[i].series[j].color) {
						block.css("background-color", data[i].series[j].color);
					}
					if (data[i].series[j].cssClass) {
						block.addClass(data[i].series[j].cssClass);
					}
					block.append(jQuery("<div>", { "class": "bookingstimeline-block-text" }).text(size));
					jQuery(rows[rowIdx]).append(block);
				}

				rowIdx = rowIdx + 1;
			}
		}

		function addBlockData(block, data, series) {
			// This allows custom attributes to be added to the series data objects
			// and makes them available to the 'data' argument of click, resize, and drag handlers
			var blockData = { id: data.id, name: data.name };
			jQuery.extend(blockData, series);
			block.data("block-data", blockData);
		}

		function applyLastClass(div) {
			jQuery("div.bookingstimeline-grid-row div.bookingstimeline-grid-row-cell:last-child", div).addClass("last");
			jQuery("div.bookingstimeline-hzheader-days div.bookingstimeline-hzheader-day:last-child", div).addClass("last");
			jQuery("div.bookingstimeline-hzheader-months div.bookingstimeline-hzheader-month:last-child", div).addClass("last");
		}

		return {
			render: render
		};
	}

	var Behavior = function (div, opts) {

		function apply() {
			bindBlockEvent(div, "mouseover", opts.behavior.onMouseOver);
			bindBlockEvent(div, "mouseout", opts.behavior.onMouseOut);

			if (opts.behavior.clickable) {
				bindBlockEvent(div, "click", opts.behavior.onClick);
			}

			if (opts.behavior.resizable) {
				bindBlockResize(div, opts.cellWidth, opts.start, opts.behavior.onResize);
			}

			if (opts.behavior.draggable) {
				bindBlockDrag(div, opts.cellWidth, opts.start, opts.behavior.onDrag);
			}
		}

		function bindBlockEvent(div, eventName, callback) {
			jQuery("div.bookingstimeline-block", div).live(eventName, function () {
				if (callback) { callback(jQuery(this).data("block-data"), this); }
			});
		}

		function bindBlockResize(div, cellWidth, startDate, callback) {
			jQuery("div.bookingstimeline-block", div).resizable({
				grid: cellWidth,
				handles: "e,w",
				stop: function () {
					var block = jQuery(this);
					updateDataAndPosition(div, block, cellWidth, startDate);
					if (callback) { callback(block.data("block-data"), this); }
				}
			});
		}

		function bindBlockDrag(div, cellWidth, startDate, callback) {
			jQuery("div.bookingstimeline-block", div).draggable({
				axis: "x",
				grid: [cellWidth, cellWidth],
				start: function () {
					jQuery(this).zIndex(jQuery(this).zIndex() + 1);
				},
				stop: function () {
					var block = jQuery(this);
					updateDataAndPosition(div, block, cellWidth, startDate);
					if (callback) { callback(block.data("block-data"), this); }
					jQuery(this).zIndex(jQuery(this).zIndex() - 1);
				}
			});
		}

		function updateDataAndPosition(div, block, cellWidth, startDate) {
			var container = jQuery("div.bookingstimeline-slide-container", div);
			var scroll = container.scrollLeft();
			var offset = block.offset().left - container.offset().left - 1 + scroll;

			// Set new start date
			var daysFromStart = Math.round(offset / cellWidth);
			var newStart = startDate.clone().addDays(daysFromStart);
			block.data("block-data").start = newStart;

			// Set new end date
			var width = block.outerWidth();
			var numberOfDays = Math.round(width / cellWidth);
			block.data("block-data").end = newStart.clone().addDays(numberOfDays);
			jQuery("div.bookingstimeline-block-text", block).text(numberOfDays);

			block.css("top", "").css("left", offset + "px");
		}

		return {
			apply: apply
		};
	}

	var ArrayUtils = {

		contains: function (arr, obj) {
			var has = false;
			for (var i = 0; i < arr.length; i++) { if (arr[i] == obj) { has = true; } }
			return has;
		}
	};

	var DateUtils = {

		daysBetween: function (start, end) {
			if (!start || !end) { return 0; }
			start = Date.parse(start); end = Date.parse(end);
			if (start.getYear() == 1901 || end.getYear() == 8099) { return 0; }
			var count = 0, date = start.clone();
			while (date.compareTo(end) == -1) { count = count + 1; date.addDays(1); }
			return count;
		},

		isWeekend: function (date) {
			return date.getDay() % 6 == 0;
		},

		getBoundaryDatesFromData: function (data, minDays) {
			var minStart = new Date(); maxEnd = new Date();
			for (var i = 0; i < data.length; i++) {
				for (var j = 0; j < data[i].series.length; j++) {
					var start = Date.parse(data[i].series[j].start);
					var end = Date.parse(data[i].series[j].end)
					if (i == 0 && j == 0) { minStart = start; maxEnd = end; }
					if (minStart.compareTo(start) == 1) { minStart = start; }
					if (maxEnd.compareTo(end) == -1) { maxEnd = end; }
				}
			}

			// Insure that the width of the chart is at least the slide width to avoid empty
			// whitespace to the right of the grid
			if (DateUtils.daysBetween(minStart, maxEnd) < minDays) {
				maxEnd = minStart.clone().addDays(minDays);
			}

			return [minStart, maxEnd];
		}
	};

})(jQuery);
