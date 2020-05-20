sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"../Constants",
	"sap/f/library",
	"sap/m/MessageToast",
	"sap/ui/core/routing/History"
], function (Controller, Constants, fioriLibrary, MessageToast, History) {
	"use strict";

	return Controller.extend("sap.ui.demo.fiori2.controller.Detail", {
		onInit: function () {
			var oOwnerComponent = this.getOwnerComponent();

			this.oRouter = oOwnerComponent.getRouter();
			this.oModel = oOwnerComponent.getModel();

			this.oRouter.getRoute("detail").attachPatternMatched(this._onProgramMatched, this);
		},

		_onProgramMatched: function (oEvent) {
			this._programId = oEvent.getParameter("arguments").programId || this._programId || "0";

			this._getProgramDetails();
		},

		_getProgramDetails: function () {
			var oModel = new sap.ui.model.json.JSONModel();
			this.oView = this.getView();

			$.ajax({
				type: "GET",
				contentType: false,
				url: Constants.BASE_URL + Constants.PROGRAMS_PATH + "/" + this._programId,
				dataType: "json",
				async: false,
				success: function (data, textStatus, jqXHR) {
					oModel.setProperty("/programDetails", data);
				}
			}).done(function (data) {
				
				// get psps 
				$.ajax({
					type: "GET",
					contentType: false,
					url: Constants.BASE_URL + Constants.PROGRAMS_PATH + "/" + data.name + Constants.PSPS_PATH,
					dataType: "json",
					async: false,
					success: function (pspsData, textStatus, jqXHR) {
						oModel.setProperty("/psps", pspsData);
					}
				});
				
				// get users
				$.ajax({
					type: "GET",
					contentType: false,
					url: Constants.BASE_URL + Constants.PROGRAMS_PATH + "/" + data.name + Constants.USERS_PATH,
					dataType: "json",
					async: false,
					success: function (usersData, textStatus, jqXHR) {
						oModel.setProperty("/users", usersData);
					}
				})
			});

			this.oView.setModel(oModel, "details");
		}
	});
});