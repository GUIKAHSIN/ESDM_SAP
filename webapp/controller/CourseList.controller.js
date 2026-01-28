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
            this._createDialog.setBindingContext(null);
            this._createDraft = {
                courseCode: "",
                courseName: "",
                creditHours: 3,
                programme: "",
                year: 1
            };
            this._createDialog.setModel(new JSONModel(this._createDraft), "draft");
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
                        new sap.m.Input({ value: "{draft>/courseCode}", required: true }),
                        new sap.m.Label({ text: "{i18n>courseName}" }),
                        new sap.m.Input({ value: "{draft>/courseName}" }),
                        new sap.m.Label({ text: "{i18n>creditHours}" }),
                        new sap.m.StepInput({ value: "{draft>/creditHours}", min: 1, max: 6, step: 0.5 }),
                        new sap.m.Label({ text: "{i18n>programme}" }),
                        new sap.m.Input({ value: "{draft>/programme}" }),
                        new sap.m.Label({ text: "{i18n>year}" }),
                        new sap.m.StepInput({ value: "{draft>/year}", min: 1, max: 5 })
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
            const draft = d.getModel("draft");
            const o = draft && draft.getData();
            if (!(o.courseCode || "").trim()) {
                MessageBox.error(this.getResourceBundle().getText("courseCodeRequired"));
                return;
            }
            const m = this.getView().getModel(); // main JSON model
            const courses = m.getProperty("/Courses") || [];

            const code = (o.courseCode || "").trim();
            const exists = courses.some((c) => String(c.courseCode || "").toLowerCase() === code.toLowerCase());
            if (exists) {
                MessageBox.error(`Course code "${code}" already exists.`);
                return;
            }

            const nextId = (m.getProperty("/nextIds/Courses") || 10) + 1;
            m.setProperty("/nextIds/Courses", nextId);

            courses.push({
                ID: nextId,
                courseCode: code,
                courseName: (o.courseName || "").trim(),
                creditHours: Number(o.creditHours) || 0,
                programme: (o.programme || "").trim(),
                year: parseInt(o.year, 10) || 1
            });
            m.setProperty("/Courses", courses);

            d.close();
            MessageToast.show(this.getResourceBundle().getText("courseCreated"));
        },

        getRouter() {
            return this.getOwnerComponent().getRouter();
        },

        getResourceBundle() {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        }
    });
});
