jQuery.sap.require("sap.ui.core.mvc.Controller");

jQuery.sap.require("sap.m.MessageBox");



sap.ui.core.mvc.Controller.extend("ZHR_ABSENCE_MANAGEMENT.view.Master", {

	_oCatalog: null,

	_oResourceBundle: null,



	onInit: function() {

		this._oView = this.getView();

		this._oItemTemplate = this.byId("columnListItem").clone();

		this._oComponent = sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this._oView));

		this._oResourceBundle = this._oComponent.getModel("i18n").getResourceBundle();

		this._oRouter = this._oComponent.getRouter();

		this.sAddSubUniqueId = this.createId() + "DLG_ADD_SUBST";

		this.oFormatToDisplay = sap.ui.core.format.DateFormat.getDateInstance({ // this format is used to display selected dates in calendar

			pattern: "dd MMM yyyy"

		});

		this._initViewPropertiesModel();

		this.getLoggedinUser();

	},

	//Add Substitute related methods

	onOpenAddSubstituteDialog: function(oEvent) {

		//Create Add New Substitute Fragment

		if (!this._oAddSubstituteFrag) {

			this._oAddSubstituteFrag = sap.ui.xmlfragment(this.sAddSubUniqueId, "ZHR_ABSENCE_MANAGEMENT.view.AddSubstitute", this);

			this.getView().addDependent(this._oAddSubstituteFrag);

			this._oAddSubstituteFrag.setModel(new sap.ui.model.json.JSONModel(), "selectedSubstituteModel");

		}



		// hide Save button until all required fields selected

		sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "BTN_SAVE").setVisible(false);

		this._oAddSubstituteFrag.open();

	},

	//Bind Search List

	onSearchOfSubstitutes: function(oEvent) {

		var oFilters = [];

		var oUserList = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_SEARCH_USERS");

		if (!this._oTemplate) {

			this._oTemplate = oUserList.getItems()[0].clone();

		}

		oFilters.push(new sap.ui.model.Filter({

			path: "SearchText",

			operator: "EQ",

			value1: oEvent.getSource().getValue()

		}));

		oUserList.bindItems("/UsersSet", this._oTemplate, null, oFilters);

	},

	// User Selection

	handleUserSelectionChange: function(oEvent) {

		var oParameters = oEvent.getSource().getBindingContext().getObject();

		// Navigate to range picker view

		this.navToSubstitutionPeriod(oParameters);

	},

	// Nav Period selection Screen

	navToSubstitutionPeriod: function(oParameters) {



		//var oUserProfileInfo = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_USR_DATA");

		var oSelectDatesPage = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "date_selection");

		var oCalendar = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "selectionCalendar");

		var oNavCon = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "NAV_ADD_SUBST");

		oCalendar.removeAllSelectedDates();

		oSelectDatesPage.setModel(new sap.ui.model.json.JSONModel(), "userDataModel");

		var oSelectDatesPageModel = oSelectDatesPage.getModel("userDataModel");



		oSelectDatesPageModel.setProperty("/UserId", oParameters.UserId);

		oSelectDatesPageModel.setProperty("/Fullname", oParameters.Fullname);



		if (!oSelectDatesPageModel.getProperty("/period")) {

			oSelectDatesPageModel.setProperty("/period", this._oResourceBundle.getText("substn.create.default_date"));

		}



		oCalendar.focusDate(new Date()); // set focus on current date

		oNavCon.to(oSelectDatesPage);



	},

	// On popover cancel

	handleCreateSubstitutionPopOverCancel: function(oEvent) {

		this._removeSelection();

		this._oAddSubstituteFrag.close();

	},

	// Date Selection

	onChangeRange: function(oEvent) {



		var that = this;

		var oFormat = sap.ui.core.format.DateFormat.getDateInstance({

			pattern: "yyyyMMdd"

		});

		var oSelectedDates = oEvent.getSource().getSelectedDates();

		var oCalendar = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "selectionCalendar");

		var dFromDateRaw = (oSelectedDates[0].getStartDate());

		var oSelectDatesPage = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "date_selection");

		var dCurrentRaw = new Date();

		var dCurrent = oFormat.format((dCurrentRaw));

		var dFromDate = oFormat.format(dFromDateRaw);

		var dFromDateToDisplay = that.oFormatToDisplay.format(dFromDateRaw);

		var dToDateRaw = (oSelectedDates[0].getEndDate());

		var dToDate = null;



		if (dToDateRaw != null) { // if to date and from date, both are selected

			dToDate = oFormat.format(dToDateRaw);

			var dToDateToDisplay = that.oFormatToDisplay.format(dToDateRaw);

			if (dFromDate < dCurrent || dToDate < dCurrent) { // if selected dates are not valid

				oCalendar.removeAllSelectedDates(); // unselect all dates

				dFromDate = dCurrent; // set current date to from date

				dToDate = null; // set to date as null

				oSelectDatesPage.getModel("userDataModel").setProperty("/period", this._oResourceBundle.getText("substn.dateSelection.from") + " " +

					""); // donot show any date selected under substitution period

				// hide Save button

				sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "BTN_SAVE").setVisible(false);

				return; // donot process further

			}

			// display start date and end date under substitution period

			oSelectDatesPage.getModel("userDataModel").setProperty("/period", this._oResourceBundle.getText("substn.dateSelection.from") + " " +

				dFromDateToDisplay + " " + this._oResourceBundle.getText("substn.dateSelection.to") + " " + dToDateToDisplay);

			// displa Save button

			sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "BTN_SAVE").setVisible(true);

		} else { // if only from date is selected

			// hide Save button 

			sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "BTN_SAVE").setVisible(false);

			if (dFromDate < dCurrent) { // if from date is invalid

				dFromDate = dCurrent; // set current date as from date

				oCalendar.removeAllSelectedDates(); // unselect all selected dates

			} else { // if from date is valid

				oSelectDatesPage.getModel("userDataModel").setProperty("/period", this._oResourceBundle.getText("substn.dateSelection.from") + " " +

					dFromDateToDisplay + ""); //display fromdate under substitution period

			}

		}



		oSelectedDates = {

			startDate: dFromDate,

			endDate: dToDate

		};

		oSelectDatesPage.getModel("userDataModel").setProperty("/selectedDates", oSelectedDates); // set model for selected dates



	},

	// Befor popover close

	onBeforeCloseDialog: function(oEvent) {

		this.resetAddSubstituteForm();

	},

	// Init Popover Data

	resetAddSubstituteForm: function() {

		var oSubstituteSearchInput = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "SEARCH_SUBSTITUTE");

		//Resetting all models

		this._oAddSubstituteFrag.getModel("selectedSubstituteModel").setProperty("/selectedSubstitute", {});



		var oUserList = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_SEARCH_USERS");

		//oUserList.bindItems("/usersSet", this._oTemplate);

		oUserList.unbindItems();

		oSubstituteSearchInput.setValue("");



		//navigate to the first page

		sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "NAV_ADD_SUBST").backToTop();

	},

	// Table selection

	handleRuleSelection: function(oEvent) {

		this._oView.byId("delete").setVisible(true);



	},

	// On delete rule click

	handleDelete: function(oEvent) {

		var oTable = this.byId("substitutionRules");

		// Display delete confirmation dialog

		sap.ca.ui.dialog.confirmation.open({

			question: this._oResourceBundle.getText("substn.delete.question"),

			title: this._oResourceBundle.getText("substn.delete.title"),

			confirmButtonLabel: this._oResourceBundle.getText("XBUT_OK")

		}, jQuery.proxy(function(oResult) {

			if (oResult.isConfirmed) {

				var oBindingPath = oTable.getSelectedItem().getBindingContextPath();

				var oModel = this._oView.getModel();

				oModel.setRefreshAfterChange(false);

				oModel.remove(oBindingPath, {

					success: jQuery.proxy(this.successDelete, this),

					error: jQuery.proxy(this.failDelete, this),

					async: true

				});

			} else {

				this._removeSelection();

			}

		}, this));

	},

	// Delete Ok

	successDelete: function(response) {

		jQuery.sap.delayedCall(200, this, function() {

			sap.ca.ui.message.showMessageToast(this._oResourceBundle.getText("substn.delete.success"));

		});

		this._oView.byId("delete").setVisible(false);

		this._oView.byId("substitutionRules").getBinding('items').refresh();

	},

	// Delete KO

	failDelete: function(oError) {

		var oMessage = "";

		if (oError.responseText && oError.responseText.length > 0) {

			var lError = JSON.parse(oError.responseText);

			oMessage = lError.error.message.value;

		}



		if (oMessage == "") {

			oMessage = oError.message;

		}



		sap.m.MessageBox.show(oMessage, {

			title: this._oResourceBundle.getText("substn.delete.error"),

			icon: sap.m.MessageBox.Icon.ERROR,

			action: [sap.m.MessageBox.Action.CLOSE]

		});

	},

	// On Save rule Click

	handleCreateSubstitutionPopOverSave: function(oEvent) {

		var oModel = this._oView.getModel();

		oModel.setRefreshAfterChange(false);

		var oUserProfileInfo = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_SUBS_DATA");

		var oSelectDatesPage = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "date_selection");

		var oDatesSelected = oSelectDatesPage.getModel("userDataModel").getProperty("/selectedDates");

		var oFormat = sap.ui.core.format.DateFormat.getDateInstance({

			pattern: "yyyyMMdd"

		});

		var sFromDate;

		var sToDate;



		if (oDatesSelected) {

			sFromDate = oDatesSelected.startDate;

			sToDate = oDatesSelected.endDate;

		} else {

			sFromDate = oFormat.format(new Date());

		}



		var oEntry = {};

		var endDate;

		var endDateInputValue = sToDate;



		if (endDateInputValue) {

			endDate = oFormat.parse(endDateInputValue);

			endDate.setHours(23, 59, 59, 59);

			oEntry.Endda = "\/Date(" + endDate.getTime() + ")\/";

		}



		var startDateInputValue = sFromDate;



		if (startDateInputValue) {

			var startDate = oFormat.parse(startDateInputValue);

			startDate.setHours(12, 0, 0, 0);

			oEntry.Begda = "\/Date(" + startDate.getTime() + ")\/";

		}



		oEntry.Rep_Fullname = oUserProfileInfo.getModel("userDataModel").getProperty("/Fullname");

		oEntry.Rep_Name = oUserProfileInfo.getModel("userDataModel").getProperty("/UserId");

		oEntry.Us_Name = this.oLoggedUser; 



		oModel.create("/AbsenceSet", oEntry, {

			success: jQuery.proxy(this.createSubstitutionSuccess, this),

			error: jQuery.proxy(this.createSubstitutionError, this),

			async: false

		});

	},

	// Creation OK

	createSubstitutionSuccess: function(oResponse) {

		// Display success messages Toast.

		jQuery.sap.delayedCall(200, this, function() {

			sap.ca.ui.message.showMessageToast(this._oResourceBundle.getText("substn.create.success"));

		});

		this._oAddSubstituteFrag.close();

		this._removeSelection();

		this._oView.byId("substitutionRules").getBinding('items').refresh();

	},

	// Creation KO

	createSubstitutionError: function(oError) {

		/*Display Error Message*/

		var oMessage = "";

		if (oError.responseText && oError.responseText.length > 0) {

			var lError = JSON.parse(oError.responseText);

			oMessage = lError.error.message.value;

		}



		if (oMessage == "") {

			oMessage = oError.message;

		}



		sap.m.MessageBox.show(oMessage, {

			title: this._oResourceBundle.getText("substn.create.error"),

			icon: sap.m.MessageBox.Icon.ERROR,

			action: [sap.m.MessageBox.Action.CLOSE]

		});



	},

	// Get connected user Infos

	getLoggedinUser: function() {

		//alert("loggedinuser");

		var url = "/sap/bc/ui2/start_up?depth=0";

		$.ajax({

			url: url,

			type: "GET",

			dataType: 'json',

			contentType: "application/json",

			success: jQuery.proxy(this.getData, this),

			error: jQuery.proxy(function(data) {

				var data = {

					id: "LOUATIA"

				};

				this.getData(data);

				//jQuery.sap.log.error("AJAX Error");

			}, this)

		});

	},

	// Get Rules

	getData: function(data) {



		if (!this.oLoggedUser) {

			this.oLoggedUser = data.id;

		}

		// We request substitution rules using this filter:

		// US_NAME = SY-UNAME AND (( BEGDA LE SY-DATUM AND ENNDA GE SY-DATUM  ) OR BEGDA GT SY-DATUM)

		var oFilters = [];

		var oTable = this._oView.byId("substitutionRules");

		var toDay = this.dateToDatetimeFormatter(new Date());



		//( BEGDA LE SY-DATUM AND ENNDA GE SY-DATUM  )

		var filter1 = new sap.ui.model.Filter({

			filters: [new sap.ui.model.Filter({

					path: "Begda",

					operator: "LE",

					value1: toDay

				}),

	               	new sap.ui.model.Filter({

					path: "Endda",

					operator: "GE",

					value1: toDay

				})

				],

			and: true

		});

		// Add "OR BEGDA GT SY-DATUM" to the initial filter 

		var filter2 = new sap.ui.model.Filter({

			filters: [filter1,

		new sap.ui.model.Filter({

					path: "Begda",

					operator: "GE",

					value1: toDay

				})],

			and: false

		});

		// Add "AND US_NAME = SY-UNAME" To the Filter 

		var oFilter = new sap.ui.model.Filter({

			filters: [filter2,

		new sap.ui.model.Filter({

					path: "Us_Name",

					operator: "EQ",

					value1: this.oLoggedUser

				})],

			and: true

		});



		oTable.bindItems("/AbsenceSet", this._oItemTemplate, [new sap.ui.model.Sorter('Begda', false, false)], oFilter);



	},



	_removeSelection: function() {

		var oTable = this._oView.byId("substitutionRules");

		if (this._oView.byId("delete").getVisible()) {

			this._oView.byId("delete").setVisible(false);

			oTable.setSelectedItem(oTable.getSelectedItem(), false);

		}



	},

	//DateTime Formatter

	dateToDatetimeFormatter: function(value) {

		var month = value.getMonth() + 1;

		month = month > 9 ? month : "0" + month;

		var day = value.getDate();

		day = day > 9 ? day : "0" + day;

		//return "datetime'" + value.getFullYear() + "-" + month + "-" + day + "T00:00:00'";

		return value.getFullYear() + "-" + month + "-" + day + "T00:00:00";

	},

	// The model created here is used to set values or view element properties that cannot be bound

	// directly to the OData service. Setting view element attributes by binding them to a model is preferable to the

	// alternative of getting each view element by its ID and setting the values directly because a JSon model is more

	// robust if the customer removes view elements (see extensibility).

	_initViewPropertiesModel: function() {

		var oViewElemProperties = {};

		oViewElemProperties.catalogTitleText = "AbsenceSet";

		if (sap.ui.Device.system.phone) {

			oViewElemProperties.availabilityColumnWidth = "30%";

		} else {

			oViewElemProperties.availabilityColumnWidth = "30%";

/*			oViewElemProperties.pictureColumnWidth = "9%";

			oViewElemProperties.btnColHeaderVisible = false;

			oViewElemProperties.searchFieldWidth = "30%";

			oViewElemProperties.catalogTitleVisible = true;

*/		}

		this._oViewProperties = new sap.ui.model.json.JSONModel(oViewElemProperties);

		this._oView.setModel(this._oViewProperties, "viewProperties");

	},



	onNavBack: function() {

		window.history.go(-1);

	}



});