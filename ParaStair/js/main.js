var eMaterial = {
    "Steel": 0,
    "Wood": 1,
}
var eConnectionType = {
    "Pinned": 0,
    "Fixed": 1,
}

var eModes = {
    "Default": 0,
    "Stress": 1,
    "Deform": 2
}

let meshesDef = [];
let meshesSt = [];
let animate = false;

let brand;
let UI;
let UIpop_Fresize;
let UIpop_Fattrib;
let UIpop_Gattrib;
let UIpop_FrameAttr;

let modelObj;

let materialDD;
let innerRadiusDD;
let stringerThickDD;
let connectionTypeDD;

var materialsArr = ["Steel", "Wood"];
var innerRadiusArr = [ 3, 9, 15, 21, 27 ];
var stringerThickArr = [0.125, 0.25, 0.375, 0.5, 1, 1.5, 2, 2.5, 3.0];
var connectionTypeArr = ["Fixed", "Pinned"];

var CurrentMode = eModes.Default;
var Currentmaterial = "";

var stressMin = 0;
var stressMax = 0;
var defMin = 0;
var defMax = 0;

$(document).ready(function () {
    brand = new sBranding("Parametric Model:", "Loretto Chapel Stair.", Platforms.web).createBranding();

    UI = new sUI(
        new Array(
            CreateMainUI()),
        new sUIloader(.6, "#123456"),
        new sUIinfoPanel(
            new sUIPosition(50, 10, Anchor.TOPRIGHT, "px"),
            new sUIsize("150px", "", ""),
            "test header")
    ).CreateUI();

    modelObj = new Model(eMaterial.Wood, 0, 0, eConnectionType.Fixed); //

    SetMode(eModes.Default);
    LeftUI();
    DevModeSwitching_KeyEvents();

    
    scene = new sScene("sScene");
    //scene.options.enableAxis = true;
    scene.options.enableSpotLight = true;

    scene.InitiateScene();
    sceneHan = new sSceneHandler(scene); 
    scene.AninmateScene();

});
$(window).resize(function () {


});




