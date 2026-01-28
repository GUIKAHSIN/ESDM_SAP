sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "admin/model/models",
    "admin/model/mockData"
], (UIComponent, JSONModel, models, mockData) => {
    "use strict";

    return UIComponent.extend("admin.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // default (in-memory) data model for prototype
            // clone to avoid accidental module-level mutation across reloads
            this.setModel(new JSONModel(JSON.parse(JSON.stringify(mockData))));

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();
        }
    });
});