using sDataObjectBase.sElement.sResultObj.sAreaResult;
using sDataObjectBase.sElement.sSystemObj;
using sDataObjectBase.sGeometry;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Services;
using Newtonsoft.Json;
using sDataObjectBase.sPackageObj.sScenarioObj;

namespace ParaStair
{
    /// <summary>
    /// Summary description for StairService
    /// </summary>
    [WebService(Namespace = "http://tempuri.org/")]
    [WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]

    [System.ComponentModel.ToolboxItem(false)]
    // To allow this Web Service to be called from script, using ASP.NET AJAX, uncomment the following line. 
    [System.Web.Script.Services.ScriptService]
    //[ScriptMethod(ResponseFormat = ResponseFormat.Json)] 

    public class StairService : System.Web.Services.WebService
    {

        [WebMethod]
        public string GetStairData(string modelData)
        {
            dynamic paramSet = JsonConvert.DeserializeObject<dynamic>(modelData);

            double defThreshold = 0.5;
            double stressThreshold = 0;
            if (paramSet.material == 0) 
            {
                stressThreshold = 3000; //steel psi
            }
            else
            {
                stressThreshold = 500; //wood psi
            }

            IsSystem sysDef = GetSystem(paramSet);
            IsSystem sysStress = GetSystem(paramSet);
            
            string[] defData = GetSystemMesh(sysDef, eAreaResultType.DEFORMATION_GLOBAL, "ALL", defThreshold);
            string[] stressData = GetSystemMesh(sysStress, eAreaResultType.S_VM_AVG, "ALL", stressThreshold);

            DataPackage data = new DataPackage();
            data.defMin = defData[0];
            data.defMax = defData[1];
            data.defJson = defData[2];
            data.stressMin = stressData[0];
            data.stressMax = stressData[1];
            data.stressJson = stressData[2];

            string dataJson = JsonConvert.SerializeObject(data);

            return dataJson;
        }

        private IsSystem GetSystem(dynamic modelData)
        {
            string selectedJson = modelData.material + "_" + modelData.innerRadius + "_" + modelData.stringerThick + "_" + modelData.connectionType;
            string rpath = HttpContext.Current.Server.MapPath("~/Data/");
            IsSystem sys = null;
            try
            {
                string text = System.IO.File.ReadAllText(rpath + selectedJson + ".json");

                //Console.WriteLine(text);
                sys = sSystemBase.Objectify(text);
            }
            catch
            {
                sys = null;
            }

            return sys;
        }

        private string [] GetSystemMesh(IsSystem sys, eAreaResultType resultType, string caseName, double threshold)
        {
            sSEScenario sc = new sSEScenario();
            sc.areaThreshold = threshold;
            sc.areaType = resultType;
            sc.loadCase = caseName;
            sBoundingBox bx;

            string json = sys.ConstructSystemPreviewMesh(sc, false, out bx).Jsonify(true);
            
            sRange dataRange = sys.GetAreaResultRange(caseName, resultType);
            string min = dataRange.min.ToString();
            string max = dataRange.max.ToString();

            string[] data = new string[3] {min, max, json};

            return data;
        }


    }

    public class DataPackage
    {
        public string defMin;
        public string defMax;
        public string defJson;
        public string stressMin;
        public string stressMax;
        public string stressJson;
    }
}
