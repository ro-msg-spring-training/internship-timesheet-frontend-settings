sap.ui.define([
	"../Constants",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function (Constants, Controller, JSONModel, MessageBox, MessageToast) {
	"use strict";

	return Controller.extend("sap.ui.demo.fiori2.controller.Wizard", {
		onInit: function () {
			this._wizard = this.byId("CreateProgramWizard");
			this._oNavContainer = this.byId("wizardNavContainer");
			this._oWizardContentPage = this.byId("wizardContentPage");
			
			var oJSONData = {
				count: 0
			};

			var oModel = new sap.ui.model.json.JSONModel(oJSONData);

			this._programDetails = undefined;
			this._users = [];
			this._psps = [];

			$.ajax({
				type: "GET",
				contentType: false,
				url: Constants.BASE_URL + Constants.USERS_PATH,
				dataType: "json",
				async: false,
				success: function (usersData, textStatus, jqXHR) {
					oModel.setProperty("/usersData", usersData);
				}
			})
			
			this.oView.setModel(oModel, "users");

		},

		usernameValidation: function () {
			var users = this.oView.getModel("users").getData().usersData;
			var countUserNames = 0;
			var userName = this.byId("username").getValue();
			for (var i = 0; i < users.length; i++)
			{
				if (userName === users[i].userName)
				{
					countUserNames += 1;
				}
			}
			if (countUserNames > 1){
				this._wizard.invalidateStep(this.byId("CreateUsersStep"));
			} else {
				this._wizard.validateStep(this.byId("CreateUsersStep"));
			}
		},

		passwordValidation: function () {
			var firstName = this.byId("firstName").getValue();
			var lastName = this.byId("lastName").getValue();
			var username = this.byId("username").getValue();
			var password = this.byId("password").getValue();

			if (firstName == "" || lastName == "" || username == "" || password == "") {
				this._wizard.invalidateStep(this.byId("CreateUsersStep"));
			} else {
				this._wizard.validateStep(this.byId("CreateUsersStep"));
			}

		},

		backToWizardContent: function () {
			this._oNavContainer.backToPage(this._oWizardContentPage.getId());
		},

		_handleNavigationToStep: function (iStepNumber) {
			var fnAfterNavigate = function () {
				this._wizard.goToStep(this._wizard.getSteps()[iStepNumber]);
				this._oNavContainer.detachAfterNavigate(fnAfterNavigate);
			}.bind(this);

			this._oNavContainer.attachAfterNavigate(fnAfterNavigate);
			this.backToWizardContent();
		},

		_handleMessageBoxOpen: function (sMessage, sMessageBoxType) {
			MessageBox[sMessageBoxType](sMessage, {
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				onClose: function (oAction) {
					if (oAction === MessageBox.Action.YES) {
						this._handleNavigationToStep(0);
						this._wizard.discardProgress(this._wizard.getSteps()[0]);
					}
				}.bind(this)
			});
		},

		_setEmptyValue: function (sPath) {
			this.model.setProperty(sPath, "n/a");
		},

		handleWizardCancel: function () {
			this._handleMessageBoxOpen("All input data will be lost. Are you sure you want to cancel program creation?", "warning");
		}

	});
});