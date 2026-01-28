sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], (Controller, MessageBox, MessageToast, JSONModel) => {
    "use strict";

    return Controller.extend("admin.controller.CourseList", {

        onInit() {
            // view model for filters and derived list
            const oViewModel = new JSONModel({
                busy: false,
                filters: {
                    search: "",
                    faculty: "",
                    programme: "",
                    year: "",
                    status: ""
                },
                filteredCourses: []
            });
            this.getView().setModel(oViewModel, "view");
            this._applyFilters();
        },

        onCourseRowPress(oEvent) {
            const ctx = oEvent.getSource().getBindingContext("view");
            if (!ctx) return;
            const id = ctx.getObject().ID;
            this.getRouter().navTo("CourseDetail", { id: String(id) });
        },

        onOpenSections(oEvent) {
            // Find the nearest parent that has the row binding context
            let o = oEvent.getSource();
            while (o && typeof o.getBindingContext !== "function") o = o.getParent();
            while (o && !o.getBindingContext("view")) o = o.getParent();
            const ctx = o && o.getBindingContext("view");
            if (!ctx) return;
            const id = ctx.getObject().ID;
            this.getRouter().navTo("CourseDetail", { id: String(id), query: { tab: "sections" } });
        },

        onSearch(oEvent) {
            const sValue = oEvent.getSource().getValue();
            this.getView().getModel("view").setProperty("/filters/search", sValue);
            this._applyFilters();
        },

        onFilterChange() {
            this._applyFilters();
        },

        _applyFilters() {
            const m = this.getView().getModel(); // main JSON model
            const v = this.getView().getModel("view");
            if (!m || !v) return;
            const aAll = m.getProperty("/Courses") || [];
            const f = v.getProperty("/filters") || {};
            const sSearch = (f.search || "").toLowerCase();

            const aFiltered = aAll.filter((c) => {
                if (f.faculty && c.faculty !== f.faculty) return false;
                if (f.year && String(c.year) !== String(f.year)) return false;
                if (f.status && c.status !== f.status) return false;
                if (f.programme && !String(c.programme || "").toLowerCase().includes(f.programme.toLowerCase())) return false;
                if (sSearch) {
                    const combined = (c.courseCode + " " + c.courseName + " " + (c.faculty || "") + " " + (c.programme || "")).toLowerCase();
                    if (!combined.includes(sSearch)) return false;
                }
                return true;
            });
            v.setProperty("/filteredCourses", aFiltered);
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

            // refresh filtered list
            this._applyFilters();

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
