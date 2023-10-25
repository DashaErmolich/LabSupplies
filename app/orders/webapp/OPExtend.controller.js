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
					onBeforeCreate: function (mParameters) {
						return this._createDialog("Do you want to create ?");
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
						.invokeAction("Service.boundAction", {
							contexts: oContext
						})
						.then(function () {
							MessageToast.show("Order was approved");
						});
				}.bind(this);
				this._createDialog("This will create warehouses orders for this order", fnBoundAction);
			},

			onBoundPress: function (oContext) {
				var fnBoundAction = function () {
					this.base.editFlow
						.invokeAction("Service.boundAction", {
							contexts: oContext
						})
						.then(function () {
							MessageToast.show("Bound action successfully invoked");
						});
				}.bind(this);
				this._createDialog("This will call a bound action via custom invoke handler", fnBoundAction);
			},
			onBoundPressActionWithParameters: function (oContext) {
				var fnBoundAction = function () {
					this.base.editFlow
						.invokeAction("Service.boundActionWithParameters", {
							contexts: oContext,
							parameterValues: [
								{ name: "Parameter1", value: "Value 1" },
								{ name: "Parameter2", value: "Value 2" }
							],
							skipParameterDialog: false
						})
						.then(function () {
							MessageToast.show("Bound action with parameters successfully invoked");
						});
				}.bind(this);
				this._createDialog(
					"This will call a bound action with parameters and fill\nthe provided values into the action parameter dialog",
					fnBoundAction
				);
			},
			onBoundPressActionWithParametersSkipDialog: function (oContext) {
				var fnBoundAction = function () {
					this.base.editFlow
						.invokeAction("Service.boundActionWithParameters", {
							contexts: oContext,
							parameterValues: [
								// Remove one parameter and the dialog will not be skipped since
								// the set of parameter values needs to be complete in order to
								// skip the dialog
								{ name: "Parameter1", value: "Value 1" },
								{ name: "Parameter2", value: "Value 2" }
							],
							skipParameterDialog: true
						})
						.then(function () {
							MessageToast.show("Bound action with parameters successfully invoked");
						});
				}.bind(this);
				this._createDialog(
					"This will call a bound action with parameters and the provided values and skip the parameter dialog.\nRemove one of the parameters and the dialog will not be skipped.",
					fnBoundAction
				);
			},
			onBoundSetTitlePress: function (oContext, aSelectedContexts) {
				var fnBoundAction = function () {
					this.base.editFlow
						.invokeAction("Service.boundActionSetTitle()", {
							contexts: aSelectedContexts,
							// invocationGrouping: 'ChangeSet', // put all action calls into one change set,
							invocationGrouping: "Isolated", // put each action call into a separate change set
							label: "Set Title"
						})
						.then(function () {
							MessageToast.show("Bound action successfully invoked, titles were changed.");
						});
				}.bind(this);
				this._createDialog("This will call a parametrized bound action with invocation grouping set to 'Isolated'", fnBoundAction);
			},
			onUnboundPress: function (oContext) {
				var fnUnboundAction = function () {
					this.base.editFlow
						.invokeAction("Service.EntityContainer/unboundAction", {
							model: this.base.editFlow.getView().getModel()
						})
						.then(function () {
							MessageToast.show("Unbound Action Successfully Invoked");
						})
						.catch(function () {
							MessageBox.show("The action wasn't performed because of either backend issues or the user cancelled it.", {
								icon: MessageBox.Icon.ERROR,
								title: "Unbound action call not processed"
							});
						});
				}.bind(this);
				this._createDialog("This will call an unbound action via custom invoke handler", fnUnboundAction);
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
