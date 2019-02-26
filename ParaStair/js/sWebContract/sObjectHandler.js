class sSceneHandler {
    constructor(sScene) {
        this.scene = sScene;
        this.staticFunctions = [];
        this.point_hover = {};
        this.point_clicked = {};
        this.mesh_hover = {};
        this.mesh_clicked = {};
        if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
            this.urlBase = '/Data/';
        }
        else {
            this.urlBase = location.href + 'Data/';
        }
    }

    //Package Loading


    //Mesh Loading
    LoadLocalJsonMeshSet(setName, objs, asVisible = true, fn) {
        let that = this;
        let url = this.urlBase;
        $.getJSON(url + setName + '.json', (set) => {
            that.LoadJsonMeshes(set.meshes, objs, asVisible);
        }).then(() => {
            if (fn instanceof Function) {
                fn();
            }
        })
    }
    LoadLocalJsonMeshSets(setNames, objs, asVisible = true, fn) {
        let that = this;
        let url = this.urlBase;
        let defs = [];
        for (let i = 0; i < setNames.length; ++i) {
            defs.push(
                $.getJSON(url + setNames[i] + '.json', (jm) => {
                    that.LoadJsonMeshes(jm.meshes, objs[i], asVisible);
                }).then(() => {
                    console.log((i + 1) + "/" + setNames.length);
                })
            );
        }
        $.when.apply($, defs).then(() => {
            if (fn instanceof Function) {
                fn();
            }
        })
    }
    LoadLocalJsonMeshList(listName, objs, asVisible = true, fn) {
        let that = this;
        let url = this.urlBase;
        $.getJSON(url + listName + '.json', (set) => {
            that.LoadJsonMeshes(set, objs, asVisible);
        }).then(() => {
            if (fn instanceof Function) {
                fn();
            }
        })
    }
    LoadLocalJsonMeshes(names, objs, asVisible = true, fn) {
        let that = this;
        let url = this.urlBase;
        let conv = new sObjectConverter();
        let defs = [];
        for (let i = 0; i < names.length; ++i) {
            defs.push(
                $.getJSON(url + names[i] + '.json', (jm) => {
                    that.LoadJsonMesh(jm, objs, asVisible);
                }).then(() => {
                    console.log((i + 1) + "/" + names.length);
                })
            );
        }
        $.when.apply($, defs).then(() => {
            if (fn instanceof Function) {
                fn();
            }
        })
    }
    LoadLocalJsonMesh(name, objs, asVisible = true, fn) {
        let url = this.urlBase;
        let conv = new sObjectConverter();
        let that = this;
        $.getJSON(url + name + '.json', (jm) => {
            that.LoadJsonMesh(jm, objs, asVisible);
        }).then(() => {
            if (fn instanceof Function) {
                fn();
            }
        });
    }
    LoadJsonMeshes(jms, objs, asVisible = true) {
        let conv = new sObjectConverter();
        let that = this;
        jms.forEach((jm) => {
            if (jm instanceof String || typeof jm === "string") {
                try {
                    that.LoadJsonMesh(JSON.parse(jm), objs, asVisible);
                }
                catch (e) {
                    //not a json
                }
            }
            else {
                that.LoadJsonMesh(jm, objs, asVisible);
            }
        });
    }
    LoadJsonMesh(jm, objs, asVisible = true) {
        let conv = new sObjectConverter();
        try {
            let tm = conv.ToThreeMesh(jm);
            if (asVisible == false) {
                //tm.material.opacity = 0.0;
                tm.visible = false;
            }
            else {
                tm.visible = true;
            }
            if (this.scene.options.forceShadowForNewMesh) {
                tm.castShadow = true;
                tm.receiveShadow = true;
            }
            this.scene.lScene.add(tm);
            if (objs != undefined && objs instanceof Array) {
                objs.push(tm);
            }
            if (jm.option.edgeColor != undefined) {
                this.scene.lScene.add(conv.ToThreeMeshEdge(tm, jm.option.edgeColor));
            }
        }
        catch (e) {
            console.log("Json Read Error.")
            //not a json
        }
    }
    /**
     * @description May need to change Hub name and function name
     */
    RequestsMeshFromServer(names, objs, fn) {
        $.connection.ASKSGH_Hub.server.jsonMeshFromServer(names).done((res) => {
            let data = JSON.parse(res);
            this.LoadJsonMeshes(data, objs);
        }).then(() => {
            if (fn instanceof Function) {
                fn();
            }
        });
    }
    RequestSystemMeshFromServer(modelName, scenario, objs, visible, fn) {
        $.connection.ASKSGH_Hub.server.jsonSystemFromServer(modelName, JSON.stringify(scenario)).done((res) => {
            let data = JSON.parse(res);
            this.LoadJsonMeshes(data.meshes, objs, visible);
        }).then(() => {
            if (fn instanceof Function) {
                fn();
            }
        });
    }


    //to be moved to loading js?
    LoadLocalJsonMeshLoading(setName, factor = 0.65) {
        let that = this;
        let url = this.urlBase;
        let vecs = [];
        let conv = new sObjectConverter();
        $.getJSON(url + setName + '.json', (set) => {
            let center = conv.ToThreeVector(set.boundingBox.center);
            let size = set.boundingBox.radius * factor;
            let fovRadian = this.scene.lCamera.fov * (Math.PI / 180);
            let distance = Math.abs(size / Math.sin(fovRadian / 2));
            let position = new THREE.Vector3(distance, distance, distance);
            this.scene.SetCamera(position, center);


            for (let i = 0; i < set.meshes.length; ++i) {
                for (let j = 0; j < set.meshes[i].vertices.length; ++j) {
                    if (j % 30 == 0) {
                       vecs.push(conv.ToThreeVector(set.meshes[i].vertices[j].location));
                    }
                }
            }
            vecs.forEach((v) => {
                var geometry = new THREE.CircleGeometry(0.2, 5);
                var material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
                var circle = new THREE.Mesh(geometry, material);
                circle.position.copy(v);
                this.scene.lScene.add(circle);
            })
        }).then(() => {
            //load?

        });
    }

    //update visibilities

    //Promise...damn
    FadeInMeshVisibilities(objs, targetOpacity = -1.0, speed = 30, toInitOpacity = true) {
        for (let i = 0; i < objs.length; ++i) {
            this.FadeInMeshVisibility(objs[i], targetOpacity, speed, toInitOpacity);
        }
    }
    FadeOutMeshVisibilities(objs, targetOpacity = 0.0, speed = 30, fromInitOpacity = true) {
        for (let i = 0; i < objs.length; ++i) {
            this.FadeOutMeshVisibility(objs[i], targetOpacity, speed, fromInitOpacity);
        }
    }
    FadeInMeshVisibility(obj, targetOpacity = -1.0, speed = 30, toInitOpacity = true) {
        let deformTime = 0.0;
        let fnName = "fadein_" + obj.uuid;
        let fadein = () => {
            let deformSpeed = speed;
            let deformState = deformTime * deformSpeed;
            let gaussian = 5;

            if (targetOpacity < 0.0) targetOpacity = obj.userData.sMesh.option.opacity;
            if (targetOpacity > obj.userData.sMesh.option.opacity) targetOpacity = obj.userData.sMesh.option.opacity;

            let gradientFactor = obj.material.opacity + (Math.exp(gaussian * deformState * deformState) - 1);
            if (gradientFactor > targetOpacity) gradientFactor = targetOpacity;

            this.UpdateMeshOpacity(obj, gradientFactor);
            if (gradientFactor == targetOpacity) {
                //removing function before fully updating opacity... 
                this.RemoveFunctionByIdentifier(fnName, this.scene.updateFunctions);
            }
            deformTime += 0.001;
        }
        fadein.identifier = fnName;
        this.scene.updateFunctions.push(fadein);
    }
    FadeOutMeshVisibility(obj, targetOpacity = 0.0, speed = 30, fromInitOpacity = true) {
        let deformTime = 0.0;
        let fnName = "fadeout_" + obj.uuid;
        let fadeout = () => {
            let deformSpeed = speed * 1.5;
            let deformState = deformTime * deformSpeed;
            let gaussian = 5;

            let maxOpa = 1.0;
            if (fromInitOpacity) maxOpa = obj.userData.sMesh.option.opacity;

            let gradientFactor = maxOpa - (Math.exp(gaussian * deformState * deformState) - 1);
            if (gradientFactor < targetOpacity) gradientFactor = targetOpacity;

            this.UpdateMeshOpacity(obj, gradientFactor);
            if (gradientFactor == targetOpacity) {
                //removing function before fully updating opacity... 
                this.RemoveFunctionByIdentifier(fnName, this.scene.updateFunctions);
            }
            deformTime += 0.001;
        }
        fadeout.identifier = fnName;
        this.scene.updateFunctions.push(fadeout);
    }
    ToggleMeshVisibility(obj, visible) {
        if (obj instanceof Array) {
            obj.forEach((o) => {
                if (o.type === "Mesh") o.visible = visible;
            })
        }
        else {
            if (obj.type === "Mesh") obj.visible = visible;
        }
    }
    UpdateMeshOpacity(obj, opacity) {
        if (obj.type === "Mesh") {
            obj.material.opacity = opacity;
        }
    }
    ResetMeshOpacity(obj) {
        if (obj.type == "Mesh") {
            obj.material.opacity = obj.userData.initOpacity;
        }
    }
    UpdateMeshColor(obj, tcol = null) {
        let geo = obj.geometry;
        let conv = new sObjectConverter();
        if (geo instanceof THREE.BufferGeometry) {
            let initcol = obj.userData.initColor;
            for (let i = 0; i < geo.attributes.color.array.length; i += 3) {
                let colthis = tcol;
                if (colthis == undefined) {
                    colthis = conv.ToInvertedThreeColor(new THREE.Color(initcol[i], initcol[i + 1], initcol[i + 2]));
                }
                geo.attributes.color.array[i] = colthis.r;
                geo.attributes.color.array[i + 1] = colthis.g;
                geo.attributes.color.array[i + 2] = colthis.b;
            }
            geo.attributes.color.needsUpdate = true;
        }
        else {
            //not confirmed
            for (let i = 0; i < geo.colors.array.length; i++) {
                let thiscol = tcol;
                if (colthis == undefined) {
                    colthis = conv.ToInvertedThreeColor(new THREE.Color(geo.colors.array[i].r, geo.colors.array[i].g, geo.colors.array[i].b));
                }
                geo.colors.array[i] = colthis;
            }
            geo.colorsNeedUpdate = true;
        }
    }
    ResetMeshColor(obj) {
        let geo = obj.geometry;
        let initcol = obj.userData.initColor;
        if (geo instanceof THREE.BufferGeometry) {
            for (let i = 0; i < geo.attributes.color.array.length; ++i) {
                geo.attributes.color.array[i] = initcol[i];
            }
            geo.attributes.color.needsUpdate = true;
        }
        else {
            //not confirmed
            for (let i = 0; i < geo.colors.array.length; i++) {
                geo.colors.array[i] = initcol;
            }
            geo.colorsNeedUpdate = true;
        }
    }

    //Get Remove
    RemoveMesh(obj, objs) {
        if (obj instanceof Array) {
            obj.forEach((o) => {
                if (o.type === "Mesh") {
                    o.material.dispose();
                    o.geometry.dispose();
                    this.scene.lScene.remove(o);
                }
            });
            if (objs != undefined) {
                for (let i = obj.length - 1; i >= 0; --i) {
                    let oindex = objs.indexOf(obj[i]);
                    if (oindex > -1) objs.splice(oindex, 1);
                }
            }
        }
        else {
            if (obj.type === "Mesh") {
                obj.material.dispose();
                obj.geometry.dispose();
                this.scene.lScene.remove(obj);
                if (objs != undefined) {
                    let oindex = objs.indexOf(obj);
                    if (oindex > -1) objs.splice(oindex, 1);
                }
            }
        }
    }
    GetMeshBysMeshName(name, objs) {
        let obj = null;
        for (let i = 0; i < objs.length; ++i) {
            if (objs[i].userData.sMesh.name == name) {
                obj = objs[i];
                break;
            }
        }
        return obj;
    }
    GetMeshesBysMeshNameContain(name, objs) {
        objlist = [];
        for (let i = 0; i < objs.length; ++i) {
            if (objs[i].userData.sMesh.name.includes(name)) {
                objlist.push(objs[i]);
            }
        }
        return objlist;
    }
    RemoveFunction(fnName, fnList) {
        let fnIndex = -1;
        fnList.forEach((fn, i) => {
            if (fn.name == fnName) {
                fnIndex = i;
            }
        });
        if (fnIndex > -1) {
            fnList.splice(fnIndex, 1);
        }
    }
    RemoveFunctionByIdentifier(identifier, fnList) {
        let fnIndex = -1;
        fnList.forEach((fn, i) => {
            if (fn.identifier == identifier) {
                fnIndex = i;
            }
        });
        if (fnIndex > -1) {
            fnList.splice(fnIndex, 1);
        }
    }
    DoesFunctionExistByIdentifier(identifier, fnList) {
        let fnIndex = -1;
        fnList.forEach((fn, i) => {
            if (fn.identifier == identifier) {
                fnIndex = i;
            }
        });
        if (fnIndex > -1) {
            return true;
        }
        else {
            return false;
        }
    }
    GetFunctionByIdentifier(identifier, fnList) {
        let fnIndex = -1;
        fnList.forEach((fn, i) => {
            if (fn.identifier == identifier) {
                fnIndex = i;
            }
        });
        if (fnIndex > -1) {
            return fnList[fnIndex];
        }
    }

    //Vertex Morph Motion
    AnimateRepeatVertexMorphMotions(objs, motionName, factor, speed = 40) {
        let deformTime = 0.0;
        let repeat = () => {
            let deformSpeed = speed;
            let gradientFactor = factor * (Math.abs(Math.cos(deformTime * deformSpeed) - 1));
            this.ApplyVertexMorphMotions(objs, motionName, gradientFactor);
            deformTime += 0.001;
        }
        this.scene.updateFunctions.push(repeat);
    }
    StopRepeatVertexMorphMotions(objs) {
        this.RemoveFunction("repeat", this.scene.updateFunctions);
        this.ResetMotion(objs);
    }
    AnimateLinearVertexMorphMotions(objs, motionName, factor, speed = 20) {
        let deformTime = 0.0;
        let linear = () => {
            let deformSpeed = speed;
            let deformState = deformTime * deformSpeed;
            let gaussian = 5;
            let gradientFactor = factor * (Math.exp(gaussian * deformState * deformState) - 1);
            if (gradientFactor > factor) gradientFactor = factor;
            this.ApplyVertexMorphMotions(objs, motionName, gradientFactor);
            if (gradientFactor == factor) {
                //removing function before fully animate?... 
                this.RemoveFunction("linear", this.scene.updateFunctions);
            }
            deformTime += 0.001;
        }
        this.scene.updateFunctions.push(linear);
    }
    ApplyVertexMorphMotions(objs, motionName, factor) {
        let conv = new sObjectConverter();
        objs.forEach((m) => {
            let geo = m.geometry;
            let sm = m.userData.sMesh;
            let faceCount = sm.faces.length;
            let verID = 0;
            for (let i = 0; i < faceCount; ++i) {
                let va = sm.vertices[sm.faces[i].A];
                let vb = sm.vertices[sm.faces[i].B];
                let vc = sm.vertices[sm.faces[i].C];

                let tva = conv.ToThreeVector(va.location);
                let tvb = conv.ToThreeVector(vb.location);
                let tvc = conv.ToThreeVector(vc.location);

                if (va.motions != null && vb.motions!= null && vc.motions != null) {

                    let ma = va.motions[motionName].motionVector;
                    let mb = vb.motions[motionName].motionVector;
                    let mc = vc.motions[motionName].motionVector;

                    let tma = conv.ToThreeVector(ma);
                    let tmb = conv.ToThreeVector(mb);
                    let tmc = conv.ToThreeVector(mc);

                    geo.attributes.position.array[verID] = (tva.x + (tma.x * factor));
                    geo.attributes.position.array[verID + 1] = (tva.y + (tma.y * factor));
                    geo.attributes.position.array[verID + 2] = (tva.z + (tma.z * factor));
                    geo.attributes.position.array[verID + 3] = (tvb.x + (tmb.x * factor));
                    geo.attributes.position.array[verID + 4] = (tvb.y + (tmb.y * factor));
                    geo.attributes.position.array[verID + 5] = (tvb.z + (tmb.z * factor));
                    geo.attributes.position.array[verID + 6] = (tvc.x + (tmc.x * factor));
                    geo.attributes.position.array[verID + 7] = (tvc.y + (tmc.y * factor));
                    geo.attributes.position.array[verID + 8] = (tvc.z + (tmc.z * factor));
                }

                verID += 9;
            }
            geo.attributes.position.needsUpdate = true;
            geo.computeBoundingSphere();
            geo.computeFaceNormals();
        });
    }

    //Mesh Motion
    AnimateLinearMeshMotions(objs, factor, speed = 20) {
        let globalDelay = this.GetGlobalMaxDelay(objs);

        for (let i = 0; i < objs.length; ++i) {
            let motionData = objs[i].userData.sMesh.motions;
            if (motionData == undefined) continue;
            if (motionData.length == 1) {
                this.AnimateSingleLinearMeshMotion(objs[i], factor, globalDelay, true, 0, speed);
            }
            else {
                for (let j = 0; j < motionData.length; ++j) {
                    if (j == motionData.length - 1) {
                        this.AnimateSingleLinearMeshMotion(objs[i], factor, globalDelay, true, j, speed);
                    }
                    else {
                        this.AnimateSingleLinearMeshMotion(objs[i], factor, globalDelay, false, j, speed);
                    }
                }
            }

        }
    }
    AnimateSingleLinearMeshMotion(obj, factor, globalDelay, reverse = true, motionIndex = 0, speed = 20) {
        if (obj.userData.sMesh.motions == undefined) return;
        let fnName = "linearmotion_" + motionIndex + "_" + obj.uuid;
        let deformTime = 0.0;
        let linearMesh = () => {
            let deformSpeed = speed;
            let deformState = deformTime * deformSpeed;
            let gaussian = 5;
            let gradientFactor = factor * (Math.exp(gaussian * deformState * deformState) - 1);
            if (gradientFactor > factor) gradientFactor = factor;
            this.ApplySingleMeshMotion(obj, gradientFactor, motionIndex);
            if (gradientFactor == factor) {
                //
                if (reverse == true) {
                    this.ReverseMeshMotion(obj, globalDelay);
                }
                else {
                    this.PrepareNextMeshMotion(obj);
                }
                //
                this.RemoveFunctionByIdentifier(fnName, this.scene.updateFunctions);
            }
            deformTime += 0.001;
        }
        linearMesh.identifier = fnName;

        let delay = obj.userData.sMesh.motions[motionIndex].delay;
        setTimeout(() => {
            this.scene.updateFunctions.push(linearMesh);
        }, delay);
    }
    ApplyMeshMotions(objs, factor) {
        for (let i = 0; i < objs.length; ++i) {
            if (objs[i].userData.sMesh.motions != undefined) {
                let delay = objs[i].userData.sMesh.motions[0].delay;
                if (delay > 0) {
                    setTimeout(() => {
                        this.ApplySingleMeshMotion(objs[i], factor);
                    }, delay);
                }
                else {
                    this.ApplySingleMeshMotion(objs[i], factor);
                }
            }
        }
    }
    ApplySingleMeshMotion(obj, factor, motionIndex = 0) {
        let conv = new sObjectConverter();
        let sm = obj.userData.sMesh;
        if (sm.motions != undefined) {
            let motionVec = conv.ToThreeVector(sm.motions[motionIndex].motionVector);
            motionVec.multiplyScalar(factor);
            let initposi = obj.userData.initPosition;
            let currentPosition = new THREE.Vector3(initposi.x, initposi.y, initposi.z);
            currentPosition.x += motionVec.x;
            currentPosition.y += motionVec.y;
            currentPosition.z += motionVec.z;

            obj.position.copy(currentPosition);
        }
    }
    PrepareNextMeshMotion(obj) {
        obj.userData.initPosition.copy(obj.position);
    }
    GetGlobalMaxDelay(objs) {
        let maxDelay = 0.0;
        for (let i = 0; i < objs.length; ++i) {
            let sm = objs[i].userData.sMesh;
            if (sm.motions == undefined) continue;
            sm.motions.forEach((m) => {
                if (m.delay > maxDelay) maxDelay = m.delay;
            });
        }
        return maxDelay;
    }
    ReverseMeshMotion(obj, globalDelay) {
        let sm = obj.userData.sMesh;
        if (sm.motions == null) return;
        obj.userData.initPosition.copy(obj.position);

        sm.motions.reverse();
        for (let i = 0; i < sm.motions.length; ++i) {
            sm.motions[i].motionVector.X *= -1;
            sm.motions[i].motionVector.Y *= -1;
            sm.motions[i].motionVector.Z *= -1;

            sm.motions[i].delay = globalDelay - sm.motions[i].delay;
        }

    }
    //Reset All Motions
    ResetMotion(objs) {
        objs.forEach((o) => {
            let geo = o.geometry;
            let initposi = o.userData.initPositions;
            for (let i = 0; i < geo.attributes.position.array.length; ++i) {
                geo.attributes.position.array[i] = initposi[i];
            }
            geo.attributes.position.needsUpdate = true;
        });
    }

    //RayCasting
    /**
    * @description type => "object" for Mesh, "face" for Face, "point" for Point
    */
    GetIntersectingObject(objs, type = "object", order = 0) {
        let io = this.GetIntersects(objs);
        if (io.length > 0) {
            if (order > io.length - 1) order = io.length - 1;
            return io[order][type];
        }
    }
    GetIntersects(objs) {
        this.scene.lRaycaster.setFromCamera(this.scene.mouseForRaycaster, this.scene.lCamera);
        let intersects;
        if (objs instanceof Array) {
            intersects = this.scene.lRaycaster.intersectObjects(objs, true);
        } else {
            intersects = this.scene.lRaycaster.intersectObject(objs, true);
        }
        return intersects;
    }

    //Point UI handling
    AddPointUI(r, name, c = new THREE.Color(1, 1, 1)) {
        let geometry = new THREE.SphereGeometry(r, 32, 32);
        let material = new THREE.MeshBasicMaterial({ color: c });
        let sphere = new THREE.Mesh(geometry, material);
        sphere.visible = false;
        sphere.userData.name = name;
        this.point_hover[name] = sphere;
        this.scene.lScene.add(sphere);
    }
    ToggleMousemovePointUI(objs, toggle, identifier = "pointuimove", cursorChange = true, size = 0.1, col = new THREE.Color(0.3, 0.3, 0.3)) {
        let ex = this.DoesFunctionExistByIdentifier(identifier, this.staticFunctions);
        if (ex == false) {
            let movepointui = (e) => {
                e.preventDefault();
                let io = this.GetIntersectingObject(objs, "point");
                if (io != undefined) {
                    this.point_hover[identifier].position.set(io.x, io.y, io.z);
                    this.point_hover[identifier].visible = true;
                    if (cursorChange) $('#' + this.scene.containerID).css('cursor', 'pointer');
                }
                else {
                    this.point_hover[identifier].visible = false;
                    if (cursorChange) $('#' + this.scene.containerID).css('cursor', 'default');
                }
            }
            movepointui.identifier = identifier;
            this.staticFunctions.push(movepointui);
        }
        let eventFunc = this.GetFunctionByIdentifier(identifier, this.staticFunctions);
        if (toggle) {
            if (this.point_hover[identifier] == undefined) {
                this.AddPointUI(size, identifier, col);
            }
            this.ToggleSceneEventHandler('mousemove', eventFunc, true);
        }
        else {
            this.point_hover[identifier].visible = false;
            this.RemoveMesh(this.point_hover[identifier]);
            delete this.point_hover[identifier];
            this.ToggleSceneEventHandler('mousemove', eventFunc, false);
            this.RemoveFunctionByIdentifier(identifier, this.staticFunctions);
        }
    }
    //Mesh UI handling
    ToggleMousemoveMeshUI(objs, toggle, identifier = "meshuimove", cursorChange = true, col = null, opa = 1.0) {
        let ex = this.DoesFunctionExistByIdentifier(identifier, this.staticFunctions);
        if (ex == false) {
            let movemeshui = (e) => {
                e.preventDefault();
                let io = this.GetIntersectingObject(objs, "object");
                if (io != undefined) {
                    this.UpdateMeshColor(io, col);
                    this.UpdateMeshOpacity(io, opa);
                    if (cursorChange) $('#' + this.scene.containerID).css('cursor', 'pointer');
                    if (io != this.mesh_hover[identifier] && this.mesh_hover[identifier] != undefined) {
                        this.ResetMeshColor(this.mesh_hover[identifier]);
                        this.ResetMeshOpacity(this.mesh_hover[identifier]);
                        if (cursorChange) $('#' + this.scene.containerID).css('cursor', 'default');
                    }
                    this.mesh_hover[identifier] = io;
                }
                else {
                    if (this.mesh_hover[identifier] != undefined) {
                        this.ResetMeshColor(this.mesh_hover[identifier]);
                        this.ResetMeshOpacity(this.mesh_hover[identifier]);
                    }
                    this.mesh_hover[identifier] = null;
                    if (cursorChange) $('#' + this.scene.containerID).css('cursor', 'default');
                }
            }
            movemeshui.identifier = identifier;
            this.staticFunctions.push(movemeshui);
        }
        let eventFunc = this.GetFunctionByIdentifier(identifier, this.staticFunctions);
        if (toggle) {
            this.ToggleSceneEventHandler('mousemove', eventFunc, true);
        }
        else {
            //restore all attirbutes
            if (this.mesh_hover[identifier] != undefined) {
                this.ResetMeshColor(this.mesh_hover[identifier]);
                this.ResetMeshOpacity(this.mesh_hover[identifier]);
            }
            delete this.mesh_hover[identifier];
            this.ToggleSceneEventHandler('mousemove', eventFunc, false);
            this.RemoveFunctionByIdentifier(identifier, this.staticFunctions);
        }
    }
    //Text UI handling
    ToggleMouseclickTag2D(toggle, objs, tags, identifier = "clicktag") {
        let ex = this.DoesFunctionExistByIdentifier(identifier, this.staticFunctions);
        if (ex == false) {
            let clicktag = (e) => {
                e.preventDefault();
                if (e.which == 1) {
                    let io = this.GetIntersectingObject(objs, "point");
                    let im = this.GetIntersectingObject(objs, "object");
                    let ifa = this.GetIntersectingObject(objs, "face");
                    if (io != undefined && im != undefined) {
                        //here later add pop up input ui
                        //and feed text, size, offset, justification, and else
                        let tx = 'This is a test label that should maintain the screen space size when zooming in the 3d environment.  <br>  <br> This is a test label that should maintain the screen space size. <br>  <br> newline';
                        tags.push(this.AddTag2D(io, im, ifa, tx, eTagVisibilityType.ByRayCasting, 15));
                        //this.AddTag3D(io, im, "Perimeter SS Spacer W/ Silicone Seal TYP.\nABCDEFGHIJKLMNOPQRSTUVWXYZ");
                    }
                }
            }
            clicktag.identifier = identifier;
            this.staticFunctions.push(clicktag);
        }
        let eventFunc = this.GetFunctionByIdentifier(identifier, this.staticFunctions);
        if (toggle) {
            this.ToggleSceneEventHandler('mousedown', eventFunc, true);
        }
        else {
            this.ToggleSceneEventHandler('mousedown', eventFunc, false);
            this.RemoveFunctionByIdentifier(identifier, this.staticFunctions);
        }

    }
    AddTag3D(pointAt, objectOn, Tx, size = 30) {
        let label = new Tag3d(Tx, size);
        label.parent = objectOn;

        label.offsetVector.x = pointAt.x - objectOn.position.x;
        label.offsetVector.y = pointAt.y - objectOn.position.y;
        label.offsetVector.z = pointAt.z - objectOn.position.z;

        label.draw();
        //later..how to remove label and update functions?
        this.scene.lScene.add(label.sprite);
        this.scene.updateFunctions.push(() => { label.updatePosition() });
    }
    AddTag2D(pointAt, objectOn, faceOn, Tx, type = eTagVisibilityType.ByNormal, size = 30) {
        let label = new Tag2d(Tx, size);
        label.visiblityCheckType = type;
        label.parent = objectOn;
        label.parentNormal = faceOn.normal;
        label.offsetVector.x = pointAt.x - objectOn.position.x;
        label.offsetVector.y = pointAt.y - objectOn.position.y;
        label.offsetVector.z = pointAt.z - objectOn.position.z;

        let centerPosition = this.scene.GetScreenPosition(this.scene.center);
        label.Draw(this.scene.containerID);
        label.SetJustification(centerPosition, this.scene.containerID, this.scene.lCamera);

        return label;
        //later..how to remove label and update functions?
    }
    UpdateTag2Ds(tags) {
        let caster = new THREE.Raycaster();
        let updateTags = () => {
            if (tags != undefined) {
                for (let i = 0; i < tags.length; ++i) {
                    let centerPosition = this.scene.GetScreenPosition(this.scene.center);
                    tags[i].UpdateTag(this.scene, caster, centerPosition);
                }
            }
        }
        this.scene.updateFunctions.push(updateTags);
    }

    //general event handling
    ToggleSceneEventHandler(eventType, eventFunc, activate) {
        if (activate) {
            sceneHan.scene.AddEventHandler(eventType, eventFunc, true);
        }
        else {
            sceneHan.scene.RemoveEventHandler(eventType, eventFunc, true);
        }
    }
}

