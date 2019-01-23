/****************************************************************************
 Copyright (c) 2013-2016 Chukong Technologies Inc.
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

import { Component } from '../../components/component';
import { ccclass, executeInEditMode, menu, property } from '../../core/data/class-decorator';
import { Camera, Model } from '../../renderer';
import { Material } from '../assets/material';
import { Mesh } from '../assets/mesh';
import { TextureCube } from '../assets/texture-cube';
import { createMesh } from '../misc/utils';
import { box } from '../primitive';

/**
 * !#en The Skybox Component
 *
 * !#ch 天空盒组件
 * @class SkyboxComponent
 * @extends Component
 */
@ccclass('cc.SkyboxComponent')
@menu('Components/SkyboxComponent')
@executeInEditMode
export default class SkyboxComponent extends Component {

    @property
    protected _cubemap = null;
    @property
    protected _rgbeTexture = false;

    @property({
        type: TextureCube,
        displayName: 'Cubemap',
    })
    get cubemap () {
        return this._cubemap;
    }

    set cubemap (val) {
        this._cubemap = val;
        if (this._material) { this._material.setProperty('cubeMap', this._cubemap); }
    }

    @property({
        type: Boolean,
        displayName: 'RGBE Texture',
    })
    set rgbeTexture (v) {
        this._rgbeTexture = v;
        if (this._material) { this._material.setDefines({ USE_RGBE_CUBEMAP: v }); }
    }
    get rgbeTexture () {
        return this._rgbeTexture;
    }

    protected _attachedCamera: Camera | null = null;
    protected _model: Model | null = null;
    protected _mesh: Mesh | null = null;
    protected _material: Material | null = null;

    public onLoad () {
        this._model = this._getRenderScene().createModel(Model, this.node);
        this._mesh = createMesh(box({ width: 2, height: 2, length: 2 }));
        this._material = new Material({
            effectName: 'builtin-effect-skybox',
            defines: { USE_RGBE_CUBEMAP: this._rgbeTexture },
        });
        if (this._cubemap) { this._material.setProperty('cubeMap', this._cubemap); }

        const subMeshData = this._mesh.renderingMesh!.getSubmesh(0);
        this._model.initSubModel(0, subMeshData!, this._material);
    }

    public onEnable () {
        if (this._model) { this._model.enabled = true; }
    }

    public onDisable () {
        if (this._model) { this._model.enabled = false; }
    }

    public onDestroy () {
        if (this._model) { this._model.destroy(); this._model = null; }
    }
}
