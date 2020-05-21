sap.ui.define([
	"../Constants",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/m/MessageToast"
], function (Constants, Controller, JSONModel, MessageBox, Fragment, MessageToast) {
	"use strict";

	return Controller.extend("sap.ui.demo.fiori2.controller.Wizard", {
		onInit: function () {
			this._wizard = this.byId("CreateProgramWizard");
			this._oNavContainer = this.byId("wizardNavContainer");
			this._oWizardContentPage = this.byId("wizardContentPage");
			
			Fragment.load({
				name: "sap.ui.demo.fiori2.view.Review",
				controller: this
			}).then(function (oWizardReviewPage) {
				this._oWizardReviewPage = oWizardReviewPage;
				this._oNavContainer.addPage(this._oWizardReviewPage);
			}.bind(this));
			
			var oJSONData = {
				count: 0
			};

			var oModel = new sap.ui.model.json.JSONModel(oJSONData);

			this._programDetails = undefined;
			this.oModelUsers = {
				users:[]
			};
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
		
		onAddUser: function () {
			var firstName = this.byId("firstName").getValue();
			var lastName = this.byId("lastName").getValue();
			var username = this.byId("username").getValue();
			var password = this.byId("password").getValue();
			
			var userData = {
				firstName: firstName,
				lastName: lastName,
				username: username,
				password: password
			};
			
			//var oViewUsers = this.getView                                                 
			//this._users.push(oModel.setData(userData));
			
			this._users.push(userData);
		
			console.log(this._users);
			
			this.oView.getModel("users").setProperty("/createdUsersData", this._users)
			
			this.getView().byId("firstName").setValue("");
			this.getView().byId("lastName").setValue("");
			this.getView().byId("username").setValue("");
			this.getView().byId("password").setValue("");
		},

		handleDisplayUsers: function (oEvent) {
			var oButton = oEvent.getSource();
			if (!this._oDialog) {
				Fragment.load({
					name: "sap.ui.demo.fiori2.view.Users",
					controller: this
				}).then(function (oDialog) {
					this._oDialog = oDialog;
					this._configDialog(oButton);
					this._oDialog.open();
				}.bind(this));
			} else {
				this._configDialog(oButton);
				this._oDialog.open();
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
		},
		
		handleWizardSubmit: function () {
			this._handleMessageBoxOpen("Are you sure you want to submit your report?", "confirm");
			// POST program, users, psps
		},
		
		wizardCompletedHandler: function () {
			this._oNavContainer.to(this._oWizardReviewPage);
		},
		
		editStepOne: function () {
			this._handleNavigationToStep(0);
		},

		editStepTwo: function () {
			this._handleNavigationToStep(1);
		},

		editStepThree: function () {
			this._handleNavigationToStep(2);
		},

	});
});