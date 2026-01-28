sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], (Controller, MessageBox, MessageToast, JSONModel) => {
    "use strict";

    return Controller.extend("admin.controller.CourseList", {

        onInit() {
            this.getView().setModel(new JSONModel({ busy: false }), "view");
        },

        onCourseSelect(e) {
            const item = e.getParameter("listItem");
            const ctx = item && item.getBindingContext();
            if (!ctx) return;
            const id = ctx.getObject().ID;
            this.getRouter().navTo("CourseDetail", { id: String(id) });
        },

        onCreateCourse() {
            if (!this._createDialog) {
                this._createDialog = this._getCreateDialog();
            }
            this._createDialog.getBindingContext() && this._createDialog.getBindingContext().destroy();
            this._createDialog.setBindingContext(null);
            const oModel = this.getView().getModel();
            const ctx = oModel.createEntry("/Courses", {
                courseCode: "",
                courseName: "",
                creditHours: 3,
                programme: "",
                year: 1
            });
            this._createDialog.setBindingContext(ctx);
            this._createDialog.open();
        },

        _getCreateDialog() {
            const that = this;
            const d = new sap.m.Dialog({
                title: that.getResourceBundle().getText("createCourse"),
                contentWidth: "32rem",
                content: [
                    new sap.m.VBox({ items: [
                        new sap.m.Label({ text: "{i18n>courseCode}" }),
                        new sap.m.Input({ value: "{courseCode}", required: true }),
                        new sap.m.Label({ text: "{i18n>courseName}" }),
                        new sap.m.Input({ value: "{courseName}" }),
                        new sap.m.Label({ text: "{i18n>creditHours}" }),
                        new sap.m.StepInput({ value: "{creditHours}", min: 1, max: 6, step: 0.5 }),
                        new sap.m.Label({ text: "{i18n>programme}" }),
                        new sap.m.Input({ value: "{programme}" }),
                        new sap.m.Label({ text: "{i18n>year}" }),
                        new sap.m.StepInput({ value: "{year}", min: 1, max: 5 })
                    ]})
                ],
                beginButton: new sap.m.Button({ text: that.getResourceBundle().getText("save"), type: "Emphasized", press: function () { that.onSaveNewCourse(); } }),
                endButton: new sap.m.Button({ text: that.getResourceBundle().getText("cancel"), press: function () { that._createDialog.close(); } })
            });
            that.getView().addDependent(d);
            return d;
        },

        onSaveNewCourse() {
            const d = this._createDialog;
            const ctx = d.getBindingContext();
            if (!ctx) return;
            const m = this.getView().getModel();
            const o = ctx.getObject();
            if (!(o.courseCode || "").trim()) {
                MessageBox.error(this.getResourceBundle().getText("courseCodeRequired"));
                return;
            }
            m.setProperty(ctx.getPath() + "/courseCode", (o.courseCode || "").trim());
            m.setProperty(ctx.getPath() + "/courseName", (o.courseName || "").trim());
            m.setProperty(ctx.getPath() + "/creditHours", o.creditHours);
            m.setProperty(ctx.getPath() + "/programme", (o.programme || "").trim());
            m.setProperty(ctx.getPath() + "/year", o.year);
            m.submitBatch().then(() => {
                d.close();
                MessageToast.show(this.getResourceBundle().getText("courseCreated"));
            }).catch((e) => {
                const msg = (e.cause && e.cause.message) || (e.message) || String(e);
                MessageBox.error(msg);
            });
        },

        getRouter() {
            return this.getOwnerComponent().getRouter();
        },

        getResourceBundle() {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        }
    });
});
