/*
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

 http://www.cocos.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
  worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
  not use Cocos Creator software for developing other software or tools that's
  used for developing games. You are not granted to publish, distribute,
  sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
*/

/**
 * @hidden
 */

import { RenderingSubMesh, Mesh } from '../../core/assets/mesh';
import { GFX_DRAW_INFO_SIZE, GFXBuffer, IGFXIndirectBuffer } from '../../core/gfx/buffer';
import { GFXAttributeName, GFXBufferUsageBit, GFXFormatInfos,
    GFXMemoryUsageBit, GFXPrimitiveMode } from '../../core/gfx/define';
import { IGFXAttribute } from '../../core/gfx/input-assembler';
import { Color } from '../../core/math/color';
import { Model, ModelType } from '../../core/renderer/scene/model';
import { Particle } from '../particle';

const _uvs = [
    0, 0, // bottom-left
    1, 0, // bottom-right
    0, 1, // top-left
    1, 1, // top-right
];

export default class ParticleBatchModel extends Model {

    private _capacity: number;
    private _vertAttrs: IGFXAttribute[] | null;
    private _vertSize: number;
    private _vBuffer: ArrayBuffer | null;
    private _vertAttrsFloatCount: number;
    private _vdataF32: Float32Array | null;
    private _vdataUint32: Uint32Array | null;
    private _iaInfo: IGFXIndirectBuffer;
    private _iaInfoBuffer: GFXBuffer;
    private _subMeshData: RenderingSubMesh | null;
    private _mesh: Mesh | null;
    private _vertCount: number = 0;
    private _indexCount: number = 0;
    private _startTimeOffset: number = 0;
    private _lifeTimeOffset: number = 0;
    private _iaInfoBufferReady: boolean = true;

    constructor () {
        super();

        this.type = ModelType.PARTICLE_BATCH;
        this._capacity = 0;
        this._vertAttrs = null;
        this._vertSize = 0;
        this._vBuffer = null;
        this._vertAttrsFloatCount = 0;
        this._vdataF32 = null;
        this._vdataUint32 = null;
        this._iaInfo = {
            drawInfos: [{
                vertexCount: 0,
                firstVertex: 0,
                indexCount: 0,
                firstIndex: 0,
                vertexOffset: 0,
                instanceCount: 0,
                firstInstance: 0,
            }],
        };
        this._iaInfoBuffer = this._device.createBuffer({
            usage: GFXBufferUsageBit.INDIRECT,
            memUsage: GFXMemoryUsageBit.HOST | GFXMemoryUsageBit.DEVICE,
            size: GFX_DRAW_INFO_SIZE,
            stride: GFX_DRAW_INFO_SIZE,
        });
        this._subMeshData = null;
        this._mesh = null;
    }

    public setCapacity (capacity: number) {
        const capChanged = this._capacity !== capacity;
        this._capacity = capacity;
        if (this._inited && capChanged) {
            this._recreateBuffer();
        }
    }

    public setVertexAttributes (mesh: Mesh | null, attrs: IGFXAttribute[]) {
        if (this._mesh === mesh && this._vertAttrs === attrs) {
            return;
        }
        this._mesh = mesh;
        this._vertAttrs = attrs;
        this._vertSize = 0;
        for (const a of this._vertAttrs) {
            (a as any).offset = this._vertSize;
            this._vertSize += GFXFormatInfos[a.format].size;
        }
        this._vertAttrsFloatCount = this._vertSize / 4; // number of float
        // rebuid
        this._vBuffer = this._createSubMeshData();
        this._vdataF32 = new Float32Array(this._vBuffer);
        this._vdataUint32 = new Uint32Array(this._vBuffer);
        this._inited = true;
    }

