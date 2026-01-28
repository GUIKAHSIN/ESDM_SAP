/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["admin/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
