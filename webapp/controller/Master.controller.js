sap.ui.define([
	"../Constants",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'sap/ui/model/Sorter',
	'sap/m/MessageBox',
	'sap/f/library',
	"sap/ui/core/format/DateFormat"
], function (Constants, JSONModel, Controller, Filter, FilterOperator, Sorter, MessageBox, fioriLibrary, DateFormat) {
	"use strict";

	return Controller.extend("sap.ui.demo.fiori2.controller.Master", {
		onInit: function () {
			this.oView = this.getView();
			var oJSONData = {
				count: 0
			};

			var oModel = new sap.ui.model.json.JSONModel(oJSONData);

			$.ajax({
				type: "GET",
				contentType: false,
				url: Constants.BASE_URL + Constants.PROGRAMS_PATH,
				dataType: "json",
				async: false,
				success: function (data, textStatus, jqXHR) {
					oModel.setProperty("/programs", data);
				}
			});

			this.oView.setModel(oModel, "model");
			this._bDescendingSort = false;
			this.oProgramsTable = this.oView.byId("programsTable");

			this.oRouter = this.getOwnerComponent().getRouter();
		},

		onSort: function () {
			this._bDescendingSort = !this._bDescendingSort;
			var oBinding = this.oProgramsTable.getBinding("items"),
				oSorter = new Sorter("name", this._bDescendingSort);

			oBinding.sort(oSorter);
		},
		onFilter: function (oEvent) {
			var iCount = this.oView.getModel("model").getProperty("/count");
			var oTable = this.oView.byId("programsTable");
			var oBinding = oTable.getBinding("items");
			if (iCount % 2 == 0) {
				var aFilter = [];
				var oFormat = DateFormat.getDateInstance({
					pattern: "yyyy-MM-dd"
				});
				var date = oFormat.format(new Date());
				aFilter.push(new Filter({
					path: "endDate",
					operator: FilterOperator.GT,
					value1: date
				}));
				oBinding.filter(aFilter);
				this.oView.getModel("model").setProperty("/count", iCount + 1);
				this.getView().byId("filterButton").setTooltip("Show all programs");
				return;
			} else {
				oBinding.filter();
				this.oView.getModel("model").setProperty("/count", iCount + 1);
				this.getView().byId("filterButton").setTooltip("Show active programs");
				return;
			}

		},

		onPressed: function (oEvent) {
			var programPath = oEvent.getSource().getBindingContext("model").getPath(),
				programIndex = programPath.split("/").slice(-1).pop();
			
			var programId = this.oProgramsTable.getBinding("items").oList[programIndex].programId;
			
			this.oRouter.navTo("detail", {
				programId: programId
			});
		},
        
        onAdd: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("wizard", true);
		}
	});
});