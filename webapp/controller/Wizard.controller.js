sap.ui.define([
	"../Constants",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/Button",
	"sap/m/Dialog",
	"sap/m/List",
	"sap/m/StandardListItem",
	"sap/ui/core/Fragment",
	"sap/m/MessageToast"
], function (Constants, Controller, JSONModel, MessageBox, Button, Dialog, List, StandardListItem, Fragment, MessageToast) {
	"use strict";

	return Controller.extend("sap.ui.demo.fiori2.controller.Wizard", {
		
		getModel : function (sName) {
			return this.getView().getModel(sName);
		},
		
		setModel : function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},
		
		onInit: function () {
			this._wizard = this.byId("CreateProgramWizard");
			this._oNavContainer = this.byId("wizardNavContainer");
			this._oWizardContentPage = this.byId("wizardContentPage");
			
			var oDataPsp = {
				pspNames: []
			};
			var oModelPsp = new JSONModel(oDataPsp);
        	this.getView().setModel(oModelPsp, "pspModel");
        	
			this._pspDialog = null;
			
			Fragment.load({
				name: "sap.ui.demo.fiori2.view.Review",
				controller: this
			}).then(function (oWizardReviewPage) {
				this._oWizardReviewPage = oWizardReviewPage;
				this._oNavContainer.addPage(this._oWizardReviewPage);
			}.bind(this));

			var oJSONData = {
				count: 0,
				programName: "",
				startDate: "",
				endDate: "",
				workingHours: [{
					value: "4"
				}, {
					value: "6"
				}, {
					value: "8",
				}]
			};

			var oModel = new sap.ui.model.json.JSONModel(oJSONData);
			this._programDetails = undefined;
			this.oModelUsers = {
				users: []
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
			});

			this.oView.setModel(oModel, "users");

			// attach handlers for validation errors
			sap.ui.getCore().getMessageManager().registerObject(this.oView.byId("programName"), true);
			sap.ui.getCore().getMessageManager().registerObject(this.oView.byId("startDate"), true);
			sap.ui.getCore().getMessageManager().registerObject(this.oView.byId("endDate"), true);

			this.oStartDatePicker = this.getView().byId("startDate");
			this.oStartDatePicker.addEventDelegate({
				onAfterRendering: function () {
					var oDateInner = this.$().find('.sapMInputBaseInner');
					var oID = oDateInner[0].id;
					$('#' + oID).attr("disabled", "disabled");
				}
			}, this.oStartDatePicker);

			this.oEndDatePicker = this.getView().byId("endDate");
			this.oEndDatePicker.addEventDelegate({
				onAfterRendering: function () {
					var oDateInner = this.$().find('.sapMInputBaseInner');
					var oID = oDateInner[0].id;
					$('#' + oID).attr("disabled", "disabled");
				}
			}, this.oEndDatePicker);
		},

		_validateProgramNameInput: function (oInput) {
			var oBinding = oInput.getBinding("value");
			var sValueState = "None";
			var bValidationError = false;

			try {
				oBinding.getType().validateValue(oInput.getValue());
			} catch (oException) {
				sValueState = "Error";
				bValidationError = true;
			}
			var progamNameFormData = new FormData();
			progamNameFormData.append("name", oInput.getValue());

			$.ajax({
				type: "POST",
				processData: false,
				contentType: false,
				data: progamNameFormData,
				url: Constants.BASE_URL + Constants.PROGRAM_NAME_VALID_PATH,
				async: false,
				success: function (data, textStatus, jqXHR) {
					if (data === true) {
						sValueState = "Error";
						bValidationError = true;
					}
				}
			});
			oInput.setValueState(sValueState);
			oInput.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("programNameError"));

			return bValidationError;
		},
		
		onChange: function (oEvent) {
			var oInput = oEvent.getSource();
			this._validateProgramNameInput(oInput);
			this._createProgramStepValidation();
		},

		onDateValidation: function (oEvent) {
			var sValueStateStart = "None";
			var bValidationError = false;
			var sValueStateEnd = "None";
			if (this.oStartDatePicker.getValue() !== "" && this.oEndDatePicker.getValue() !== "") {
				if (this.oStartDatePicker.getValue() > this.oEndDatePicker.getValue()) {
					sValueStateStart = "Error";
					sValueStateEnd = "Error";
					bValidationError = true;
				}
			}
			this.oStartDatePicker.setValueState(sValueStateStart);
			this.oStartDatePicker.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("dateError"));
			this.oEndDatePicker.setValueState(sValueStateEnd);
			this.oEndDatePicker.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("dateError"));

			this._createProgramStepValidation();
			return bValidationError;
		},
		
		_createProgramStepValidation: function () {
			if (this.oStartDatePicker.getValue() !== "" && this.oEndDatePicker.getValue() !== "" && this.oView.byId("programName").getValue() !==
				"" && this.oStartDatePicker.getValueState() !== "Error" && this.oEndDatePicker.getValueState() !== "Error" && this.oView.byId(
					"programName").getValueState() !== "Error") {
				this._wizard.validateStep(this.byId("CreateProgramStep"));
			} else
				this._wizard.invalidateStep(this.byId("CreateProgramStep"));
		},

		usernameValidation: function () {
			var users = this.oView.getModel("users").getData().usersData;
			var countUserNames = 0;
			var userName = this.byId("username").getValue();
			for (var i = 0; i < users.length; i++) {
				if (userName === users[i].userName) {
					countUserNames += 1;
				}
			}
			if (countUserNames > 1) {
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
			this._handleMessageBoxOpen("All input data will be lost. Are you sure you want to cancel?", "warning");
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
		
		createPspValidation: function () {
			if(this.getView().byId("PspName").getValue() == "") {
				this._wizard.invalidateStep(this.byId("CreatePSPStep"));
			}
		},
		
		onAddPsp: function (oEvent) {
			var pspName = this.getView().byId("PspName").getValue();
			
			var oModelPsp = this.getModel("pspModel");
			oModelPsp.oData.pspNames.push(pspName);
			
			this.getView().byId("createdPsps").setText(oModelPsp.oData.pspNames);
			
			this.getView().byId("PspName").setValue("");
		},
		
		onViewPsps: function (oEvent) {
			var oModelPsp = this.getModel("pspModel");
			this.pspDialog = null;
			
			if(!this._pspDialog) {
					this._pspDialog = new Dialog({
						title: "{i18n>psps}",
						content: new List({
							items: {
								path: "{/oModel.oData.pspNames}",
								template: new StandardListItem({
								})
							}
						}),
						endButton: new Button({
							text: "Close",
							press: function () {
								this._pspDialog.close();
							}.bind(this)
						})
					});
				//to get access to the global model
				this.getView().addDependent(this._pspDialog);
			}
			
			this._pspDialog.open();
		}
		
	});
});