class sObjectConverter {
    constructor() {

    }
    ToThreeVector(svec) {
        return new THREE.Vector3(svec.X, svec.Z, -1 * svec.Y);
    }
    ToThreeColor(scol) {
        return new THREE.Color((scol.R / 255), (scol.G / 255), (scol.B / 255));
    }
    ToHex(tcol) {
        let componentToHex = (c) => {
            let hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
        }
        return "#" + componentToHex(tcol.r * 255) + componentToHex(tcol.g * 255) + componentToHex(tcol.b * 255);
    }
    ToInvertedThreeColor(tcol) {
        return new THREE.Color(1.0 - tcol.r, 1.0 - tcol.g, 1.0 - tcol.b);
    }
    ToThreeMaterial(sm) {
        let tMat = null;
        if (sm.option.useTexture) {
            let texture;
            //let rainbow = false;
            //if (rainbow) {
            texture = new THREE.TextureLoader().load('Data/LegendColorBar.png');
            //}
            //else {
            //    texture = new THREE.TextureLoader().load('Data/LegendCyanBar.png');
            //}
            texture.mapping = THREE.UVMapping;
            tMat = new THREE.MeshPhysicalMaterial({
                metalness: 0.2,
                roughness: 0.9,
                clearCoat: 0.5,
                clearCoatRoughness: 1.0,
                reflectivity: 0.2,
                transparent: true,
                opacity: sm.option.opacity,
                refractionRatio: 1.0,
                alphaTest: 0.5,
                map: texture
            });
        }
        else {
            tMat = new THREE.MeshPhysicalMaterial({
                metalness: 0.0,
                roughness: 0.0,
                clearCoat: 0.5,
                clearCoatRoughness: 1.0,
                reflectivity: 0.9,
                //refractionRatio: 1.0,
                //alphaTest: 0.5,
                transparent: true,
                opacity: sm.option.opacity,
                vertexColors: THREE.VertexColors
            });
        }
        //tMat.side = THREE.FrontSide;
        tMat.side = THREE.DoubleSide;
        return tMat;
    }
    ToThreePhongMaterial(sm) {
        let tMat = null;
        if (sm.option.useTexture) {

        }
        else {
            tMat = new THREE.MeshPhongMaterial({
                transparent: true,
                opacity: sm.option.opacity,
                vertexColors: THREE.VertexColors,
                //shininess: 0.5,
                //reflectivity: 0.5
            });
        }
        tMat.side = THREE.DoubleSide;
        return tMat;
    }
    ToThreeLambertMaterial(sm) {
        let tMat = null;
        if (sm.option.useTexture) {

        }
        else {
            tMat = new THREE.MeshLambertMaterial({
                vertexColors: THREE.VertexColors,
            });
        }
        tMat.side = THREE.DoubleSide;
        return tMat;
    }
    ToThreeBufferGeometry_sMesh(sm) {
        let geo = new THREE.BufferGeometry();
        let faceCount = sm.faces.length;
        let vPositions = new Float32Array(faceCount * 3 * 3);
        let vNormals = new Float32Array(faceCount * 3 * 3);
        let vColors = new Float32Array(faceCount * 3 * 3);
        let vUVs = new Float32Array(faceCount * 3 * 2);

        let verID = 0;
        let uvID = 0;
        for (let i = 0; i < faceCount; ++i) {
            let va = sm.vertices[sm.faces[i].A];
            let vb = sm.vertices[sm.faces[i].B];
            let vc = sm.vertices[sm.faces[i].C];

            let tva = this.ToThreeVector(va.location);
            let tvb = this.ToThreeVector(vb.location);
            let tvc = this.ToThreeVector(vc.location);

            vPositions[verID] = tva.x;
            vPositions[verID + 1] = tva.y;
            vPositions[verID + 2] = tva.z;
            vPositions[verID + 3] = tvb.x;
            vPositions[verID + 4] = tvb.y;
            vPositions[verID + 5] = tvb.z;
            vPositions[verID + 6] = tvc.x;
            vPositions[verID + 7] = tvc.y;
            vPositions[verID + 8] = tvc.z;

            vNormals[verID] = va.normal.X;
            vNormals[verID + 1] = va.normal.Y;
            vNormals[verID + 2] = va.normal.Z;
            vNormals[verID + 3] = vb.normal.X;
            vNormals[verID + 4] = vb.normal.Y;
            vNormals[verID + 5] = vb.normal.Z;
            vNormals[verID + 6] = vc.normal.X;
            vNormals[verID + 7] = vc.normal.Y;
            vNormals[verID + 8] = vc.normal.Z;

            vColors[verID] = this.ToThreeColor(va.color).r;
            vColors[verID + 1] = this.ToThreeColor(va.color).g;
            vColors[verID + 2] = this.ToThreeColor(va.color).b;
            vColors[verID + 3] = this.ToThreeColor(vb.color).r;
            vColors[verID + 4] = this.ToThreeColor(vb.color).g;
            vColors[verID + 5] = this.ToThreeColor(vb.color).b;
            vColors[verID + 6] = this.ToThreeColor(vc.color).r;
            vColors[verID + 7] = this.ToThreeColor(vc.color).g;
            vColors[verID + 8] = this.ToThreeColor(vc.color).b;

            vUVs[uvID + 0] = 0;
            vUVs[uvID + 1] = 0.5;
            vUVs[uvID + 2] = 0;
            vUVs[uvID + 3] = 0.5;
            vUVs[uvID + 4] = 0;
            vUVs[uvID + 5] = 0.5;

            verID += 9;
            uvID += 6;
        }

        geo.addAttribute('position', new THREE.BufferAttribute(vPositions, 3).setDynamic(true));
        geo.addAttribute('normal', new THREE.BufferAttribute(vNormals, 3).setDynamic(true));
        if (sm.option.useTexture) {
            geo.addAttribute('uv', new THREE.BufferAttribute(vUVs, 2).setDynamic(true));
        }
        else {
            geo.addAttribute('color', new THREE.BufferAttribute(vColors, 3).setDynamic(true));
        }
        geo.computeBoundingSphere();
        geo.computeFaceNormals();
        geo.computeVertexNormals();
        geo.normalsNeedUpdate = true;
        return geo;
    }
    ToThreeMesh(sm) {
        let geo = this.ToThreeBufferGeometry_sMesh(sm);
        //let mat = this.ToThreeMaterial(sm);
        let mat = this.ToThreePhongMaterial(sm);
        let tm = new THREE.Mesh(geo, mat);
        tm.visible = sm.option.visible;
        tm.renderOrder = sm.option.renderOrder;
        if (sm.option.castShadow != undefined) tm.castShadow = sm.option.castShadow;
        if (sm.option.receiveShadow != undefined) tm.receiveShadow = sm.option.receiveShadow;
        //tm.castShadow = true;
        //tm.receiveShadow = true;
        
        tm.userData.name = sm.name;
        tm.userData.sMesh = sm;

        tm.userData.initPosition = new THREE.Vector3(tm.position.x, tm.position.y, tm.position.z);

        tm.userData.initPositions = JSON.parse(JSON.stringify(geo.getAttribute('position').array));
        tm.userData.initOpacity = sm.option.opacity;
        tm.userData.initColor = JSON.parse(JSON.stringify(geo.getAttribute('color').array));
        return tm;
    }
    ToThreeMeshEdge(tMesh, edgeColor) {
        let geo = tMesh.geometry
        let edges = new THREE.EdgesGeometry(geo);
        let col = this.ToThreeColor(edgeColor);
        let lines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
            color: col
        }));

        lines.userData.name = tMesh.userData.name + "_Edge";
        lines.userData.isEdge = true;
        lines.visible = tMesh.userData.sMesh.option.visible;
        tMesh.userData.edgeID = lines.id;

        return lines;
    }
}