function CreateLeftUIRowOneDD(values) {
    return new sUIdropdown(new sUIPosition(50, 25, "", "px"), new sUIsize(150, 20, "px"), values, 90);
}
function CreateLeftUIRowTwoDD(values) {
    return new sUIdropdown(new sUIPosition(50, 50, "", "px"), new sUIsize("calc(100% - 200px)", "20px", ""), values, 90);
}
function LeftUI() {

    let legend = $("<div class = 'legend'></div>");
    let thres = $("<div class = 'thres'></div>");
    let minMax = $("<div class = 'minMax'></div>");
    let thresZ = $("<div class = 'thresZ'>0</div>");

    legend.append("<img class = 'range' src= 'images/Legend.png'></img>");
    legend.append(thres);
    legend.append(thresZ);
    $(".scenePanel").append(minMax);
    $(".scenePanel").append(legend);

    

    var leftUIholder = $("<div class='leftUI'></div>");

    var header = $("<div  class='attrHolder MainHeader' >Global Parameters</div>");
    var material = $("<div  class='attrHolder' ><div class='attrHeader'>Material</div></div>");
    var innerRadius = $("<div  class='attrHolder' ><div class='attrHeader'>Inner Radius (In.)</div></div>");
    var outerRadius = $("<div  class='attrHolder' ><div class='attrHeader'>Outer Radius (In.)</div><div id='outRad' class='attrLabel'>" + modelObj.outerRadius + "</div></div>");
    var thicknessStringer = $("<div  class='attrHolder' ><div class='attrHeader'>Thickness of Stringer (In.)</div></div>");
    var connectionType = $("<div  class='attrHolder' ><div class='attrHeader'>Connection Type</div></div>");

    var loadInfo = $("<div  class='attrHolder' ><div class='attrHeader'>Live Load (psf)</div><div id='outRad' class='attrLabel'>40</div></div>");
    var loadInfo2 = $("<div  class='attrHolder' ><div class='attrHeader'>Railing Load (plf)</div><div id='outRad' class='attrLabel'>30</div></div>");
    materialDD = CreateLeftUIRowOneDD([[eMaterial.Steel, "Steel"], [eMaterial.Wood, "Wood"]]);
    materialDD.callback = (function () { modelObj.material = parseInt(materialDD.value); console.log(modelObj); });

    var inRadDD = [];
    for (var i = 0; i < innerRadiusArr.length; i++) {
        inRadDD.push([i, innerRadiusArr[i]]);
    }
    innerRadiusDD = CreateLeftUIRowOneDD(inRadDD);
    innerRadiusDD.callback = (function () { modelObj.innerRadius = parseInt(innerRadiusDD.value); console.log(modelObj); $("#outRad").html(modelObj.outerRadius); });

    var stringDD = [];
    for (var i = 0; i < stringerThickArr.length; i++) {
        stringDD.push([i, stringerThickArr[i]]);
    }
    stringerThickDD = CreateLeftUIRowOneDD(stringDD);
    stringerThickDD.callback = (function () { modelObj.stringerThick = parseInt(stringerThickDD.value); console.log(modelObj); });

    var connTypeDD = [];
    for (var i = 0; i < connectionTypeArr.length; i++) {
        connTypeDD.push([i, connectionTypeArr[i]]);
    }
    connectionTypeDD = CreateLeftUIRowOneDD(connTypeDD);
    connectionTypeDD.callback = (function () { modelObj.connectionType = parseInt(connectionTypeDD.value); console.log(modelObj); });
    //
    //
    //maufactorDD = CreateLeftUIRowOneDD([["viracon", "Viracon"], ["guardian", "Guardian"]]);

    //maufactorDD.callback = (function () { });

    materialDD.value = modelObj.material;
    innerRadiusDD.value = modelObj.innerRadius;
    stringerThickDD.value = modelObj.stringerThick;
    connectionTypeDD.value = modelObj.connectionType;

    $(material).append(materialDD.Html);
    $(innerRadius).append(innerRadiusDD.Html);
    $(thicknessStringer).append(stringerThickDD.Html);
    $(connectionType).append(connectionTypeDD.Html);

    $(leftUIholder).append(header);
    $(leftUIholder).append(material);
    $(leftUIholder).append(innerRadius);
    $(leftUIholder).append(outerRadius);
    $(leftUIholder).append(thicknessStringer);
    $(leftUIholder).append(connectionType);

    $(leftUIholder).append(loadInfo);
    $(leftUIholder).append(loadInfo2);


    $(".scenePanel").after(leftUIholder);


}
function DevModeSwitching_KeyEvents() {
    $(document).keydown(function (e) {
        var tag = e.target.tagName.toLowerCase();
        //if (e.which == 13 && tag != 'input' && tag != 'textarea') {
        //    //enter
        //    Col_AddAttributes.ColContent.SetSelected(Col_AddAttributes.ColContent.buttonImg);
        //    SetMode(eNum_Modes.attrib);
        //}
        //if (e.which == 32 && tag != 'input' && tag != 'textarea') {
        //    //space

        //    colCreateFrit.ColContent.SetSelected(colCreateFrit.ColContent.buttonImg);
        //    SetMode(eNum_Modes.AddMoveFrit);
        //}
        if (e.which == 27 && tag != 'input' && tag != 'textarea') {
            //esc
            //if ($(UIpop_Fresize.popup).hasClass("show")) {
            //    UIpop_Fresize.hidePopup();
            //}

            SetMode(eModes.Default);
            UI.clearSelectedButton();
        }
        //if (e.which == 16 && tag != 'input' && tag != 'textarea') {
        //    //shift
        //    colRemoveFrit.ColContent.SetSelected(colRemoveFrit.ColContent.buttonImg);
        //    SetMode(eNum_Modes.removefrit);
        //}
        //if (e.which == 37 && tag != 'input' && tag != 'textarea') {
        //    //leftarrow
        //    colResizeFrit.ColContent.SetSelected(colResizeFrit.ColContent.buttonImg);
        //    SetMode(eNum_Modes.resizefrit);
        //}
    });
}

//UI button panel transition calls
function OpenMainUI() {



    UI.transitionUIpanel(0);
}
function Send() {
    SetMode(eModes.Default);
    UI.clearSelectedButton();
    UI.ToggleLoader();
    //ajax calls here 
    var json = JSON.stringify(modelObj);
    console.log(json);
    //GlazingCalculation.asmx/Calculate

    

    $.ajax({
        type: "POST",
        url: "http://sghnet-apps.sgh.com/AskSGH/webify/ParametricStair/StairService.asmx/GetStairData",
        //url: "/StairService.asmx/GetStairData", 
        cache: false,
        contentType: "application/json; charset=utf-8",
        data: "{ 'modelData':'" + json + "' }",
        dataType: "json",
        success: CalcReturn,
        error: AjaxFailed
    });
}

function CalcReturn(jsonData) {
    animate = false;
    Animate();
    CurrentMode = eModes.Stress;

    sceneHan.RemoveMesh(meshesSt, meshesSt);
    sceneHan.RemoveMesh(meshesDef, meshesDef);

    var data = JSON.parse(jsonData.d);

    var defMesh = JSON.parse(data.defJson);
    var stressMesh = JSON.parse(data.stressJson);
    //console.log("Mesh Loading...");
    sceneHan.LoadJsonMeshes(defMesh.meshes, meshesDef, false);
    sceneHan.LoadJsonMeshes(stressMesh.meshes, meshesSt, true);
    scene.SetCameraZoomToFit(meshesSt, 0.8);
    scene.SetSpotLight(scene.lCamera.position, scene.lControl.target, 2);

    stressMin = data.stressMin;
    stressMax = Number((parseFloat(data.stressMax)/1000).toFixed(2));
    defMin = data.defMin;
    defMax = Number((parseFloat(data.defMax)).toFixed(3));

    UpdateLegend();
    UI.ToggleLoader();

}

