/* eslint-disable no-undef */
sap.ui.define(["sap/m/PDFViewer"], function (PDFViewer) {
	"use strict";

	return {
        onPress: function (oEvent) {
            this._pdfViewer = new PDFViewer();
			this._pdfViewer.setSource(`app${oEvent.getSource().getBindingContext().sPath}/content`);
			this._pdfViewer.open();
		},
	};
});