class sScenario {
    constructor(name, loadCase, areaType, frameType, du = -1, areaThreshold = -1, frameThreshold = -1) {
        this.name = name;
        this.loadCase = loadCase;
        this.areaType = areaType;
        this.areaThreshold = areaThreshold;
        this.frameType = frameType;
        this.frameThreshold = frameThreshold;
        this.du = du;
        this.UIcomponents = null;
    }
}

const eFrameResultType = {
    NONE: 0,
    FORCE_1: 1,
    FORCE_2: 2,
    FORCE_3: 3,
    MOMENT_1: 4,
    MOMENT_2: 5,
    MOMENT_3: 6,
    DEFORMATION_GLOBAL: 7,
    STRESS_AXIAL_11: 8,
    STRESS_SHEAR_12: 9,
    STRESS_SHEAR_13: 10,
    STRESS_PRINCIPAL_MIN: 11,
    STRESS_PRINCIPAL_MAX: 12,
    STRESS_VONMISES: 13,
    MODAL: 14,
}

const eAreaResultType = {
    NONE: 0,
    DEFORMATION_GLOBAL: 1,
    F_11: 2,
    F_22: 3,
    F_12: 4,
    F_MAX: 5,
    F_MIN: 6,
    F_ANGLE: 7,
    F_VM: 8,
    M_11: 9,
    M_22: 10,
    M_12: 11,
    M_MAX: 12,
    M_MIN: 13,
    M_ANGLE: 14,
    V_13: 15,
    V_23: 16,
    V_MAX: 17,
    V_ANGLE: 18,
    S_11_TOP: 19,
    S_22_TOP: 20,
    S_12_TOP: 21,
    S_MAX_TOP: 22,
    S_MIN_TOP: 23,
    S_ANGLE_TOP: 24,
    S_VM_TOP: 25,
    S_11_BOT: 26,
    S_22_BOT: 27,
    S_12_BOT: 28,
    S_MAX_BOT: 29,
    S_MIN_BOT: 30,
    S_ANGLE_BOT: 31,
    S_VM_BOT: 32,
    S_13_AVG: 33,
    S_23_AVG: 34,
    S_MAX_AVG: 35,
    S_ANGLE_AVG: 36
}


