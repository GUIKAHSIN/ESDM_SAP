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
            const id = oEvent.getSource().data("courseId");
            if (!id) return;
            this.getRouter().navTo("SectionManagement", { id: String(id) });
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
            this.getRouter().navTo("AddCourse");
        },

        getRouter() {
            return this.getOwnerComponent().getRouter();
        },

        getResourceBundle() {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        }
    });
});