function UpdateLegend() {
    $(".thres").empty();
    $(".minMax").empty();

    if (CurrentMode == eModes.Stress && modelObj.material == 0) {
        $(".thres").append("3.0 ksi")
        $(".minMax").append("Current Option Stress: <br> ");
        $(".minMax").append("Max: " + stressMax + " ksi <br><br> *Local high stress<br> at supports. <br><br>*Color plot for <br>relative comparison.");
    } else if (CurrentMode == eModes.Stress && modelObj.material == 1) {
        $(".thres").append("0.5 ksi");
        $(".minMax").append("Current Option Stress: <br> ");
        $(".minMax").append("Max: " + stressMax + " ksi <br><br> *Local high stress<br> at supports. <br><br>*Color plot for <br>relative comparison.");
    } else if (CurrentMode == eModes.Deform) {
        $(".thres").append('0.5"');
        $(".minMax").append("Current Option Deflection: <br>");
        $(".minMax").append("Max: " + defMax + '" <br><br>*Color plot for <br>relative comparison.');

    }

   
    
}
function ToggleAnimate() {
    if (animate == true) {
        animate = false;
    } else if (animate == false) {
        animate = true;
    }
    Animate();
}

function Animate() {

    if (animate == true) {
        sceneHan.AnimateRepeatVertexMorphMotions(meshesSt, "ALL", 20);
        sceneHan.AnimateRepeatVertexMorphMotions(meshesDef, "ALL", 20);
        console.log("Animating...")
    }
    else {
        sceneHan.StopRepeatVertexMorphMotions(meshesSt);
        sceneHan.StopRepeatVertexMorphMotions(meshesDef);
    }
    
    UI.clearSelectedButton();

}

function SetMode(newMode) {
    CurrentMode = newMode;
    if (CurrentMode == eModes.Stress) {
        sceneHan.ToggleMeshVisibility(meshesSt, true);
        sceneHan.ToggleMeshVisibility(meshesDef, false);
    } else if (CurrentMode == eModes.Deform) {
        sceneHan.ToggleMeshVisibility(meshesSt, false);
        sceneHan.ToggleMeshVisibility(meshesDef, true);
    }
    UpdateLegend();
    console.log("Current mode: " + CurrentMode);
}

//UI panels
function CreateMainUI() {


    Col_Calculate = new sUIcolumn(ColContentType.Button,
        new sUIimgbutton("UIelements/Check.png", () => Send(),
            new sUIPosition("calc(50% - " + ((ButtonSize.MEDIUM[1] + 20) / 2) + "px)"),
            new sUIsize(ButtonSize.MEDIUM), "#333333", "Calculate"));

    Col_Stress = new sUIcolumn(ColContentType.Button,
        new sUIimgbutton("UIelements/stress.png", () => SetMode(eModes.Stress), 
            new sUIPosition("calc(50% - " + ((ButtonSize.MEDIUM[1] + 20) / 2) + "px)"),
            new sUIsize(ButtonSize.MEDIUM), "#333333", "Stress"));

    Col_Deform = new sUIcolumn(ColContentType.Button,
        new sUIimgbutton("UIelements/Deform.png", () => SetMode(eModes.Deform),
            new sUIPosition("calc(50% - " + ((ButtonSize.MEDIUM[1] + 20) / 2) + "px)"),
            new sUIsize(ButtonSize.MEDIUM), "#333333", "Deflection"));

    Col_Ani = new sUIcolumn(ColContentType.Button,
        new sUIimgbutton("UIelements/Play.png", () => ToggleAnimate(),
            new sUIPosition("calc(50% - " + ((ButtonSize.MEDIUM[1] + 20) / 2) + "px)"),
            new sUIsize(ButtonSize.MEDIUM), "#333333", "Animate"));

    let Col_Blank = new sUIcolumn(ColContentType.blank, "");

    return new sUIpanel(new Array(Col_Calculate, Col_Stress, Col_Deform, Col_Ani), ButtonSize.MEDIUM);
}


function AjaxFailed(e) {
    console.log("error");
    UI.clearSelectedButton();
    UI.ToggleLoader();
    alert("Model data unavailable. Please select a different option.");

}

class Model {
    constructor(material, innerRadius, stringerThick, connectionType) {
        this.material = material;
        this.innerRadius = innerRadius;
        this.stringerThick = stringerThick;
        this.connectionType = connectionType;
    }
    get outerRadius() { return innerRadiusArr[this.innerRadius] + 48 } 
    
}