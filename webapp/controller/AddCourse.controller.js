sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], (Controller, JSONModel, MessageBox, MessageToast) => {
    "use strict";

    return Controller.extend("admin.controller.AddCourse", {
        onInit() {
            const vm = new JSONModel({
                faculty: "",
                yearOfStudy: "",
                programmes: [],
                courseCode: "",
                courseName: "",
                creditHours: 3,
                availablePrereqCourses: [],
                selectedPrereqPaths: []
            });
            this.getView().setModel(vm, "view");

            this._initialiseFromMainModel();
        },

        _initialiseFromMainModel() {
            const main = this.getView().getModel();
            const vm = this.getView().getModel("view");
            if (!main || !vm) { return; }

            vm.setProperty("/allProgrammes", (main.getProperty("/Programmes") || []).map((p) => ({
                ID: p.ID,
                name: p.name,
                faculty: "Computing",
                selected: false
            })));
            vm.setProperty("/programmes", []); // will be filled when faculty chosen

            const courses = main.getProperty("/Courses") || [];
            vm.setProperty("/availablePrereqCourses", courses);
        },

        onFacultyChange() {
            const vm = this.getView().getModel("view");
            const faculty = vm.getProperty("/faculty");
            const all = vm.getProperty("/allProgrammes") || [];
            if (faculty === "Computing") {
                vm.setProperty("/programmes", all);
            } else {
                vm.setProperty("/programmes", []);
            }
        },

        _collectSelectedProgrammes() {
            const vm = this.getView().getModel("view");
            const progs = vm.getProperty("/programmes") || [];
            return progs.filter((p) => p.selected).map((p) => p.name);
        },

        _collectSelectedPrereqIds() {
            const list = this.byId("prereqList");
            const aContexts = list.getSelectedContexts("view") || [];
            return aContexts.map((c) => c.getObject().ID);
        },

        _validate() {
            const rb = this.getResourceBundle();
            const vm = this.getView().getModel("view");
            const v = vm.getData();

            if (!v.faculty) {
                MessageBox.error(rb.getText("selectFacultyRequired"));
                return false;
            }
            if (!v.yearOfStudy) {
                MessageBox.error(rb.getText("selectYearRequired"));
                return false;
            }
            if (!v.courseCode || !v.courseCode.trim()) {
                MessageBox.error(rb.getText("courseCodeRequired"));
                return false;
            }
            if (!v.courseName || !v.courseName.trim()) {
                MessageBox.error(rb.getText("courseNameRequired"));
                return false;
            }
            const selectedPrograms = this._collectSelectedProgrammes();
            if (!selectedPrograms.length) {
                MessageBox.error(rb.getText("programmeRequired"));
                return false;
            }
            return true;
        },

        _saveCourseCore() {
            if (!this._validate()) return null;

            const main = this.getView().getModel();
            const vm = this.getView().getModel("view");
            const v = vm.getData();

            const courses = main.getProperty("/Courses") || [];
            const code = (v.courseCode || "").trim();
            const exists = courses.some((c) => String(c.courseCode || "").toLowerCase() === code.toLowerCase());
            if (exists) {
                MessageBox.error(this.getResourceBundle().getText("courseCodeExists", [code]));
                return null;
            }

            const progsSelected = this._collectSelectedProgrammes();
            const programmeText = progsSelected.join(", ");
            const nextId = (main.getProperty("/nextIds/Courses") || 10) + 1;
            main.setProperty("/nextIds/Courses", nextId);

            const course = {
                ID: nextId,
                courseCode: code,
                courseName: String(v.courseName || "").trim(),
                creditHours: Number(v.creditHours) || 0,
                programme: programmeText,
                faculty: v.faculty,
                year: parseInt(v.yearOfStudy, 10) || 1,
                status: "Active"
            };
            courses.push(course);
            main.setProperty("/Courses", courses);

            // prerequisites
            const selectedPrereqIds = this._collectSelectedPrereqIds();
            if (selectedPrereqIds.length) {
                const allPrereqs = main.getProperty("/Prerequisites") || [];
                let nextPid = (main.getProperty("/nextIds/Prerequisites") || 10);
                selectedPrereqIds.forEach((pid) => {
                    nextPid += 1;
                    allPrereqs.push({
                        ID: nextPid,
                        course_ID: nextId,
                        prerequisiteCourse_ID: pid
                    });
                });
                main.setProperty("/nextIds/Prerequisites", nextPid);
                main.setProperty("/Prerequisites", allPrereqs);
            }

            return course;
        },

        onSaveCourse() {
            const course = this._saveCourseCore();
            if (!course) return;
            MessageToast.show(this.getResourceBundle().getText("courseCreated"));
            this.getRouter().navTo("CourseList");
        },

        onSaveAndManageSections() {
            const course = this._saveCourseCore();
            if (!course) return;
            MessageToast.show(this.getResourceBundle().getText("courseCreated"));
            this.getRouter().navTo("SectionManagement", { id: String(course.ID) });
        },

        onCancel() {
            this.getRouter().navTo("CourseList");
        },

        onBackToCourseList() {
            this.onCancel();
        },

        getRouter() {
            return this.getOwnerComponent().getRouter();
        },

        getResourceBundle() {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        }
    });
});

