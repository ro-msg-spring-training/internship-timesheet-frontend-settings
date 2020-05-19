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
			this.oProductsTable = this.oView.byId("usersTable");

			this.oRouter = this.getOwnerComponent().getRouter();
		},

		onSort: function () {
			this._bDescendingSort = !this._bDescendingSort;
			var oBinding = this.oProductsTable.getBinding("items"),
				oSorter = new Sorter("programName", this._bDescendingSort);

			oBinding.sort(oSorter);
		},
		// var oView = this.getView(),
		// 		aStates = [undefined, "asc", "desc"],
		// 		aStateTextIds = ["sortNone", "sortAscending", "sortDescending"],
		// 		sMessage,
		// 		iOrder = oView.getModel("appView").getProperty("/order");

		// 	// Cycle between the states
		// 	iOrder = (iOrder + 1) % aStates.length;
		// 	var sOrder = aStates[iOrder];

		// 	oView.getModel("appView").setProperty("/order", iOrder);
		// 	oView.byId("peopleList").getBinding("items").sort(sOrder && new Sorter("LastName", sOrder === "desc"));

		// 	sMessage = this._getText("sortMessage", [this._getText(aStateTextIds[iOrder])]);

		onFilter: function (oEvent) {
			var iCount = this.oView.getModel("model").getProperty("/count");
			var oTable = this.oView.byId("usersTable");
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
			var userPath = oEvent.getSource().getBindingContext("users").getPath(),
				user = userPath.split("/").slice(-1).pop();
			var programName;
			var users = this.oView.getModel("users").getData().modelData;
			for (var i = 0; i < users.length; i++) {
				if (users[i].id == user) {
					programName = users[i].programName;
				}
			}
			var oFCL = this.oView.getParent().getParent();
			oFCL.setLayout(fioriLibrary.LayoutType.TwoColumnsMidExpanded);
			this.oRouter.navTo("detail", {
				layout: oFCL.getLayout(),
				user: user,
				programName: programName
			});
		}
	});
});