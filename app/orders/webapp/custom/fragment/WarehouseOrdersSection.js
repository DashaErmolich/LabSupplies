sap.ui.define(["sap/m/MessageToast"], function (MessageToast) {
	"use strict";

	return {
		onPress: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext();
			this.routing.navigate(oContext);
		},
		onChange: function () {
			MessageToast.show("You changed the value for the date picker");
		}
	};
});
