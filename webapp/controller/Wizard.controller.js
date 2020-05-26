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
	"sap/m/MessageToast",
	"sap/ui/core/syncStyleClass",
	"sap/ui/core/routing/History"
], function (Constants, Controller, JSONModel, MessageBox, Button, Dialog, List, StandardListItem, Fragment, MessageToast, syncStyleClass) {
	"use strict";

	return Controller.extend("sap.ui.demo.fiori2.controller.Wizard", {

		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		onInit: function () {
			this._wizard = this.byId("CreateProgramWizard");
			this._oNavContainer = this.byId("wizardNavContainer");
			this._oWizardContentPage = this.byId("wizardContentPage");
			this.oRouter = this.getOwnerComponent().getRouter();

			var oJSONData = {
				count: 0,
				programName: "",
				startDate: "",
				endDate: "",
				selectedWorkingHours: "4",
				workingHours: [{
					value: "4"
				}, {
					value: "6"
				}, {
					value: "8",
				}]
			};

			var oModel = new sap.ui.model.json.JSONModel(oJSONData);
			this._validatedCreateUserStep = false;
			this._programDetails = undefined;
			this._users = [];
			this._pspDialog = false;
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

			Fragment.load({
				name: "sap.ui.demo.fiori2.view.Review",
				controller: this
			}).then(function (oWizardReviewPage) {
				this._oWizardReviewPage = oWizardReviewPage;
				this._oNavContainer.addPage(this._oWizardReviewPage);
			}.bind(this));
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

			if (!bValidationError) {
				this.oView.getModel("users").setProperty("/programName", oInput.getValue());
			}

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
				} else {
					this.oView.getModel("users").setProperty("/startDate", this.oStartDatePicker.getValue());
					this.oView.getModel("users").setProperty("/endDate", this.oEndDatePicker.getValue());
				}
			}
			this.oStartDatePicker.setValueState(sValueStateStart);
			this.oStartDatePicker.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("dateError"));
			this.oEndDatePicker.setValueState(sValueStateEnd);
			this.oEndDatePicker.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("dateError"));

			this._createProgramStepValidation();

			return bValidationError;
		},

		onWorkingHoursSelected: function () {
			this.oView.getModel("users").setProperty("/selectedWorkingHours", this.byId("workingHoursSelect").getSelectedItem().getText());
		},

		_createProgramStepValidation: function () {
			if (this.oStartDatePicker.getValue() !== "" && this.oEndDatePicker.getValue() !== "" && this.oView.byId("programName").getValue() !==
				"" && this.oStartDatePicker.getValueState() !== "Error" && this.oEndDatePicker.getValueState() !== "Error" && this.oView.byId(
					"programName").getValueState() !== "Error") {
				this._wizard.validateStep(this.byId("CreateProgramStep"));
			} else
				this._wizard.invalidateStep(this.byId("CreateProgramStep"));
		},

		handleFirstNameChange: function (oEvent) {
			var firstName = this.byId("firstName").getValue();
			var pattern = RegExp('^[A-Za-z]+((\s)?((\'|\-|\.)?([A-Za-z])+))*$');
			oEvent.getSource().setValueState("None");
			if (!pattern.test(firstName)) {
				oEvent.getSource().setValueState("Error");
				oEvent.getSource().setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("FirstNameError"));
				this.byId("iconAdd").setEnabled(false);
				this.validateFirstName = false;
			} else {
				if (this.validateLastName) {
					this.byId("iconAdd").setEnabled(true);
				}
				this.validateFirstName = true;
			}
		},

		handleLastNameChange: function (oEvent) {
			var lastName = this.byId("lastName").getValue();
			var pattern = RegExp('^[A-Za-z]+((\s)?((\'|\-|\.)?([A-Za-z])+))*$');
			oEvent.getSource().setValueState("None");
			if (!pattern.test(lastName)) {
				oEvent.getSource().setValueState("Error");
				oEvent.getSource().setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("LastNameError"));
				this.byId("iconAdd").setEnabled(false);
				this.validateLastName = false;
			} else {
				if (this.validateFirstName) {
					this.byId("iconAdd").setEnabled(true);
				}
				this.validateLastName = true;
			}
		},

		usernameValidation: function () {
			var users = this.oView.getModel("users").getData().usersData;
			var countUserNames = 0;
			var userName = this.byId("username").getValue();
			for (var i = 0; i < users.length; i++) {
				if (userName === users[i].username) {
					countUserNames += 1;
				}
			}

			var isPresent = false;
			for (var user in this._users) {
				if (this._users[user].username === userName) {
					isPresent = true;
				}
			}

			if (countUserNames > 0 || isPresent) {
				return false;
			} else {
				return true;
			}
		},

		passwordValidation: function () {
			var firstName = this.byId("firstName").getValue();
			var lastName = this.byId("lastName").getValue();
			var username = this.byId("username").getValue();
			var password = this.byId("password").getValue();

			if (firstName == "" || lastName == "" || username == "" || password == "") {
				this._validatedCreateUserStep = false;
			} else {
				this._validatedCreateUserStep = true;
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

			var isPresent = this.usernameValidation();

			if (!isPresent) {
				MessageToast.show("Username already exists!", Error);
				this._wizard.invalidateStep(this.byId("CreateUsersStep"));
			} else {
				MessageToast.show("User added!");

				this._users.push(userData);
				this.oView.getModel("users").setProperty("/createdUsersData", this._users);

				this.getView().byId("firstName").setValue("");
				this.getView().byId("lastName").setValue("");
				this.getView().byId("username").setValue("");
				this.getView().byId("password").setValue("");

				this._wizard.validateStep(this.byId("CreateUsersStep"));

			}
		},

		onExit: function () {
			if (this._pspDialog) {
				this._pspDialog.close();
			}
			if (this._oDialog) {
				this._oDialog.close();
			}
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

		_configDialog: function (oButton) {
			var sResponsivePadding = oButton.data("responsivePadding");
			var sResponsiveStyleClasses =
				"sapUiResponsivePadding--header sapUiResponsivePadding--subHeader sapUiResponsivePadding--content sapUiResponsivePadding--footer";

			if (sResponsivePadding) {
				this._oDialog.addStyleClass(sResponsiveStyleClasses);
			} else {
				this._oDialog.removeStyleClass(sResponsiveStyleClasses);
			}

			this.getView().addDependent(this._oDialog);

			// toggle compact style
			syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
		},

		backToWizardContent: function () {
			this._oNavContainer.backToPage(this._oWizardContentPage.getId());
		},

		_discardProgress: function () {
			this.oView.getModel("users").setProperty("/programName", "");
			this.oView.byId("programName").setValue("");
			this.oView.byId("programName").setValueState("None");

			this.oView.getModel("users").setProperty("/startDate", "");
			this.oView.byId("startDate").setValue("");
			this.oView.byId("startDate").setValueState("None");

			this.oView.getModel("users").setProperty("/endDate", "");
			this.oView.byId("endDate").setValue("");
			this.oView.byId("endDate").setValueState("None");

			this.oView.getModel("users").setProperty("/firstName", "");
			this.oView.byId("firstName").setValue("");
			this.oView.byId("firstName").setValueState("None");

			this.oView.getModel("users").setProperty("/lastName", "");
			this.oView.byId("lastName").setValue("");
			this.oView.byId("lastName").setValueState("None");

			this.oView.getModel("users").setProperty("/username", "");
			this.oView.byId("username").setValue("");
			this.oView.byId("username").setValueState("None");

			this.oView.getModel("users").setProperty("/password", "");
			this.oView.byId("password").setValue("");
			this.oView.byId("password").setValueState("None");

			this._users = [];
			this.oView.getModel("users").setProperty("/createdUsersData", this._users);

			this._psps = [];
			this.oView.getModel("users").setProperty("/createdPspsData", this._psps);
			this.oView.byId("PspName").setValue("");
			this.oView.byId("PspName").setValueState("None");
		},

		_handleNavigationToStep: function (iStepNumber) {
			var fnAfterNavigate = function () {
				this._wizard.goToStep(this._wizard.getSteps()[iStepNumber]);
				this._oNavContainer.detachAfterNavigate(fnAfterNavigate);
			}.bind(this);

			this._oNavContainer.attachAfterNavigate(fnAfterNavigate);
			this.backToWizardContent();
		},

		_handleSubmitMessageBoxOpen: function (sMessage, sMessageBoxType) {
			MessageBox[sMessageBoxType](sMessage, {
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				onClose: function (oAction) {
					if (oAction === MessageBox.Action.YES) {
						var programFormData = new FormData();
						programFormData.append("name", this.getModel("users").getProperty("/programName"));
						programFormData.append("startDate", this.getModel("users").getProperty("/startDate"));
						programFormData.append("endDate", this.getModel("users").getProperty("/endDate"));
						programFormData.append("workingHours", this.getModel("users").getProperty("/selectedWorkingHours"));
						programFormData.append('psps', JSON.stringify(this._psps));
						programFormData.append('users', JSON.stringify(this._users));

						$.ajax({
							type: "POST",
							processData: false,
							contentType: false,
							data: programFormData,
							url: Constants.BASE_URL + Constants.PROGRAMS_PATH,
							async: false,
							success: function (data, textStatus, jqXHR) {}
						});
						this._oNavContainer.removePage(this._oWizardReviewPage);
						this.oRouter.navTo("master", true);
						this._wizard.discardProgress(this._wizard.getSteps()[0]);
						this._discardProgress();
					}
				}.bind(this)
			});
		},

		_handleCancelMessageBoxOpen: function (sMessage, sMessageBoxType) {
			MessageBox[sMessageBoxType](sMessage, {
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				onClose: function (oAction) {
					if (oAction === MessageBox.Action.YES) {
						if (this.dialogFrafment) {
							this.dialogFrafment.destroy(true);
						}
						this.oRouter.navTo("master", true);
						this._wizard.discardProgress(this._wizard.getSteps()[0]);
						this._discardProgress();
					}
				}.bind(this)
			});
		},

		_handleCancelReviewMessageBoxOpen: function (sMessage, sMessageBoxType) {
			MessageBox[sMessageBoxType](sMessage, {
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				onClose: function (oAction) {
					if (oAction === MessageBox.Action.YES) {
						if (this.dialogFrafment) {
							this.dialogFrafment.destroy(true);
						}
						this._oNavContainer.removePage(this._oWizardReviewPage);
						this.oRouter.navTo("master", true);
						this._wizard.discardProgress(this._wizard.getSteps()[0]);
						this._discardProgress();
					}
				}.bind(this)
			});
		},

		_setEmptyValue: function (sPath) {
			this.model.setProperty(sPath, "n/a");
		},

		handleReviewCancel: function () {
			this._handleCancelReviewMessageBoxOpen("All input data will be lost. Are you sure you want to cancel?", "warning");
		},

		handleWizardCancel: function () {
			this._handleCancelMessageBoxOpen("All input data will be lost. Are you sure you want to cancel?", "warning");
		},

		handleWizardSubmit: function () {
			this._handleSubmitMessageBoxOpen("Are you sure you want to submit your report?", "confirm");
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
			if (this.getView().byId("PspName").getValue() == "") {
				this._wizard.invalidateStep(this.byId("CreatePSPStep"));
			}
		},

		onAddPsp: function (oEvent) {
			var pspName = this.getView().byId("PspName").getValue();

			if (pspName != "") {
				var isPresent = false;

				for (var psp in this._psps) {
					if (this._psps[psp].name === pspName) {
						isPresent = true;
					}
				}

				if (!isPresent) {
					var pspData = {
						name: pspName
					};

					this._psps.push(pspData);
					this.oView.getModel("users").setProperty("/createdPspsData", this._psps);

					this.getView().byId("PspName").setValue("");
					MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("pspAdded"));

					this._wizard.validateStep(this.byId("CreatePSPStep"));
				} else {
					MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("pspUsed"), Error);
				}
			} else {
				MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("completeFields"), Error);
			}

		},

		onViewPsps: function (oEvent) {

			if (!this._pspDialog) {
				Fragment.load({
					name: "sap.ui.demo.fiori2.view.Psp",
					controller: this
				}).then(function (oDialog) {
					this._pspDialog = oDialog;
					this.getView().addDependent(this._pspDialog);
					this._pspDialog.open();
				}.bind(this));
			} else {
				this.getView().addDependent(this._pspDialog);
				this._pspDialog.open();
			}
		}
	});
});