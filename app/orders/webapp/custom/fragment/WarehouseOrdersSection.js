/* eslint-disable no-undef */
sap.ui.define(["sap/m/MessageToast"], function () {
	"use strict";

	return {
		onPress: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext();
			this.routing.navigate(oContext);
		}
	};
});
