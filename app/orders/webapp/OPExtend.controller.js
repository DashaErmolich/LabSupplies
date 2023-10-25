/* eslint-disable no-unused-vars */
// eslint-disable-next-line no-undef
sap.ui.define(
	[
		"sap/ui/core/mvc/ControllerExtension",
		"sap/m/Dialog",
		"sap/m/DialogType",
		"sap/m/Text",
		"sap/m/Button",
		"sap/m/ButtonType",
		"sap/m/MessageToast",
		"sap/m/MessageBox"
	],
	function (ControllerExtension, Dialog, DialogType, Text, Button, ButtonType, MessageToast, MessageBox) {
		"use strict";

		return ControllerExtension.extend("orders.OPExtend", {
			// this section allows to extend lifecycle hooks or override public methods of the base controller
			override: {
				onInit: function () {},
				editFlow: {
					onBeforeSave: function (mParameters) {
						return this._createDialog("Do you want to submit this order?");
					},
					onBeforeEdit: function (mParameters) {
						return this._createDialog("Do you want to edit this order?");
					},
					onBeforeDiscard: function (mParameters) {
						return this._createDialog("Do you want to cancel this order?");
					},
					onBeforeDelete: function (mParameters) {
						return this._createDialog("Do you want to delete this order?");
					},
					onAfterSave: function (mParameters) {
						return MessageToast.show("Save successful");
					},
					onAfterEdit: function (mParameters) {
						return MessageToast.show("Edit successful");
					},
					onAfterDiscard: function (mParameters) {
						return MessageToast.show("Discard successful");
					},
					onAfterCreate: function (mParameters) {
						return MessageToast.show("Create successful");
					},
					onAfterDelete: function (mParameters) {
						return MessageToast.show("Delete successful");
					}
				}
			},
			onApprovePress: function (oContext) {
				var fnBoundAction = function () {
					this.base.editFlow
						.invokeAction("AppService.approveOrder", {
							contexts: oContext
						})
						.then(function () {
							MessageToast.show("Order was approved");
						});
				}.bind(this);
				this._createDialog("This will create warehouses orders for this order", fnBoundAction);
			},
			_createDialog: async function (sText, fnAction) {
				return new Promise(function (fnResolve, fnReject) {
					var oApproveDialog = new Dialog({
						type: DialogType.Message,
						title: "Confirm",
						content: new Text({ text: sText }),
						beginButton: new Button({
							type: ButtonType.Emphasized,
							text: "Continue",
							press: function () {
								oApproveDialog.close();
								//call action if provided
								if (fnAction) {
									fnAction();
								}
								fnResolve();
							}
						}),
						endButton: new Button({
							text: "Cancel",
							press: function () {
								oApproveDialog.close();
								fnReject();
							}
						}),
						escapeHandler: (pCloseDialog) => {
							pCloseDialog.resolve();
							fnReject();
						}
					});
					oApproveDialog.open();
				});
			}
		});
	}
);
