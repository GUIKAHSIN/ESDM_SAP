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
                programmeSearch: "",
                filteredProgrammes: [],
                selectedProgrammeIds: [],
                programmeSummary: "",
                courseCode: "",
                courseName: "",
                creditHours: 3,
                availablePrereqCourses: [],
                filteredPrereqCourses: [],
                prereqSearch: "",
                selectedPrereqIds: [],
                prereqSummary: ""
            });
            this.getView().setModel(vm, "view");

            this._initialiseFromMainModel();
        },

        _initialiseFromMainModel() {
            const main = this.getView().getModel();
            const vm = this.getView().getModel("view");
            if (!main || !vm) { return; }

            vm.setProperty("/programmes", []); // filled when faculty is Computing
            vm.setProperty("/filteredProgrammes", []);
            vm.setProperty("/selectedProgrammeIds", []);

            const courses = main.getProperty("/Courses") || [];
            vm.setProperty("/availablePrereqCourses", courses);
            vm.setProperty("/filteredPrereqCourses", courses);
        },

        onFacultyChange() {
            const vm = this.getView().getModel("view");
            const main = this.getView().getModel();
            const faculty = vm.getProperty("/faculty");
            if (faculty === "Computing") {
                const programmes = main.getProperty("/Programmes") || [];
                vm.setProperty("/programmes", programmes);
            } else {
                vm.setProperty("/programmes", []);
                vm.setProperty("/selectedProgrammeIds", []);
                vm.setProperty("/programmeSummary", "");
            }
            vm.setProperty("/programmeSearch", "");
            this._filterProgrammeAndOpenPopover("");
        },

        onProgrammeType(oEvent) {
            const q = (oEvent.getParameter("newValue") || "").trim();
            const vm = this.getView().getModel("view");
            vm.setProperty("/programmeSearch", q);
            this._filterProgrammeAndOpenPopover(q);
        },

        onProgrammeInputFocus(oEvent) {
            const vm = this.getView().getModel("view");
            const q = vm.getProperty("/programmeSearch") || "";
            this._filterProgrammeAndOpenPopover(q);
        },

        _filterProgrammeAndOpenPopover(searchText) {
            const vm = this.getView().getModel("view");
            const faculty = vm.getProperty("/faculty");
            if (faculty !== "Computing") {
                vm.setProperty("/filteredProgrammes", []);
                return; // do not open popover until faculty is Computing
            }
            const q = (searchText || "").toLowerCase().trim();
            const programmes = vm.getProperty("/programmes") || [];
            const filtered = q === ""
                ? programmes
                : programmes.filter((p) => String(p.name || "").toLowerCase().includes(q));
            vm.setProperty("/filteredProgrammes", [...filtered]);

            if (!this._programmePopover) {
                const rb = this.getResourceBundle();
                const list = new sap.m.List({
                    id: this.getView().getId() + "--programmeList",
                    mode: sap.m.ListMode.MultiSelect
                });
                list.bindItems({
                    path: "view>/filteredProgrammes",
                    template: new sap.m.StandardListItem({ title: "{view>name}" })
                });
                list.attachSelectionChange(this._onProgrammeSelectionChange.bind(this));

                const allCb = new sap.m.CheckBox({
                    text: rb.getText("allProgrammes"),
                    select: this._onProgrammeAllSelect.bind(this)
                });
                const vbox = new sap.m.VBox();
                vbox.addItem(allCb);
                vbox.addItem(list);

                this._programmePopover = new sap.m.Popover({
                    title: rb.getText("programmeBachelor"),
                    placement: sap.m.PlacementType.Bottom,
                    contentWidth: "22rem",
                    contentHeight: "18rem",
                    content: [vbox],
                    afterOpen: this._onProgrammePopoverAfterOpen.bind(this),
                    afterClose: this._onProgrammePopoverAfterClose.bind(this)
                });
                this._programmePopover.setModel(this.getView().getModel("view"), "view");
                this.getView().addDependent(this._programmePopover);
            }
            this._programmePopover.openBy(this.byId("programmeInput"));
        },

        _onProgrammeAllSelect(oEvent) {
            const list = this._programmePopover.getContent()[0].getItems()[1];
            const selected = oEvent.getParameter("selected");
            if (selected) {
                const contexts = [];
                for (let i = 0; i < list.getItems().length; i++) {
                    const ctx = list.getContextByIndex(i);
                    if (ctx) contexts.push(ctx);
                }
                if (contexts.length) list.setSelectedContexts(contexts);
            } else {
                list.removeSelections();
            }
            this._syncProgrammeSelectionFromList(list);
        },

        _onProgrammePopoverAfterOpen() {
            const vbox = this._programmePopover.getContent()[0];
            const list = vbox.getItems()[1];
            const vm = this.getView().getModel("view");
            const selectedIds = vm.getProperty("/selectedProgrammeIds") || [];
            if (selectedIds.length === 0) return;
            setTimeout(() => {
                const contexts = [];
                for (let i = 0; i < list.getItems().length; i++) {
                    const ctx = list.getContextByIndex(i);
                    if (ctx && selectedIds.indexOf(ctx.getObject().ID) >= 0) contexts.push(ctx);
                }
                if (contexts.length) list.setSelectedContexts(contexts);
                const allCb = vbox.getItems()[0];
                allCb.setSelected(list.getItems().length > 0 && list.getSelectedContexts("view").length === list.getItems().length);
            }, 100);
        },

        _onProgrammePopoverAfterClose() {
            const list = this._programmePopover.getContent()[0].getItems()[1];
            const contexts = list.getSelectedContexts("view") || [];
            const ids = contexts.map((c) => c.getObject().ID);
            const vm = this.getView().getModel("view");
            vm.setProperty("/selectedProgrammeIds", ids);
            this._updateProgrammeSummary();
        },

        _onProgrammeSelectionChange(oEvent) {
            const list = oEvent.getSource();
            this._syncProgrammeSelectionFromList(list);
        },

        _syncProgrammeSelectionFromList(list) {
            const contexts = list.getSelectedContexts("view") || [];
            const ids = contexts.map((c) => c.getObject().ID);
            this.getView().getModel("view").setProperty("/selectedProgrammeIds", ids);
            this._updateProgrammeSummary();
            const vbox = this._programmePopover.getContent()[0];
            const allCb = vbox.getItems()[0];
            allCb.setSelected(list.getItems().length > 0 && contexts.length === list.getItems().length);
        },

        _updateProgrammeSummary() {
            const vm = this.getView().getModel("view");
            const ids = vm.getProperty("/selectedProgrammeIds") || [];
            const programmes = vm.getProperty("/programmes") || [];
            const names = ids.map((id) => {
                const p = programmes.find((x) => x.ID === id);
                return p ? p.name : String(id);
            });
            vm.setProperty("/programmeSummary", names.length ? "Selected: " + names.join(", ") : "");
        },

        _collectSelectedProgrammes() {
            const vm = this.getView().getModel("view");
            const ids = vm.getProperty("/selectedProgrammeIds") || [];
            const programmes = vm.getProperty("/programmes") || [];
            return ids.map((id) => {
                const p = programmes.find((x) => x.ID === id);
                return p ? p.name : String(id);
            });
        },

        onPrereqType(oEvent) {
            const q = (oEvent.getParameter("newValue") || "").trim();
            const vm = this.getView().getModel("view");
            vm.setProperty("/prereqSearch", q);
            this._filterPrereqAndOpenPopover(q);
        },

        onPrereqInputFocus(oEvent) {
            const vm = this.getView().getModel("view");
            const q = vm.getProperty("/prereqSearch") || "";
            this._filterPrereqAndOpenPopover(q);
        },

        _filterPrereqAndOpenPopover(searchText) {
            const vm = this.getView().getModel("view");
            const q = (searchText || "").toLowerCase().trim();
            const all = vm.getProperty("/availablePrereqCourses") || [];
            const filtered = q === ""
                ? all
                : all.filter((c) =>
                    String(c.courseCode || "").toLowerCase().includes(q) ||
                    String(c.courseName || "").toLowerCase().includes(q) ||
                    String(c.faculty || "").toLowerCase().includes(q)
                );
            vm.setProperty("/filteredPrereqCourses", [...filtered]);

            if (!this._prereqPopover) {
                const list = new sap.m.List({
                    id: this.getView().getId() + "--prereqList",
                    mode: sap.m.ListMode.MultiSelect
                });
                list.bindItems({
                    path: "view>/filteredPrereqCourses",
                    template: new sap.m.StandardListItem({
                        title: "{view>courseCode} {view>courseName}",
                        description: "{view>faculty} • Year {view>year}"
                    })
                });
                list.attachSelectionChange(this._onPrereqSelectionChange.bind(this));
                this._prereqPopover = new sap.m.Popover({
                    title: this.getResourceBundle().getText("prerequisitesHeader"),
                    placement: sap.m.PlacementType.Bottom,
                    contentWidth: "28rem",
                    contentHeight: "18rem",
                    content: [list],
                    afterOpen: this._onPrereqPopoverAfterOpen.bind(this),
                    afterClose: this._onPrereqPopoverAfterClose.bind(this)
                });
                this._prereqPopover.setModel(this.getView().getModel("view"), "view");
                this.getView().addDependent(this._prereqPopover);
            }
            this._prereqPopover.openBy(this.byId("prereqInput"));
        },

        _onPrereqPopoverAfterOpen() {
            const list = this._prereqPopover.getContent()[0];
            const vm = this.getView().getModel("view");
            const selectedIds = vm.getProperty("/selectedPrereqIds") || [];
            if (selectedIds.length === 0) return;
            setTimeout(function () {
                const aContexts = [];
                for (let i = 0; i < list.getItems().length; i++) {
                    const ctx = list.getContextByIndex(i);
                    if (ctx && selectedIds.indexOf(ctx.getObject().ID) >= 0) aContexts.push(ctx);
                }
                if (aContexts.length) list.setSelectedContexts(aContexts);
            }, 100);
        },

        _onPrereqPopoverAfterClose() {
            const list = this._prereqPopover.getContent()[0];
            const aContexts = list.getSelectedContexts("view") || [];
            const ids = aContexts.map((c) => c.getObject().ID);
            const vm = this.getView().getModel("view");
            vm.setProperty("/selectedPrereqIds", ids);
            this._updatePrereqSummary();
        },

        _onPrereqSelectionChange(oEvent) {
            const list = oEvent.getSource();
            const aContexts = list.getSelectedContexts("view") || [];
            const ids = aContexts.map((c) => c.getObject().ID);
            this.getView().getModel("view").setProperty("/selectedPrereqIds", ids);
            this._updatePrereqSummary();
        },

        _updatePrereqSummary() {
            const vm = this.getView().getModel("view");
            const ids = vm.getProperty("/selectedPrereqIds") || [];
            const all = vm.getProperty("/availablePrereqCourses") || [];
            const names = ids.map((id) => {
                const c = all.find((x) => x.ID === id);
                return c ? (c.courseCode + " " + (c.courseName || "")) : String(id);
            });
            vm.setProperty("/prereqSummary", names.length ? "Selected: " + names.join(", ") : "");
        },

        _collectSelectedPrereqIds() {
            const vm = this.getView().getModel("view");
            return vm.getProperty("/selectedPrereqIds") || [];
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