    public _createSubMeshData (): ArrayBuffer {
        this.destroySubMeshData();
        this._vertCount = 4;
        this._indexCount = 6;
        if (this._mesh) {
            this._vertCount = this._mesh.struct.vertexBundles[this._mesh.struct.primitives[0].vertexBundelIndices[0]].view.count;
            this._indexCount = this._mesh.struct.primitives[0].indexView!.count;
        }
        const vertexBuffer = this._device.createBuffer({
            usage: GFXBufferUsageBit.VERTEX | GFXBufferUsageBit.TRANSFER_DST,
            memUsage: GFXMemoryUsageBit.HOST | GFXMemoryUsageBit.DEVICE,
            size: this._vertSize * this._capacity * this._vertCount,
            stride: this._vertSize,
        });
        const vBuffer: ArrayBuffer = new ArrayBuffer(this._vertSize * this._capacity * this._vertCount);
        if (this._mesh) {
            let vIdx = this._vertAttrs!.findIndex((val) => val.name === GFXAttributeName.ATTR_TEX_COORD3);
            let vOffset = (this._vertAttrs![vIdx++] as any).offset;
            this._mesh.copyAttribute(0, GFXAttributeName.ATTR_POSITION, vBuffer, this._vertSize, vOffset);  // copy mesh position to ATTR_TEX_COORD3
            vOffset = (this._vertAttrs![vIdx++] as any).offset;
            this._mesh.copyAttribute(0, GFXAttributeName.ATTR_NORMAL, vBuffer, this._vertSize, vOffset);  // copy mesh normal to ATTR_NORMAL
            vOffset = (this._vertAttrs![this._vertAttrs!.findIndex((val) => val.name === GFXAttributeName.ATTR_TEX_COORD)] as any).offset;
            this._mesh.copyAttribute(0, GFXAttributeName.ATTR_TEX_COORD, vBuffer, this._vertSize, vOffset);  // copy mesh uv to ATTR_TEX_COORD
            vOffset = (this._vertAttrs![vIdx++] as any).offset;
            if (!this._mesh.copyAttribute(0, GFXAttributeName.ATTR_COLOR, vBuffer, this._vertSize, vOffset)) {  // copy mesh color to ATTR_COLOR1
                const vb = new Uint32Array(vBuffer);
                for (let iVertex = 0; iVertex < this._vertCount; ++iVertex) {
                    vb[iVertex * this._vertAttrsFloatCount + vOffset / 4] = Color.WHITE._val;
                }
            }
            const vbFloatArray = new Float32Array(vBuffer);
            for (let i = 1; i < this._capacity; i++) {
                vbFloatArray.copyWithin(i * this._vertSize * this._vertCount / 4, 0, this._vertSize * this._vertCount / 4);
            }
        }
        vertexBuffer.update(vBuffer);

        const indices: Uint16Array = new Uint16Array(this._capacity * this._indexCount);
        if (this._mesh) {
            this._mesh.copyIndices(0, indices);
            for (let i = 1; i < this._capacity; i++) {
                for (let j = 0; j < this._indexCount; j++) {
                    indices[i * this._indexCount + j] = indices[j] + i * this._vertCount;
                }
            }
        } else {
            let dst = 0;
            for (let i = 0; i < this._capacity; ++i) {
                const baseIdx = 4 * i;
                indices[dst++] = baseIdx;
                indices[dst++] = baseIdx + 1;
                indices[dst++] = baseIdx + 2;
                indices[dst++] = baseIdx + 3;
                indices[dst++] = baseIdx + 2;
                indices[dst++] = baseIdx + 1;
            }
        }

        const indexBuffer: GFXBuffer = this._device.createBuffer({
            usage: GFXBufferUsageBit.INDEX | GFXBufferUsageBit.TRANSFER_DST,
            memUsage: GFXMemoryUsageBit.HOST | GFXMemoryUsageBit.DEVICE,
            size: this._capacity * this._indexCount * Uint16Array.BYTES_PER_ELEMENT,
            stride: Uint16Array.BYTES_PER_ELEMENT,
        });

        indexBuffer.update(indices);

        this._iaInfo.drawInfos[0].vertexCount = this._capacity * this._vertCount;
        this._iaInfo.drawInfos[0].indexCount = this._capacity * this._indexCount;
        if (!this._iaInfoBufferReady) {
            this._iaInfoBuffer.initialize({
                usage: GFXBufferUsageBit.INDIRECT,
                memUsage: GFXMemoryUsageBit.HOST | GFXMemoryUsageBit.DEVICE,
                size: GFX_DRAW_INFO_SIZE,
                stride: GFX_DRAW_INFO_SIZE,
            });
            this._iaInfoBufferReady = true;
        }
        this._iaInfoBuffer.update(this._iaInfo);

        this._subMeshData = new RenderingSubMesh([vertexBuffer], this._vertAttrs!, GFXPrimitiveMode.TRIANGLE_LIST);
        this._subMeshData.indexBuffer = indexBuffer;
        this._subMeshData.indirectBuffer = this._iaInfoBuffer;

        this.setSubModelMesh(0, this._subMeshData!);
        return vBuffer;
    }

    public addParticleVertexData (index: number, pvdata: any[]) {
        if (!this._mesh) {
            let offset: number = index * this._vertAttrsFloatCount;
            this._vdataF32![offset++] = pvdata[0].x; // position
            this._vdataF32![offset++] = pvdata[0].y;
            this._vdataF32![offset++] = pvdata[0].z;
            this._vdataF32![offset++] = pvdata[1].x; // uv
            this._vdataF32![offset++] = pvdata[1].y;
            this._vdataF32![offset++] = pvdata[1].z; // frame idx
            this._vdataF32![offset++] = pvdata[2].x; // size
            this._vdataF32![offset++] = pvdata[2].y;
            this._vdataF32![offset++] = pvdata[2].z;
            this._vdataF32![offset++] = pvdata[3].x; // rotation
            this._vdataF32![offset++] = pvdata[3].y;
            this._vdataF32![offset++] = pvdata[3].z;
            this._vdataUint32![offset++] = pvdata[4]; // color
            if (pvdata[5]) {
                this._vdataF32![offset++] = pvdata[5].x; // velocity
                this._vdataF32![offset++] = pvdata[5].y;
                this._vdataF32![offset++] = pvdata[5].z;
            }
        } else {
            for (let i = 0; i < this._vertCount; i++) {
                let offset: number = (index * this._vertCount + i) * this._vertAttrsFloatCount;
                this._vdataF32![offset++] = pvdata[0].x; // position
                this._vdataF32![offset++] = pvdata[0].y;
                this._vdataF32![offset++] = pvdata[0].z;
                offset += 2;
                // this._vdataF32![offset++] = index;
                // this._vdataF32![offset++] = pvdata[1].y;
                this._vdataF32![offset++] = pvdata[1].z; // frame idx
                this._vdataF32![offset++] = pvdata[2].x; // size
                this._vdataF32![offset++] = pvdata[2].y;
                this._vdataF32![offset++] = pvdata[2].z;
                this._vdataF32![offset++] = pvdata[3].x; // rotation
                this._vdataF32![offset++] = pvdata[3].y;
                this._vdataF32![offset++] = pvdata[3].z;
                this._vdataUint32![offset++] = pvdata[4]; // color
            }
        }
    }

