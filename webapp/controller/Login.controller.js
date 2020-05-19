sap.ui.define([
	"../Constants",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/ui/core/routing/History"
	
], function (Constants, Controller, JSONModel, MessageToast, Route) {
	"use strict";
	return Controller.extend("sap.ui.demo.fiori2.controller.Login", {
		getModel : function (sName) {
			return this.getView().getModel(sName);
		},
		
		setModel : function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},
		
		onLogin : function () {
			var oModel = this.getModel("loginModel");
			
			var username = this.getView().byId("username").getValue();
			var password = this.getView().byId("password").getValue();
			
			var myformData = new FormData();      
			myformData.append("username", username);
			myformData.append("password", password);
    		
    		var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			$.ajax({
    			method: 'post',
				processData: false,
    			contentType: false,
    			data: myformData,
				url: Constants.BASE_URL + Constants.LOGIN_PATH,  
    			success: function (response) {
					oRouter.navTo("master", true);
    			},
    			error: function (e,xhr,textStatus,err,data) {
    				MessageToast.show("{i18n>loginWrongData}");
				}
			});
		},
		
		init : function(){
			this.oView = this.getView();
			
			var oModel = new JSONModel({
				username: "{username}",
				password: "{password}"
			});
			
			// Assign the model object to the SAPUI5 core
			this.setModel(oModel, "loginModel");
		}
	});

});