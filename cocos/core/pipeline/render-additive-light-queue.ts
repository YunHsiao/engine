/**
 * @category pipeline
 */

import { GFXCommandBuffer } from '../gfx/command-buffer';
import { Pass } from '../renderer';
import { SubModel } from '../renderer/scene/submodel';
import { IRenderObject, UBOForwardLight, DescriptorSetIndices } from './define';
import { IMacroPatch } from '../renderer/core/pass'
import { Light } from '../renderer';
import { LightType } from '../renderer/scene/light';
import { GFXDevice, GFXRenderPass, GFXBuffer, GFXDescriptorSet, IGFXDescriptorSetInfo, GFXDescriptorType, GFXShader } from '../gfx';
import { getPhaseID } from './pass-phase';
import { PipelineStateManager } from './pipeline-state-manager';
import { DescriptorSetPool, ShaderPool, PassHandle, PassView, PassPool } from '../renderer/core/memory-pools';

const spherePatches = [
    { name: 'CC_FORWARD_ADD', value: true },
];
const spotPatches = [
    { name: 'CC_FORWARD_ADD', value: true },
    { name: 'CC_SPOTLIGHT', value: true },
];

const _dsInfo: IGFXDescriptorSetInfo = { layout: null! };

function cloneDescriptorSet (device: GFXDevice, src: GFXDescriptorSet) {
    _dsInfo.layout = src.layout;
    const ds = device.createDescriptorSet(_dsInfo);
    for (let i = 0; i < _dsInfo.layout.length; i++) {
        switch (_dsInfo.layout[i]) {
            case GFXDescriptorType.UNIFORM_BUFFER:
                ds.bindBuffer(i, src.getBuffer(i));
                break;
            case GFXDescriptorType.UNIFORM_BUFFER:
                ds.bindSampler(i, src.getSampler(i));
                ds.bindTexture(i, src.getTexture(i));
                break;
        }
    }
    return ds;
}

interface ILightPSOCI {
    shader: GFXShader;
    descriptorSet: GFXDescriptorSet;
    hPass: PassHandle;
}

/**
 * @zh 叠加光照队列。
 */
export class RenderAdditiveLightQueue {

    private _sortedSubModelsArray: SubModel[][] = [];
    private _sortedPSOCIArray: ILightPSOCI[][] = [];
    private _phaseID = getPhaseID('forward-add');

    // references
    private _validLights: Light[] = [];
    private _lightBuffers: GFXBuffer[] = [];
    private _lightIndices: number[] = [];

    /**
     * @zh
     * 清空渲染队列。
     */
    public clear (validLights: Light[], lightBuffers: GFXBuffer[], lightIndices: number[]) {
        this._validLights = validLights;
        this._lightBuffers = lightBuffers;
        this._lightIndices = lightIndices;
        this._sortedSubModelsArray.length = this._sortedPSOCIArray.length = validLights.length;
        for(let i = 0; i < validLights.length; ++i) {
            if (this._sortedPSOCIArray[i]) {
                this._sortedSubModelsArray[i].length = 0;
                this._sortedPSOCIArray[i].length = 0;
            } else {
                this._sortedSubModelsArray[i] = [];
                this._sortedPSOCIArray[i] = [];
            }
        }
    }

    public add (renderObj: IRenderObject, subModelIdx: number, pass: Pass, beginIdx: number, endIdx: number) {
        if (pass.phase === this._phaseID) {
            for (let i = beginIdx; i < endIdx; i++) {
                const lightIdx = this._lightIndices[i];
                const light = this._validLights[lightIdx];
                switch (light.type) {
                    case LightType.SPHERE:
                        this.attach(renderObj, subModelIdx, this._lightBuffers[lightIdx], lightIdx, pass, spherePatches);
                        break;
                    case LightType.SPOT:
                        this.attach(renderObj, subModelIdx, this._lightBuffers[lightIdx], lightIdx, pass, spotPatches);
                        break;
                }
            }
        }
    }

    /**
     * @zh
     * 记录命令缓冲。
     */
    public recordCommandBuffer (device: GFXDevice, renderPass: GFXRenderPass, cmdBuff: GFXCommandBuffer) {
        for (let i = 0; i < this._sortedPSOCIArray.length; ++i) {
            for (let j = 0; j < this._sortedPSOCIArray[i].length; ++j) {
                const psoCI = this._sortedPSOCIArray[i][j];
                const ia = this._sortedSubModelsArray[i][j].inputAssembler!;
                const pso = PipelineStateManager.getOrCreatePipelineState(device, psoCI.hPass, psoCI.shader, renderPass, ia);
                cmdBuff.bindPipelineState(pso);
                cmdBuff.bindDescriptorSet(DescriptorSetIndices.MATERIAL_SPECIFIC, DescriptorSetPool.get(PassPool.get(psoCI.hPass, PassView.DESCRIPTOR_SET)));
                cmdBuff.bindDescriptorSet(DescriptorSetIndices.MODEL_LOCAL, psoCI.descriptorSet);
                cmdBuff.bindInputAssembler(ia);
                cmdBuff.draw(ia);
            }
        }
    }

    private attach (renderObj: IRenderObject, subModelIdx: number, lightBuffer: GFXBuffer, lightIdx: number, pass: Pass, patches: IMacroPatch[]) {
        const subModelList = this._sortedSubModelsArray[lightIdx];
        const psoCIList = this._sortedPSOCIArray[lightIdx];

        const modelPatches = renderObj.model.getMacroPatches(subModelIdx);
        const fullPatches = modelPatches ? patches.concat(modelPatches) : patches;
        const hPass = pass.handle;
        const shader = ShaderPool.get(pass.getShaderVariant(fullPatches));

        // TODO: cache & reuse
        const descriptorSet = cloneDescriptorSet(pass.device, renderObj.model.subModels[subModelIdx].descriptorSet);
        descriptorSet.bindBuffer(UBOForwardLight.BLOCK.binding, lightBuffer);
        descriptorSet.update();

        subModelList.push(renderObj.model.subModels[subModelIdx]);
        psoCIList.push({ hPass, shader, descriptorSet });
    }
}