    public addGPUParticleVertexData (p: Particle, num: number, time:number) {
        let offset = num * this._vertAttrsFloatCount * this._vertCount;
        for (let i = 0; i < this._vertCount; i++) {
            let idx = offset;
            this._vdataF32![idx++] = p.position.x;
            this._vdataF32![idx++] = p.position.y;
            this._vdataF32![idx++] = p.position.z;
            this._vdataF32![idx++] = time;

            this._vdataF32![idx++] = p.startSize.x;
            this._vdataF32![idx++] = p.startSize.y;
            this._vdataF32![idx++] = p.startSize.z;
            this._vdataF32![idx++] = _uvs[2 * i];

            this._vdataF32![idx++] = p.rotation.x;
            this._vdataF32![idx++] = p.rotation.y;
            this._vdataF32![idx++] = p.rotation.z;
            this._vdataF32![idx++] = _uvs[2 * i + 1];

            this._vdataF32![idx++] = p.startColor.r / 255.0;
            this._vdataF32![idx++] = p.startColor.g / 255.0;
            this._vdataF32![idx++] = p.startColor.b / 255.0;
            this._vdataF32![idx++] = p.startColor.a / 255.0;

            this._vdataF32![idx++] = p.velocity.x;
            this._vdataF32![idx++] = p.velocity.y;
            this._vdataF32![idx++] = p.velocity.z;
            this._vdataF32![idx++] = p.startLifetime;

            this._vdataF32![idx++] = p.randomSeed;

            offset += this._vertAttrsFloatCount;
        }
    }

    public updateGPUParticles (num: number, time: number, dt: number) {
        const pSize = this._vertAttrsFloatCount * this._vertCount;
        let pBaseIndex = 0;
        let startTime = 0;
        let lifeTime = 0;
        let lastBaseIndex = 0;
        let interval = 0;
        for (let i = 0; i < num; ++i) {
            pBaseIndex = i * pSize;
            startTime = this._vdataF32![pBaseIndex + this._startTimeOffset];
            lifeTime = this._vdataF32![pBaseIndex + this._lifeTimeOffset];
            interval = time - startTime;
            if (lifeTime - interval < dt) {
                lastBaseIndex = -- num * pSize;
                this._vdataF32!.copyWithin(pBaseIndex, lastBaseIndex, lastBaseIndex + pSize);
                i--;
            }
        }

        return num;
    }

    public constructAttributeIndex () {
        if (!this._vertAttrs) {
            return;
        }
        let vIdx = this._vertAttrs!.findIndex((val) => val.name === 'a_position_starttime');
        let vOffset = (this._vertAttrs![vIdx] as any).offset;
        this._startTimeOffset = vOffset / 4 + 3;
        vIdx = this._vertAttrs!.findIndex((val) => val.name === 'a_dir_life');
        vOffset = (this._vertAttrs![vIdx] as any).offset;
        this._lifeTimeOffset = vOffset / 4 + 3;
    }

    public updateIA (count: number) {
        const ia = this._subModels[0].inputAssembler;
        ia.vertexBuffers[0].update(this._vdataF32!);
        ia.indexCount = this._indexCount * count;
        this._iaInfo.drawInfos[0] = ia;
        this._iaInfoBuffer.update(this._iaInfo);
    }

    public clear () {
        this._subModels[0].inputAssembler.indexCount = 0;
    }

    public destroy () {
        super.destroy();
        this._vBuffer = null;
        this._vdataF32 = null;
        this.destroySubMeshData();
        this._iaInfoBuffer.destroy();
        this._iaInfoBufferReady = false;
    }

    private _recreateBuffer () {
        this._vBuffer = this._createSubMeshData();
        this._vdataF32 = new Float32Array(this._vBuffer);
        this._vdataUint32 = new Uint32Array(this._vBuffer);
    }

    private destroySubMeshData () {
        if (this._subMeshData) {
            this._subMeshData.destroy();
            this._subMeshData = null;
        }
    }
}
